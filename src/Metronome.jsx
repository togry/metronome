// ─── Metronomicon ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';

import { parseScore }                   from './parser.js';
import { getBeatPattern, getPrimaryGroups, oneDenomUnitSec, tickDurationSec } from './beatModel.js';
import { getTimelineEvents, computeLoopSeqBounds } from './timeline.js';
import { SUBDIV_OPTIONS, PALETTES, DEFAULT_SCORE, RIT_EXAMPLE_SCORE } from './constants.js';

import ScorePanel  from './components/ScorePanel.jsx';
import HelpModal   from './components/HelpModal.jsx';
import Timeline    from './components/Timeline.jsx';
import MeasureGrid from './components/MeasureGrid.jsx';

export default function Metronome() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState('dark');
  const C = PALETTES[theme];

  // ── Score ──────────────────────────────────────────────────────────────────
  const [scoreText,     setScoreText]     = useState(DEFAULT_SCORE);
  const [parsed,        setParsed]        = useState(() => parseScore(DEFAULT_SCORE));
  const [parseError,    setParseError]    = useState('');
  const [parseWarnings, setParseWarnings] = useState([]);
  const [scoreWidth,    setScoreWidth]    = useState(270);
  const [showScore,     setShowScore]     = useState(false); // mobile drawer

  // ── Playback state ─────────────────────────────────────────────────────────
  const [playing,        setPlaying]        = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  // currentBeat and flash drive visuals that update every tick. Bypassing React
  // state for these avoids a full component re-render on every click — instead
  // we mutate DOM nodes directly via refs.
  const currentBeatRef   = useRef(0);
  const flashRef         = useRef(null);   // 'measure' | 'primary' | 'unit' | null
  const flashDotsRef     = useRef({});     // { measure, primary, unit } → DOM element
  const patternDotsRef   = useRef([]);     // array of DOM elements, one per beat dot
  const [startMeasure,   setStartMeasure]   = useState(1);
  const [previewMeasure, setPreviewMeasure] = useState(1);
  const [loopStart,      setLoopStart]      = useState(null);
  const [loopEnd,        setLoopEnd]        = useState(null);

  // ── Controls ───────────────────────────────────────────────────────────────
  const [subdivIdx,      setSubdivIdx]      = useState(0);
  const [tempoScale,     setTempoScale]     = useState(100);
  const [btLatency,      setBtLatency]      = useState(0);
  const [showBtSlider,   setShowBtSlider]   = useState(false);
  const [countInEnabled, setCountInEnabled] = useState(false);
  const [countInBeats,   setCountInBeats]   = useState(4);
  const [countInDenom,   setCountInDenom]   = useState(4);
  const [countingIn,     setCountingIn]     = useState(false);
  const [countInRemaining, setCountInRemaining] = useState(0);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [showHelp,  setShowHelp]  = useState(false);
  const [winWidth,  setWinWidth]  = useState(typeof window !== 'undefined' ? window.innerWidth  : 800);
  const [winHeight, setWinHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 600);

  const rootRef = useRef(null);
  useEffect(() => {
    const onResize = () => { setWinWidth(window.innerWidth); setWinHeight(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const mobile   = winWidth  < 700;
  const portrait = winHeight > winWidth;

  // ── Scheduler refs ─────────────────────────────────────────────────────────
  const audioCtxRef        = useRef(null);

  const posRef             = useRef({ seqIdx: 0, tick: 0 });
  const nextTickTimeRef    = useRef(0);
  const isPlayingRef       = useRef(false);
  const parsedRef          = useRef(parsed);          parsedRef.current = parsed;
  // Pending visual update — written by scheduler, consumed by rAF loop
  // { measure, beat, weight, fireAt } where fireAt is ctx.currentTime value
  const pendingVisualRef   = useRef(null);
  const rafRef             = useRef(null);
  const subdivIdxRef       = useRef(subdivIdx);       subdivIdxRef.current = subdivIdx;
  const tempoScaleRef      = useRef(tempoScale / 100); tempoScaleRef.current = tempoScale / 100;
  const btLatencyRef       = useRef(btLatency / 1000); btLatencyRef.current = btLatency / 1000;
  const startMeasureRef    = useRef(startMeasure);    startMeasureRef.current = startMeasure;
  const loopStartRef       = useRef(loopStart);       loopStartRef.current = loopStart;
  const loopEndRef         = useRef(loopEnd);         loopEndRef.current = loopEnd;
  const loopSeqStartRef    = useRef(-1);
  const loopSeqEndRef      = useRef(0);
  const timelineRef        = useRef(null);
  const timelineScrollRef  = useRef(null);
  const dragStateRef       = useRef(null);
  const lastTapRef         = useRef({ mn: null, time: 0 });
  const skipPlayEffectRef  = useRef(false);
  const playBtnRef         = useRef(null);
  const countInEnabledRef  = useRef(countInEnabled); countInEnabledRef.current = countInEnabled;
  const countInBeatsRef    = useRef(countInBeats);   countInBeatsRef.current = countInBeats;
  const countInDenomRef    = useRef(countInDenom);   countInDenomRef.current = countInDenom;
  const totalMeasuresRef   = useRef(0);
  const currentMeasureRef  = useRef(1);
  const themeRef           = useRef(theme);          themeRef.current = theme;
  const mobileRef          = useRef(mobile);         mobileRef.current = mobile;

  // Keep previewMeasure in sync while playing
  useEffect(() => {
    if (playing) setPreviewMeasure(currentMeasure);
  }, [playing, currentMeasure]);

  // ── Audio ──────────────────────────────────────────────────────────────────
  function getAudioCtx() {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed')
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }

  // ── Scheduler ─────────────────────────────────────────────────────────────
  const scheduleNext = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPlayingRef.current) return;
    const { measures, seq } = parsedRef.current;
    // 150ms lookahead: long enough that the rAF-driven scheduler never falls behind.
    const scheduleUntil = ctx.currentTime + 0.15;

    while (nextTickTimeRef.current < scheduleUntil) {
      const { seqIdx, tick } = posRef.current;
      const loopE = loopEndRef.current;

      // Loop region
      if (loopE !== null) {
        const loopStartMn = loopStartRef.current ?? startMeasureRef.current;
        if (loopSeqStartRef._loopS !== loopStartMn || loopSeqStartRef._loopE !== loopE) {
          const { s, e } = computeLoopSeqBounds(seq, loopStartMn, loopE);
          loopSeqStartRef.current = s;
          loopSeqEndRef.current   = e;
          loopSeqStartRef._loopS  = loopStartMn;
          loopSeqStartRef._loopE  = loopE;
        }
        if (seqIdx >= loopSeqEndRef.current) {
          posRef.current = { seqIdx: loopSeqStartRef.current, tick: 0 };
          continue;
        }
      }
      if (loopE === null) {
        loopSeqStartRef._loopS = undefined;
        loopSeqStartRef._loopE = undefined;
      }

      // End of sequence
      if (seqIdx >= seq.length) {
        if (parsedRef.current.loopScore) {
          posRef.current = { seqIdx: 0, tick: 0 };
          continue;
        }
        isPlayingRef.current = false;
        setPlaying(false);
        return;
      }

      const measure = seq[seqIdx];
      const mState  = measures[measure];
      if (!mState) { isPlayingRef.current = false; setPlaying(false); return; }

      const targetDenom = SUBDIV_OPTIONS[subdivIdxRef.current].targetDenom;
      const pattern     = getBeatPattern(mState, targetDenom);
      const tickIdx     = tick % pattern.length;
      const tickData    = pattern[tickIdx];
      const t           = nextTickTimeRef.current;

      // Audio
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      const [freq, vol] =
        tickData.weight === 3 ? [1400, 0.80] :
        tickData.weight === 2 ? [950,  0.60] :
        tickData.weight === 1 ? [700,  0.40] :
                                [460,  0.15];
      osc.frequency.value = freq;
      const tAudio = Math.max(ctx.currentTime, t - btLatencyRef.current);
      g.gain.setValueAtTime(vol, tAudio);
      g.gain.exponentialRampToValueAtTime(0.001, tAudio + 0.05);
      osc.start(tAudio); osc.stop(tAudio + 0.07);

      // Queue visual update — consumed by the rAF loop.
      // Storing fireAt (audio clock value) lets the rAF loop fire with
      // sub-millisecond accuracy instead of relying on setTimeout jitter.
      if (!pendingVisualRef.current) pendingVisualRef.current = [];
      pendingVisualRef.current.push({
        measure,
        beat:    tickIdx,
        weight:  tickData.weight,
        fireAt:  t,   // ctx.currentTime value at which visuals should fire
      });

      if (tick + 1 >= pattern.length) posRef.current = { seqIdx: seqIdx + 1, tick: 0 };
      else posRef.current = { seqIdx, tick: tick + 1 };

      nextTickTimeRef.current += tickData.durationUnits * tickDurationSec(mState, pattern, tickIdx, tempoScaleRef.current);
    }
  }, []);

  useEffect(() => {
    if (!playing) {
      isPlayingRef.current = false;
      setCountingIn(false);
      setCountInRemaining(0);
      return;
    }
    if (skipPlayEffectRef.current) {
      skipPlayEffectRef.current = false;
      return;
    }
    const ctx = getAudioCtx();
    nextTickTimeRef.current = ctx.currentTime + 0.05;
    isPlayingRef.current    = true;
    scheduleNext();
  }, [playing, scheduleNext]);

  // ── rAF visual loop ────────────────────────────────────────────────────────
  // Polls pendingVisualRef every animation frame (~16ms). When ctx.currentTime
  // reaches a queued event's fireAt time, DOM mutations are applied immediately —
  // no setTimeout jitter on the main thread.
  useEffect(() => {
    const FLASH_COLORS_DARK  = { measure: '#ff3333', primary: '#ffaa00', unit: '#00ccff' };
    const FLASH_COLORS_LIGHT = { measure: '#b80e0e', primary: '#7a3e00', unit: '#003d66' };

    // Dim all pattern dots unconditionally — don't rely on _active flag
    // since React ref callbacks reset _active without updating DOM styles.
    function dimAllDots() {
      const dark = themeRef.current === 'dark';
      for (const dot of patternDotsRef.current) {
        if (!dot) continue;
        dot._active          = false;
        const col            = dot._col;
        dot.style.background = col + (dark ? '33' : '55');
        dot.style.boxShadow  = 'none';
        dot.style.border     = `1.5px solid ${col}${dark ? '77' : '99'}`;
      }
    }

    function applyVisual({ measure: capM, beat: capT, weight }, lightDot) {
      const capFlash    = weight >= 3 ? 'measure' : weight >= 2 ? 'primary' : 'unit';
      const isDark      = themeRef.current === 'dark';
      const mobileNow   = mobileRef.current;
      const flashColors = isDark ? FLASH_COLORS_DARK : FLASH_COLORS_LIGHT;

      // Coarse state update — re-render only when measure actually changes
      if (capM !== currentMeasureRef.current) {
        currentMeasureRef.current = capM;
        setCurrentMeasure(capM);
      }

      currentBeatRef.current = capT;
      flashRef.current       = capFlash;

      // Header flash dots — always update all three so inactive ones dim
      for (const key of ['measure', 'primary', 'unit']) {
        const el = flashDotsRef.current[key];
        if (!el) continue;
        const active = lightDot && key === capFlash;
        const col    = flashColors[key];
        const sz     = active ? (mobileNow ? '20px' : '22px') : (mobileNow ? '11px' : '13px');
        el.style.width      = sz;
        el.style.height     = sz;
        el.style.background = active ? col : col + '28';
        el.style.boxShadow  = active ? `0 0 14px ${col}, 0 0 28px ${col}55` : 'none';
        const label = el.parentElement?.nextElementSibling;
        if (label) label.style.color = active ? col : (isDark ? '#7a7aaa' : '#5a4e38');
      }

      // Pattern dots — always dim everything first, then optionally light capT
      dimAllDots();
      if (lightDot) {
        const activeDot = patternDotsRef.current[capT];
        if (activeDot) {
          activeDot._active          = true;
          const col                  = activeDot._col;
          activeDot.style.background = col;
          activeDot.style.boxShadow  = `0 0 14px ${col}, 0 0 6px ${col}`;
          activeDot.style.border     = `1.5px solid ${col}ff`;
        }
      }
    }

    function rafLoop() {
      const ctx = audioCtxRef.current;

      // Run the audio scheduler every frame — replaces setInterval.
      // rAF fires ~every 16ms which is well within the 150ms lookahead.
      if (isPlayingRef.current) scheduleNext();

      if (ctx && pendingVisualRef.current?.length) {
        const now   = ctx.currentTime;
        const queue = pendingVisualRef.current;
        let i = 0;
        while (i < queue.length && queue[i].fireAt <= now) i++;
        if (i > 0) {
          // For intermediate ticks (between frames): update state + dim but don't
          // light a dot — lighting then immediately dimming causes a visible burst.
          // Only the last due event gets the full lit treatment.
          for (let j = 0; j < i - 1; j++) applyVisual(queue[j], false);
          applyVisual(queue[i - 1], true);
          pendingVisualRef.current = queue.slice(i);
        }
      }
      rafRef.current = requestAnimationFrame(rafLoop);
    }

    rafRef.current = requestAnimationFrame(rafLoop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      // Dim all dots on unmount
      for (const el of Object.values(flashDotsRef.current)) {
        if (el) el.style.boxShadow = 'none';
      }
      const dark = themeRef.current === 'dark';
      for (const dot of patternDotsRef.current) {
        if (!dot || !dot._active) continue;
        dot._active          = false;
        dot.style.background = dot._col + (dark ? '33' : '55');
        dot.style.boxShadow  = 'none';
        dot.style.border     = `1.5px solid ${dot._col}${dark ? '77' : '99'}`;
      }
    };
  }, []);

  // ── Play / Stop ────────────────────────────────────────────────────────────
  function handlePlay() {
    if (playing) { setPlaying(false); return; }
    const ctx       = getAudioCtx();
    const realStart = Math.max(1, startMeasure);
    const { seq }   = parsedRef.current;
    const startIdx  = Math.max(0, seq.findIndex(mn => mn >= realStart));
    posRef.current  = { seqIdx: startIdx, tick: 0 };
    currentMeasureRef.current = seq[startIdx] ?? realStart;
    setCurrentMeasure(seq[startIdx] ?? realStart);
    setPreviewMeasure(seq[startIdx] ?? realStart);
    currentBeatRef.current = 0;
    flashRef.current = null;

    if (countInEnabledRef.current) {
      const { measures } = parsedRef.current;
      const mState       = measures[realStart] || measures[1];
      const scale        = tempoScaleRef.current;
      const ciDenom      = countInDenomRef.current;
      const ciBeats      = countInBeatsRef.current;
      const { tempoBPM, tempoDenom } = mState;
      const oneBeatSec   = (tempoDenom / ciDenom) * (60 / (tempoBPM * scale));
      const startT       = ctx.currentTime + 0.05;

      setCountingIn(true);
      setCountInRemaining(ciBeats);

      for (let i = 0; i < ciBeats; i++) {
        const t = startT + i * oneBeatSec;
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.value = i === 0 ? 1400 : 1000;
        g.gain.setValueAtTime(i === 0 ? 0.7 : 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t); osc.stop(t + 0.06);
        const capRemaining = ciBeats - i;
        setTimeout(() => {
          setCountingIn(true);
          setCountInRemaining(capRemaining);
          const capFlash = i === 0 ? 'measure' : 'primary';
          flashRef.current = capFlash;
          const isDark = themeRef.current === 'dark';
          const flashColors = isDark
            ? { measure: '#ff3333', primary: '#ffaa00', unit: '#00ccff' }
            : { measure: '#b80e0e', primary: '#7a3e00', unit: '#003d66' };
          const mobileNow = mobileRef.current;
          for (const key of ['measure', 'primary', 'unit']) {
            const el = flashDotsRef.current[key];
            if (!el) continue;
            const active = key === capFlash;
            const col = flashColors[key];
            const sz = active ? (mobileNow ? '20px' : '22px') : (mobileNow ? '11px' : '13px');
            el.style.width      = sz;
            el.style.height     = sz;
            el.style.background = active ? col : col + '28';
            el.style.boxShadow  = active ? `0 0 14px ${col}, 0 0 28px ${col}55` : 'none';
          }
        }, Math.max(0, (t - ctx.currentTime) * 1000));
      }

      const scoreStartT = startT + ciBeats * oneBeatSec;
      setTimeout(() => {
        setCountingIn(false);
        setCountInRemaining(0);
      }, Math.max(0, (scoreStartT - ctx.currentTime) * 1000));

      nextTickTimeRef.current   = scoreStartT;
      isPlayingRef.current      = true;
      scheduleNext();
      skipPlayEffectRef.current = true;
      setPlaying(true);
    } else {
      setPlaying(true);
    }
  }

  // ── Parse handlers ─────────────────────────────────────────────────────────
  function handleParse() {
    try {
      const p = parseScore(scoreText);
      setParsed(p);
      setParseError('');
      setParseWarnings(p.warnings || []);
      setStartMeasure(1); setPreviewMeasure(1);
      setLoopStart(null); setLoopEnd(null);
    } catch (e) { setParseError(e.message); }
  }

  async function handleClearPasteParse() {
    try {
      const text = await navigator.clipboard.readText();
      setScoreText(text);
      try {
        const p = parseScore(text);
        setParsed(p); setParseError(''); setParseWarnings(p.warnings || []);
        setStartMeasure(1); setPreviewMeasure(1);
        setLoopStart(null); setLoopEnd(null);
        if (mobile) setShowScore(false);
      } catch (e) { setParseError(e.message); }
    } catch {
      setParseError("Clipboard read failed — paste manually and click PARSE");
    }
  }

  function handleRunExample(example) {
    setScoreText(example);
    try {
      const p = parseScore(example);
      setParsed(p); setParseError(''); setParseWarnings(p.warnings || []);
      setStartMeasure(1); setPreviewMeasure(1);
      setLoopStart(null); setLoopEnd(null);
    } catch (e) { setParseError(e.message); }
    setShowHelp(false);
  }

  // ── Timeline geometry ──────────────────────────────────────────────────────
  const { measures, seq, endAt } = parsed;
  const totalMeasures = endAt ?? Object.values(measures).filter(Boolean).length;
  totalMeasuresRef.current = totalMeasures;

  const MIN_PX_PER_MEASURE    = 22;
  const timelineContentWidth  = Math.max(totalMeasures * MIN_PX_PER_MEASURE, 200);
  const pxPerSlot             = timelineContentWidth / Math.max(1, totalMeasures);
  const measPx                = (mn) => Math.round((mn - 1) * pxPerSlot);

  function measureFromX(x) {
    const scrollEl = timelineScrollRef.current;
    const rect = scrollEl.getBoundingClientRect();
    const px   = (x - rect.left) + scrollEl.scrollLeft;
    return Math.max(1, Math.min(totalMeasures, Math.floor(px / pxPerSlot) + 1));
  }

  // ── Timeline event handlers ────────────────────────────────────────────────
  function handleTimelineMouseDown(e) {
    e.preventDefault();
    const mn = measureFromX(e.clientX);
    if (e.shiftKey) {
      if (mn > startMeasure) setLoopEnd(mn);
    } else {
      dragStateRef.current = { anchorMn: mn };
      setStartMeasure(mn); setPreviewMeasure(mn);
      setLoopStart(null);  setLoopEnd(null);
      if (isPlayingRef.current) {
        const { seq: s } = parsedRef.current;
        const idx = Math.max(0, s.findIndex(m => m >= mn));
        posRef.current = { seqIdx: idx, tick: 0 };
        setCurrentMeasure(s[idx] ?? mn); currentBeatRef.current = 0;
      }
    }
  }

  function handleTimelineMouseMove(e) {
    if (!dragStateRef.current) return;
    const { anchorMn } = dragStateRef.current;
    const mn = measureFromX(e.clientX);
    if (mn !== anchorMn) {
      const lo = Math.min(anchorMn, mn), hi = Math.max(anchorMn, mn);
      setStartMeasure(lo); setPreviewMeasure(lo);
      setLoopStart(lo);    setLoopEnd(hi);
    }
  }

  function handleTimelineMouseUp() { dragStateRef.current = null; }

  function handleTimelineTouchStart(e) {
    if (e.touches.length >= 2) { dragStateRef.current = null; return; }
    const touch = e.touches[0];
    const mn    = measureFromX(touch.clientX);
    const now   = Date.now();
    const last  = lastTapRef.current;
    if (last.mn !== null && now - last.time < 350) {
      lastTapRef.current   = { mn: null, time: 0 };
      dragStateRef.current = { anchorMn: mn, startX: touch.clientX, loopMode: true, confirmed: false };
      setLoopStart(mn); setLoopEnd(mn);
    } else {
      lastTapRef.current   = { mn, time: now };
      dragStateRef.current = { anchorMn: mn, startX: touch.clientX, startY: touch.clientY, loopMode: false, confirmed: false };
    }
  }

  function handleTimelineTouchMove(e) {
    if (e.touches.length >= 2) { dragStateRef.current = null; return; }
    if (!dragStateRef.current) return;
    const touch = e.touches[0];
    const { anchorMn, startX, startY, loopMode } = dragStateRef.current;
    if (loopMode) {
      e.preventDefault();
      const mn = measureFromX(touch.clientX);
      const lo = Math.min(anchorMn, mn), hi = Math.max(anchorMn, mn);
      setLoopStart(lo); setLoopEnd(hi);
      setStartMeasure(lo); setPreviewMeasure(lo);
      dragStateRef.current.confirmed = true;
      return;
    }
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - (startY ?? touch.clientY));
    if (dx > 8 || dy > 8) dragStateRef.current = null;
  }

  function handleTimelineTouchEnd() {
    if (!dragStateRef.current) return;
    const { anchorMn, loopMode, confirmed } = dragStateRef.current;
    if (!loopMode && !confirmed) {
      setStartMeasure(anchorMn); setPreviewMeasure(anchorMn);
      setLoopStart(null);        setLoopEnd(null);
      if (isPlayingRef.current) {
        const { seq: s } = parsedRef.current;
        const idx = Math.max(0, s.findIndex(mn => mn >= anchorMn));
        posRef.current = { seqIdx: idx, tick: 0 };
        setCurrentMeasure(s[idx] ?? anchorMn); currentBeatRef.current = 0;
      }
    }
    dragStateRef.current = null;
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleTimelineMouseMove);
    window.addEventListener('mouseup',  handleTimelineMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleTimelineMouseMove);
      window.removeEventListener('mouseup',  handleTimelineMouseUp);
    };
  }, [playing, startMeasure]);

  // Auto-scroll timeline
  useEffect(() => {
    const scrollEl = timelineScrollRef.current;
    if (!scrollEl) return;
    const targetMn = playing ? currentMeasure : startMeasure;
    const px       = measPx(targetMn);
    const vw       = scrollEl.clientWidth;
    const sl       = scrollEl.scrollLeft;
    const margin   = Math.max(40, vw * 0.2);
    if      (px < sl + margin)          scrollEl.scrollLeft = Math.max(0, px - margin);
    else if (px > sl + vw - margin)     scrollEl.scrollLeft = px - vw + margin;
  }, [currentMeasure, startMeasure, playing]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (isPlayingRef.current) setPlaying(false);
        else playBtnRef.current?.click();
        return;
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const total = totalMeasuresRef.current;
      const cur   = startMeasureRef.current;
      const loopE = loopEndRef.current;
      const loopS = loopStartRef.current;
      const dir   = e.key === 'ArrowRight' ? 1 : -1;
      if (e.shiftKey) {
        const loopIsFromHere = loopE !== null && loopS === cur;
        if (loopIsFromHere) {
          setLoopEnd(Math.max(cur + 1, Math.min(total, loopE + dir)));
        } else {
          const far = Math.max(1, Math.min(total, cur + dir));
          if (far !== cur) {
            setLoopStart(Math.min(cur, far));
            setLoopEnd(Math.max(cur, far));
          }
        }
      } else {
        const newMn = Math.max(1, Math.min(total, cur + dir));
        setStartMeasure(newMn); setPreviewMeasure(newMn);
        if (isPlayingRef.current) {
          const { seq: s } = parsedRef.current;
          const idx = Math.max(0, s.findIndex(mn => mn >= newMn));
          posRef.current = { seqIdx: idx, tick: 0 };
          setCurrentMeasure(s[idx] ?? newMn); currentBeatRef.current = 0;
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Derived display ────────────────────────────────────────────────────────
  const timelineEvents = getTimelineEvents(measures, endAt);
  const targetDenom    = SUBDIV_OPTIONS[subdivIdx].targetDenom;
  const previewMs      = measures[previewMeasure] || measures[startMeasure] || measures[1];
  const previewPattern = previewMs ? getBeatPattern(previewMs, targetDenom) : [];
  // Reset the pattern dot refs array whenever the pattern length changes
  // (new time sig, new subdivide setting) so stale refs don't linger.
  if (patternDotsRef.current.length !== previewPattern.length) {
    patternDotsRef.current = new Array(previewPattern.length).fill(null);
  }
  // activeBeat is only used for the initial render; the DOM is updated directly during playback.
  const activeBeat     = -1;
  const dispMn         = playing ? currentMeasure : previewMeasure;

  let lastRM = null;
  for (let m = dispMn; m >= 1; m--) {
    if (measures[m]?.rehearsal) { lastRM = { mark: measures[m].rehearsal, atCurrent: m === dispMn }; break; }
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const selectStyle = {
    background: C.bgDark, border: `1px solid ${C.border}`, color: C.text,
    padding: mobile ? '8px 10px' : '6px 10px', fontFamily: 'monospace',
    fontSize: mobile ? 14 : 12, borderRadius: 3, outline: 'none', cursor: 'pointer',
  };

  const measureReadout = (large) => {
    const mn  = playing ? currentMeasure : previewMeasure;
    const ms  = measures[mn];
    const sig = ms ? `[${ms.numerator}/${ms.denominator}${ms.grouping ? ' ' + ms.grouping.join('+') : ''}]` : '';
    const sz  = large ? 38 : 32;
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: large ? 8 : 6, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: sz, color: C.gold, fontWeight: 'bold', lineHeight: 1 }}>{mn}</span>
          <span style={{ fontSize: sz, color: C.gold, fontWeight: 'bold', lineHeight: 1 }}>{sig}</span>
        </div>
        <div style={{ fontSize: large ? 13 : 11, letterSpacing: 2, minHeight: '1.4em',
          color: lastRM ? (lastRM.atCurrent ? C.gold : C.reh) : 'transparent' }}>
          {lastRM ? `[${lastRM.mark}]` : '·'}
        </div>
      </div>
    );
  };

  // ── Score panel (shared between desktop sidebar and mobile overlay) ─────────
  const scorePanel = (
    <ScorePanel
      C={C} mobile={mobile}
      scoreText={scoreText} setScoreText={setScoreText}
      parseError={parseError} parseWarnings={parseWarnings}
      onParse={() => { handleParse(); if (mobile) setShowScore(false); }}
      onClearPasteParse={handleClearPasteParse}
      onClose={() => setShowScore(false)}
      scoreWidth={scoreWidth}
    />
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} style={{
      height: '100vh', background: C.bg, color: C.text,
      fontFamily: "'Courier New', monospace",
      display: 'flex', flexDirection: 'column', userSelect: 'none',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        padding: mobile ? '10px 14px' : '12px 22px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: C.bgMid, flexShrink: 0,
      }}>
        {mobile && (
          <button onClick={() => setShowScore(true)} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.code, padding: '6px 10px', cursor: 'pointer',
            borderRadius: 3, fontSize: 12, letterSpacing: 1,
          }}>SCORE</button>
        )}
        <div style={{ fontSize: mobile ? 14 : 17, letterSpacing: 4, color: C.gold, fontWeight: 'bold' }}>♩ METRONOMICON</div>
        {!mobile && <div style={{ fontSize: 9, color: C.textFaint, letterSpacing: 3 }}>SCORE-AWARE METRONOME</div>}

        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to daylight palette' : 'Switch to night palette'}
          style={{
            background: theme === 'dark' ? 'transparent' : C.borderHi,
            border: `1px solid ${C.border}`, color: theme === 'dark' ? C.primary : C.bg,
            borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1,
            marginLeft: mobile ? 4 : 8,
          }}
        >{theme === 'dark' ? '☀' : '🌙'}</button>

        <button
          onClick={() => setShowHelp(true)}
          title="Help"
          style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textDim, borderRadius: '50%', width: 26, height: 26,
            cursor: 'pointer', fontSize: 13, lineHeight: 1,
            marginLeft: mobile ? 4 : 8, flexShrink: 0,
          }}
        >?</button>

        {/* Beat flash indicators */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: mobile ? 8 : 10, alignItems: 'center' }}>
          {[
            { key: 'measure', col: C.measure, label: 'MEAS' },
            { key: 'primary', col: C.primary, label: 'BEAT' },
            { key: 'unit',    col: C.unit,    label: 'UNIT' },
          ].map(({ key, col, label }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: mobile ? 22 : 24, height: mobile ? 22 : 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  ref={el => { if (el) flashDotsRef.current[key] = el; }}
                  style={{
                    width: mobile ? '11px' : '13px',
                    height: mobile ? '11px' : '13px',
                    borderRadius: '50%',
                    background: col + '28',
                    border: `1px solid ${col}55`,
                    boxShadow: 'none',
                  }}
                />
              </div>
              {!mobile && <div style={{ fontSize: 8, color: C.textFaint, letterSpacing: 1 }}>{label}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile score drawer */}
      {mobile && showScore && scorePanel}

      {/* Help modal */}
      {showHelp && (
        <HelpModal C={C} mobile={mobile} onClose={() => setShowHelp(false)} onRunExample={handleRunExample} />
      )}

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, ...(mobile && !portrait ? { overflow: 'auto', WebkitOverflowScrolling: 'touch' } : {}) }}>

        {/* Desktop score sidebar */}
        {!mobile && scorePanel}

        {/* Resizable divider */}
        {!mobile && (
          <div
            onMouseDown={e => {
              e.preventDefault();
              const startX = e.clientX;
              const startW = scoreWidth;
              const onMove = mv => setScoreWidth(Math.max(180, Math.min(600, startW + mv.clientX - startX)));
              const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
            style={{ width: 5, cursor: 'col-resize', flexShrink: 0, background: C.border, opacity: 0.5, transition: 'opacity 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = 0.5; }}
          />
        )}

        {/* ── Main panel ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0, ...(mobile && !portrait ? { overflow: 'visible', minHeight: 'unset' } : {}) }}>

          {/* Controls row 1: play, count-in, measure readout */}
          <div style={{
            padding: mobile ? '8px 12px' : '12px 20px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', gap: mobile ? 8 : 18,
            alignItems: mobile ? 'center' : 'flex-end',
            flexWrap: mobile ? 'nowrap' : 'wrap',
            background: C.bgMid, flexShrink: 0,
            ...(mobile && !portrait ? { flexWrap: 'wrap' } : {}),
          }}>
            <button ref={playBtnRef} onClick={handlePlay} style={{
              background: playing ? C.redDim : C.greenDim,
              border: `2px solid ${playing ? C.red : C.green}`,
              color: countingIn ? C.gold : playing ? (theme === 'light' ? C.red : '#ff8888') : C.green,
              padding: mobile ? '12px 18px' : '9px 22px',
              cursor: 'pointer', borderRadius: 4,
              fontSize: mobile ? 16 : 13, letterSpacing: 3,
              fontFamily: 'monospace', minWidth: mobile ? 90 : 100, flexShrink: 0,
            }}>
              {countingIn ? `${countInRemaining}…` : playing ? '◼' : '▶'}
            </button>

            {/* Count-in */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 3,
              padding: '5px 8px',
              background: countInEnabled ? '#0a1a0a' : 'transparent',
              border: `1px solid ${countInEnabled ? '#336633' : C.border}`,
              borderRadius: 4, flexShrink: 0,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={countInEnabled}
                  onChange={e => setCountInEnabled(e.target.checked)}
                  style={{ accentColor: C.green, cursor: 'pointer', width: mobile ? 16 : 13, height: mobile ? 16 : 13 }}
                />
                <span style={{ fontSize: mobile ? 10 : 9, color: countInEnabled ? C.green : C.textFaint, letterSpacing: 1 }}>
                  COUNT IN
                </span>
              </label>
              {countInEnabled && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <select value={countInBeats} onChange={e => setCountInBeats(parseInt(e.target.value))}
                    style={{ ...selectStyle, width: mobile ? 52 : 42 }}>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                  <select value={countInDenom} onChange={e => setCountInDenom(parseInt(e.target.value))}
                    style={{ ...selectStyle, width: mobile ? 64 : 54 }}>
                    <option value={4}>4ths</option>
                    <option value={8}>8ths</option>
                  </select>
                </div>
              )}
            </div>

            {/* Mobile measure readout */}
            {mobile && (
              <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: C.textFaint, letterSpacing: 1 }}>{playing ? 'NOW' : 'M.'}</div>
                {measureReadout(false)}
              </div>
            )}
          </div>

          {/* Controls row 2: subdivide, tempo, BT, desktop measure readout */}
          <div style={{
            padding: mobile ? '6px 12px' : '0 20px 8px',
            borderBottom: mobile ? `1px solid ${C.border}` : 'none',
            display: 'flex', gap: mobile ? 8 : 18,
            alignItems: 'flex-end', flexWrap: 'wrap',
            background: C.bgMid, flexShrink: 0,
            ...(mobile ? {} : { paddingTop: 8 }),
            ...(portrait ? { overflowY: 'auto', maxHeight: '38vh', WebkitOverflowScrolling: 'touch' } : {}),
            ...(mobile && !portrait ? { flexShrink: 0 } : {}),
          }}>
            {/* Subdivide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 9, color: C.textFaint, letterSpacing: 1 }}>SUBDIVIDE</label>
              <select value={subdivIdx} onChange={e => setSubdivIdx(parseInt(e.target.value))}
                style={{ ...selectStyle, minWidth: mobile ? 160 : 180 }}>
                {SUBDIV_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
              </select>
            </div>

            {/* Tempo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: mobile ? 1 : 'unset' }}>
              <label style={{ fontSize: 9, color: C.textFaint, letterSpacing: 1 }}>
                TEMPO &nbsp;
                <span style={{ color: C.gold, fontSize: 11 }}>{tempoScale}%</span>
                {previewMs && (
                  <span style={{ color: C.textDim, fontSize: 10 }}>
                    &nbsp;= {Math.round(previewMs.tempoBPM * tempoScale / 100)} bpm
                  </span>
                )}
              </label>
              <input type="range" min={10} max={150} step={1} value={tempoScale}
                onChange={e => setTempoScale(parseInt(e.target.value))}
                style={{ width: mobile ? '100%' : 160, accentColor: C.gold, cursor: 'pointer' }}
              />
            </div>

            {/* BT latency */}
            {(() => {
              const active = btLatency > 0;
              if (showBtSlider) return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 9, color: active ? C.unit : C.textFaint, letterSpacing: 1,
                      cursor: 'pointer', userSelect: 'none' }} onClick={() => setShowBtSlider(false)}>
                      BT <span style={{ color: C.textDim, fontSize: 10 }}>{btLatency} ms</span> ▲
                    </label>
                    {active && (
                      <button onClick={() => setBtLatency(0)} style={{
                        background: 'transparent', border: 'none', color: C.textFaint,
                        fontSize: 9, cursor: 'pointer', padding: 0, lineHeight: 1,
                      }}>✕</button>
                    )}
                  </div>
                  <input type="range" min={0} max={500} step={10} value={btLatency}
                    onChange={e => setBtLatency(parseInt(e.target.value))}
                    style={{ width: mobile ? 110 : 120, accentColor: C.unit, cursor: 'pointer' }}
                  />
                </div>
              );
              return (
                <button onClick={() => setShowBtSlider(true)} style={{
                  background: active ? `${C.unit}18` : 'transparent',
                  border: `1px solid ${active ? C.unit : C.border}`,
                  color: active ? C.unit : C.textFaint,
                  borderRadius: 3, padding: '3px 7px', cursor: 'pointer',
                  fontSize: 9, letterSpacing: 1, alignSelf: 'flex-end', marginBottom: 2,
                }}>
                  BT{active ? ` ${btLatency}` : ''}
                </button>
              );
            })()}

            {/* Desktop measure readout */}
            {!mobile && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: C.textFaint, letterSpacing: 2 }}>{playing ? 'PLAYING' : 'MEASURE'}</div>
                {measureReadout(true)}
              </div>
            )}
          </div>

          {/* Pattern visualizer */}
          <div style={{
            padding: mobile ? '8px 12px' : '12px 20px',
            borderBottom: `1px solid ${C.border}`,
            background: C.bgDark, flexShrink: 0,
            ...(mobile && !portrait ? { flexShrink: 0 } : {}),
          }}>
            <div style={{ fontSize: 9, color: C.textFaint, letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span>PATTERN</span>
              <span style={{ color: C.gold }}>
                m.{previewMeasure}
                {measures[previewMeasure]?.rehearsal && (
                  <span style={{ color: C.reh }}> [{measures[previewMeasure].rehearsal}]</span>
                )}
              </span>
              {previewMs && (() => {
                const groups = getPrimaryGroups(previewMs);
                return (
                  <span style={{ color: C.textDim }}>
                    {groups.join('+')} × {previewMs.denominator === 2 ? '½' : previewMs.denominator === 4 ? '¼' : `1/${previewMs.denominator}`}
                    {' → '}{previewPattern.length} click{previewPattern.length !== 1 ? 's' : ''}
                  </span>
                );
              })()}
              {loopEnd !== null && <span style={{ color: C.orange }}>↺ m.{loopStart ?? startMeasure}–{loopEnd - 1}</span>}
            </div>
            <div style={{ display: 'flex', gap: mobile ? 6 : 5, flexWrap: 'wrap', alignItems: 'center' }}
              ref={() => { patternDotsRef.current.length = previewPattern.length; }}
            >
              {previewPattern.map((tick, i) => {
                const col = tick.weight === 3 ? C.measure : tick.weight === 2 ? C.primary : tick.weight === 1 ? C.unit : C.sub;
                const sz  = mobile
                  ? (tick.weight === 3 ? 34 : tick.weight === 2 ? 26 : tick.weight === 1 ? 18 : 11)
                  : (tick.weight === 3 ? 30 : tick.weight === 2 ? 22 : tick.weight === 1 ? 15 : 9);
                return (
                  <div
                    key={i}
                    ref={el => {
                      if (el) {
                        patternDotsRef.current[i] = el;
                        el._col    = col;
                        el._active = false;
                      }
                    }}
                    style={{
                      width: sz, height: sz,
                      borderRadius: tick.weight >= 2 ? 4 : '50%',
                      background: col + (theme === 'light' ? '55' : '33'),
                      border: `1.5px solid ${col}${theme === 'light' ? '99' : '77'}`,
                      boxShadow: 'none',
                      flexShrink: 0,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <Timeline
            C={C} mobile={mobile}
            totalMeasures={totalMeasures}
            timelineContentWidth={timelineContentWidth}
            pxPerSlot={pxPerSlot}
            measPx={measPx}
            timelineEvents={timelineEvents}
            loopStart={loopStart} loopEnd={loopEnd}
            startMeasure={startMeasure} currentMeasure={currentMeasure}
            playing={playing}
            timelineRef={timelineRef} timelineScrollRef={timelineScrollRef}
            onMouseDown={handleTimelineMouseDown}
            onTouchStart={handleTimelineTouchStart}
            onTouchMove={handleTimelineTouchMove}
            onTouchEnd={handleTimelineTouchEnd}
          />

          {/* Start / loop inputs */}
          <div style={{
            padding: mobile ? '6px 12px' : '8px 20px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', gap: mobile ? 10 : 20, alignItems: 'center', flexWrap: 'wrap',
            background: C.bgMid, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ fontSize: 9, color: C.textFaint, letterSpacing: 1 }}>START</label>
              <input type="number" min={1} max={totalMeasures} value={startMeasure}
                onChange={e => {
                  const v = Math.max(1, parseInt(e.target.value) || 1);
                  setStartMeasure(v);
                  if (!playing) setPreviewMeasure(v);
                }}
                style={{
                  background: C.bgDark, border: `1px solid ${C.border}`, color: C.text,
                  padding: mobile ? '6px 8px' : '4px 8px', width: 65,
                  fontFamily: 'monospace', fontSize: 13, borderRadius: 3, outline: 'none',
                }}
              />
            </div>
            {loopEnd !== null && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <label style={{ fontSize: 9, color: C.textFaint, letterSpacing: 1 }}>LOOP END</label>
                  <input type="number" min={startMeasure + 1} max={totalMeasures} value={loopEnd}
                    onChange={e => setLoopEnd(Math.max(startMeasure + 1, parseInt(e.target.value) || startMeasure + 1))}
                    style={{
                      background: C.bgDark, border: `1px solid ${C.border}`, color: C.text,
                      padding: mobile ? '6px 8px' : '4px 8px', width: 65,
                      fontFamily: 'monospace', fontSize: 13, borderRadius: 3, outline: 'none',
                    }}
                  />
                </div>
                <button onClick={() => { setLoopStart(null); setLoopEnd(null); }} style={{
                  background: C.redDim, border: '1px solid #442222', color: '#cc6666',
                  padding: mobile ? '8px 12px' : '4px 10px',
                  cursor: 'pointer', borderRadius: 3, fontSize: 11, letterSpacing: 1,
                  fontFamily: 'monospace', marginTop: mobile ? 0 : 14,
                }}>CLEAR LOOP</button>
              </>
            )}
            <div style={{ marginLeft: 'auto', fontSize: 10, color: C.textDim }}>
              {loopEnd !== null ? `↺ m.${loopStart ?? startMeasure}–${loopEnd}` : `start m.${startMeasure}`}
            </div>
          </div>

          {/* Measure grid */}
          <MeasureGrid
            C={C} mobile={mobile} portrait={portrait}
            measures={measures}
            playing={playing}
            currentMeasure={currentMeasure}
            previewMeasure={previewMeasure}
            startMeasure={startMeasure}
            loopStart={loopStart} loopEnd={loopEnd}
            onMeasureClick={mn => {
              setStartMeasure(mn); setLoopStart(null); setLoopEnd(null);
              if (!playing) setPreviewMeasure(mn);
            }}
          />

        </div>
      </div>
    </div>
  );
}
