// ─── Score Parser ─────────────────────────────────────────────────────────────
//
// Accepted barline separators between measure number and content:
//   :   |        normal barline
//   |:           open repeat
//   :|           close repeat
//   ||           double barline (last one ends score)
//   ||:          double barline + open repeat
//   :||          close repeat + double barline
//   |:|          single-measure repeat

// ── Tuplet slot parser ─────────────────────────────────────────────────────────
// Parses the inner content of [N:...] — either compact (no +) or explicit (has +).
// Returns array of numbers (click durations in parts) or 'rest' strings.
// Returns null on parse error.
function parseTupletSlots(inner, div) {
  let slots;
  if (inner.includes('+')) {
    // Explicit form: split on +, each token is integer or run of dots
    const tokens = inner.split('+');
    // Mixed check: compact digits-only tokens alongside explicit are invalid
    slots = tokens.map(tok => {
      if (/^\d+$/.test(tok)) return parseInt(tok);
      if (/^\.+$/.test(tok)) return tok.length; // convert dots to rest count... wait
      return null;
    });
    // Actually dots in explicit form = rests: each dot = 1-part rest
    slots = tokens.flatMap(tok => {
      if (/^\d+$/.test(tok)) return [parseInt(tok)];
      if (/^\.+$/.test(tok)) return Array(tok.length).fill('rest');
      return [null];
    });
  } else {
    // Compact form: each character is one token
    slots = [];
    for (const ch of inner) {
      if (ch >= '1' && ch <= '9') slots.push(parseInt(ch));
      else if (ch === '.') slots.push('rest');
      else return null; // unexpected char
    }
  }
  if (slots.includes(null)) return null;
  // Validate: numeric slots sum to div; rests each count as 1 part
  const total = slots.reduce((s, v) => s + (v === 'rest' ? 1 : v), 0);
  if (total !== div) return null;
  return slots;
}

// Parses a grouping string like "2+2+3" or "[3:21]+1+1+1" or "2+[5:1..11]".
// Returns an array where each element is either:
//   number              — plain beat group (integer denom-units)
//   { units, div, slots } — tuplet beat group
function parseGrouping(str) {
  // Tokenise: split on '+' but respect [...] brackets (including leading digits like 2[3:21])
  // Compact form: no '+' and no '[' — treat each character as a digit token
  // e.g. "223" → [2, 2, 3],  "232" → [2, 3, 2]
  if (!str.includes('+') && !str.includes('[')) {
    return str.split('').map(Number);
  }

  const tokens = [];
  let i = 0;
  while (i < str.length) {
    // Find next '[', accounting for optional leading integer
    const brack = str.indexOf('[', i);
    const plus  = str.indexOf('+', i);
    if (brack !== -1 && (plus === -1 || brack <= plus)) {
      // Everything from i to ']' is one tuplet token (may have leading digit)
      const close = str.indexOf(']', brack);
      if (close === -1) return str.split('+').map(Number); // malformed, fall back
      tokens.push(str.slice(i, close + 1));
      i = close + 1;
      if (str[i] === '+') i++;
    } else if (plus !== -1) {
      tokens.push(str.slice(i, plus));
      i = plus + 1;
    } else {
      tokens.push(str.slice(i));
      break;
    }
  }

  return tokens.map(tok => {
    // Tuplet: optional N then [div:content], e.g. "2[3:21]" or "[3:21]"
    const m = tok.match(/^(\d*)\[(\d+):([0-9+.\[\]:]+)\]$/);
    if (m) {
      const units = m[1] ? parseInt(m[1]) : 1;
      const div   = parseInt(m[2]);
      const slots = parseTupletSlots(m[3], div);
      if (!slots) return NaN;
      return { units, div, slots };
    }
    return parseInt(tok);
  });
}

// Is this a usable grouping element?
// parseGrouping yields NaN for anything it could not read — a tuplet whose
// slots don't sum to its divisor, a stray token. Those must never reach the
// beat model: a NaN beat duration stalls the scheduler and a zero-length one
// spins it, in both cases silently.
function isValidGroupElement(g) {
  if (g !== null && typeof g === 'object')
    return Number.isInteger(g.units) && g.units > 0
        && Number.isInteger(g.div)   && g.div   > 0
        && Array.isArray(g.slots)    && g.slots.length > 0;
  return Number.isInteger(g) && g > 0;
}

// Split a line into its code part and its comment, mirroring the strip that
// parseScore applies. Exported so the editor and the help examples shade
// comments by the same rule the parser discards them by.
export function splitComment(line) {
  const m = line.match(/(\/\/|#)/);
  return m ? [line.slice(0, m.index), line.slice(m.index)] : [line, ''];
}

// A score names itself: the first comment line with any letters or digits in
// it. Decorative rules of box characters are skipped, so a header like
//   # ─────────────
//   # IV. JOURNEY TO UTNAPISHIM
// yields "IV. JOURNEY TO UTNAPISHIM". Returns null when the score has no such
// header, for the caller to number instead. Deriving the label rather than
// storing it means it travels with the text through copy, paste and export.
export function scoreLabel(text) {
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    // Only the header block counts. A comment further down is an annotation on
    // a passage, not a title for the piece.
    if (!line.startsWith('#') && !line.startsWith('//')) break;
    const body = line.replace(/^(#+|\/\/)\s*/, '').trim();
    if (/[\p{L}\p{N}]/u.test(body)) return body;
  }
  return null;
}

// Upper bound on measure numbers. The forward pass walks every measure from 1
// to the last one mentioned, so a mistyped '1000000||' costs ~190MB and a
// frozen tab. No real piece comes close — a Mahler symphony is around a
// thousand bars — so past this it is a typo, and saying so beats hanging.
export const MAX_MEASURES = 10000;

// SEP_RE: optional bracket open, digits, optional bracket close, separator, rest
const SEP_RE = /^(\[?)(\d+)(\]?)\s*(\|:\||:\|\||\|\|:|\|:|:\||\|\||[:|])\s*(.*)$/;

export function parseScore(text, t) {
  const srcLines = text.split('\n');
  // Text the parser drops on the floor: whole lines it cannot read, and
  // trailing junk on lines it can. Collected so the editor can colour it —
  // silently ignoring input is the failure mode hardest to notice.
  const ignored = [];

  const rawEvents = [];
  // Measure numbers must increase strictly down the score. Out-of-order or
  // repeated numbers were silently sorted into place before, which hid genuine
  // transpositions and let a document with several movements — each numbered
  // from 1 — collapse into one interleaved mess without a word of complaint.
  // (When parts arrive, this resets at each part boundary rather than per file.)
  let prevMeasure = 0;

  for (let li = 0; li < srcLines.length; li++) {
    const line = srcLines[li].replace(/\s*(\/\/|#).*$/, '').trim();
    if (!line) continue;
    const m = line.match(SEP_RE);
    if (!m) { ignored.push({ line: li, text: line }); continue; }
    // Fragments of this line that no field claimed. Collected as separate
    // pieces rather than one string: a field can be matched from the middle
    // of the line, leaving junk on both sides of it, and each side has to be
    // findable in the source on its own to be marked.
    const lineIgnored = [];
    const bracketed = m[1] === '[' && m[3] === ']';
    const measure   = parseInt(m[2]);
    if (measure <= prevMeasure) {
      throw new Error(t
        ? t.errMeasureOrder(li + 1, measure, prevMeasure)
        : `line ${li + 1}: m.${measure} comes after m.${prevMeasure} — measure numbers must increase down the score`);
    }
    prevMeasure = measure;
    const sep       = m[4];
    const rest      = m[5].trim();
    const ev        = { measure, sep };

    if (bracketed) ev.rehearsal = String(measure);

    let remaining = rest;
    const rehM = remaining.match(/^\[([^\]]+)\]/);
    if (rehM) { ev.rehearsal = rehM[1]; remaining = remaining.slice(rehM[0].length).trim(); }

    if ((sep === '||' || sep === ':||' || sep === '||:') && !ev.rehearsal && !remaining)
      ev.rehearsal = String(measure);

    if      (/^DC\s+al\s+Coda$/i.test(remaining))  { ev.directive = 'DC_CODA'; remaining = ''; }
    else if (/^DC\s+al\s+Fine$/i.test(remaining))   { ev.directive = 'DC_FINE'; remaining = ''; }
    else if (/^DS\s+al\s+Coda$/i.test(remaining))   { ev.directive = 'DS_CODA'; remaining = ''; }
    else if (/^DS\s+al\s+Fine$/i.test(remaining))   { ev.directive = 'DS_FINE'; remaining = ''; }
    else if (/^Fine$/i.test(remaining))               { ev.directive = 'FINE';    remaining = ''; }
    else if (/^Coda$/i.test(remaining))               { ev.directive = 'CODA';    remaining = ''; }

    if (remaining.startsWith('$')) { ev.segno    = true; remaining = remaining.slice(1).trim(); }
    if (remaining.startsWith('@')) { ev.codaJump = true; remaining = remaining.slice(1).trim(); }

    // From here the rest of the line is a list of unconsumed segments rather
    // than one string. Each field is cut out of whichever segment holds it,
    // splitting that segment in two. Keeping the pieces apart matters: a field
    // can sit in the middle of the line, and joining what is left on either
    // side of it would produce text that appears nowhere in the source and so
    // could not be located or marked.
    let segs = remaining ? [remaining] : [];

    // Cut the first match of `re` at or after segment `from`. Returns the
    // match and the index at which to continue searching, or null.
    function take(re, from = 0) {
      for (let i = from; i < segs.length; i++) {
        const mm = segs[i].match(re);
        if (!mm) continue;
        const at     = segs[i].indexOf(mm[0]);
        const before = segs[i].slice(0, at).trim();
        const after  = segs[i].slice(at + mm[0].length).trim();
        segs.splice(i, 1, ...[before, after].filter(Boolean));
        return { m: mm, next: before ? i + 1 : i };
      }
      return null;
    }

    const tsR = take(/(\d+)\/(\d+)(?![.=])/);
    if (tsR) {
      ev.numerator   = parseInt(tsR.m[1]);
      ev.denominator = parseInt(tsR.m[2]);
    }

    // A grouping may alternate from bar to bar. All four spellings mean the
    // same cycle: (23,32)  (2+3,3+2)  (23),(32)  (2+3),(3+2)
    // Commas cannot occur inside a tuplet, so splitting on them is safe.
    const grpR = take(/\((?:[0-9+.\[\]:,]+)\)(?:\s*,?\s*\((?:[0-9+.\[\]:,]+)\))*/);
    if (grpR) {
      ev.groupingCycle = grpR.m[0]
        .match(/\(([0-9+.\[\]:,]+)\)/g)
        .flatMap(par => par.slice(1, -1).split(','))
        .map(alt => alt.trim())
        .filter(Boolean)
        .map(parseGrouping);
    }

    if (take(/\ba tempo\b/i)) ev.atempo = true;

    // The rit target is whichever tempo follows the keyword; the main tempo is
    // whichever one precedes it. Searching for the target only from after the
    // keyword's segment is what keeps the two apart.
    const ritR = take(/\b(rit|accel)\b/i);
    if (ritR) {
      ev.ritKind = ritR.m[1].toLowerCase();
      const tgtR = take(/1\/(\d+)(\.?)\s*=\s*(\d+)/, ritR.next);
      if (tgtR) {
        ev.ritTargetDenom  = parseInt(tgtR.m[1]);
        ev.ritTargetDotted = tgtR.m[2] === '.';
        ev.ritTargetBPM    = parseInt(tgtR.m[3]);
      }
    }

    const tempoR = take(/1\/(\d+)(\.?)\s*=\s*(\d+)/);
    if (tempoR) {
      ev.tempoDenom  = parseInt(tempoR.m[1]);
      ev.tempoDotted = tempoR.m[2] === '.';
      ev.tempoBPM    = parseInt(tempoR.m[3]);
    }

    // Whatever is left is ignored, already in source order. Commas and
    // semicolons are decorative in this syntax ("4/4, 1/4=90"), so a fragment
    // made only of those does not count.
    for (const frag of segs)
      if (frag.replace(/[,;]/g, '').trim()) ignored.push({ line: li, text: frag });

    rawEvents.push(ev);
  }

  const changes    = {};
  const barlines   = {};
  const directives = {};
  const segnos     = {};
  const codaJumps  = {};
  let lastDoublebar = null;

  for (const ev of rawEvents) {
    const mn = ev.measure;
    barlines[mn] = ev.sep;
    if (ev.directive)  directives[mn] = ev.directive;
    if (ev.segno)      segnos[mn]     = true;
    if (ev.codaJump)   codaJumps[mn]  = true;
    if (ev.sep === '||' || ev.sep === ':||' || ev.sep === '||:') lastDoublebar = mn;
    if (!changes[mn]) changes[mn] = {};
    if (ev.rehearsal)   changes[mn].rehearsal   = ev.rehearsal;
    if (ev.numerator)   changes[mn].numerator   = ev.numerator;
    if (ev.denominator) changes[mn].denominator = ev.denominator;
    if (ev.groupingCycle) changes[mn].groupingCycle = ev.groupingCycle;
    if (ev.tempoBPM) {
      changes[mn].tempoDenom  = ev.tempoDenom;
      changes[mn].tempoDotted = ev.tempoDotted || false;
      changes[mn].tempoBPM    = ev.tempoBPM;
    }
    if (ev.ritKind) {
      changes[mn].ritKind = ev.ritKind;
      if (ev.ritTargetBPM) {
        changes[mn].ritTargetBPM    = ev.ritTargetBPM;
        changes[mn].ritTargetDenom  = ev.ritTargetDenom;
        changes[mn].ritTargetDotted = ev.ritTargetDotted;
      }
    }
    if (ev.atempo) changes[mn].atempo = true;
  }

  const highestMeasure = Math.max(...Object.keys(changes).map(Number), 1);
  if (highestMeasure > MAX_MEASURES) {
    throw new Error(t
      ? t.errTooManyMeasures(highestMeasure, MAX_MEASURES)
      : `m.${highestMeasure}: measure number exceeds the limit of ${MAX_MEASURES} — check for a typo`);
  }

  const lastDefinedMeasure = highestMeasure;
  const noExplicitEnd      = lastDoublebar === null;
  const endAt              = noExplicitEnd ? lastDefinedMeasure : lastDoublebar;

  // The final || is the end-of-piece marker, not a section boundary.
  // Clear any auto-rehearsal that was set solely because of the || rule.
  if (!noExplicitEnd && changes[endAt] && changes[endAt].rehearsal === String(endAt))
    delete changes[endAt].rehearsal;

  const warnings = [];

  // ── Forward pass: build measures[] ──────────────────────────────────────────
  let state = { numerator: 4, denominator: 4, grouping: null, cycle: null, cycleStart: 1, tempoDenom: 4, tempoDotted: false, tempoBPM: 120 };
  const measures       = [];
  const knownGroupings = {};

  for (let mn = 1; mn <= endAt; mn++) {
    if (changes[mn]) {
      const c      = changes[mn];
      const newNum = c.numerator   ?? state.numerator;
      const newDen = c.denominator ?? state.denominator;
      // Validate and expand one alternative of a cycle.
      const resolveAlt = (g) => {
        if (!g.length || !g.every(isValidGroupElement)) {
          warnings.push(t ? t.warnGroupingInvalid(mn) : `m.${mn}: malformed grouping — a tuplet's slots must sum to its divisor; grouping ignored`);
          return null;
        }
        if (g.length === 1) {
          // Single-element shortcut: tile to fill the measure if it divides evenly
          const elemUnits = typeof g[0] === 'object' ? g[0].units : g[0];
          if (newNum % elemUnits !== 0) {
            warnings.push(t ? t.warnGroupingNotDivisible(mn, elemUnits, newNum, newDen) : `m.${mn}: grouping element (${elemUnits} unit${elemUnits !== 1 ? 's' : ''}) does not divide ${newNum}/${newDen} evenly — grouping ignored`);
            return null;
          }
          return Array.from({ length: newNum / elemUnits }, () => g[0]);
        }
        return g;
      };

      let cycle      = state.cycle;
      let cycleStart = state.cycleStart;

      if (c.groupingCycle) {
        // A declaration always restarts the cycle here, whatever its length —
        // a plain grouping is just a cycle of one.
        const alts = c.groupingCycle.map(resolveAlt).filter(Boolean);
        cycle      = alts.length ? alts : null;
        cycleStart = mn;
        if (cycle) knownGroupings[`${newNum}/${newDen}`] = cycle;
      } else if (newNum !== state.numerator || newDen !== state.denominator) {
        // New time signature: take up its remembered cycle from the top.
        cycle      = knownGroupings[`${newNum}/${newDen}`] ?? null;
        cycleStart = mn;
      }

      state = {
        numerator:   newNum,
        denominator: newDen,
        cycle,
        cycleStart,
        tempoDenom:  c.tempoDenom  ?? state.tempoDenom,
        tempoDotted: c.tempoDotted ?? state.tempoDotted,
        tempoBPM:    c.tempoBPM    ?? state.tempoBPM,
        rehearsal:   c.rehearsal   ?? undefined,
      };
    } else {
      state = { ...state, rehearsal: undefined };
    }

    // Position in the cycle is counted from the bar where it was declared, and
    // recomputed for EVERY bar — including bars with nothing declared on them,
    // which is most of them. Deriving it only where something is declared is
    // the difference between a cycle and a one-off.
    state = {
      ...state,
      grouping: state.cycle
        ? state.cycle[(mn - state.cycleStart) % state.cycle.length]
        : null,
    };

    measures[mn] = {
      ...state,
      measureNumber: mn,
      barline:   barlines[mn]   || ':',
      directive: directives[mn] || null,
      segno:     segnos[mn]     || false,
      codaJump:  codaJumps[mn]  || false,
      isEnd:     mn === endAt,
    };
  }

  // ── Rit/accel span pass ──────────────────────────────────────────────────────
  {
    const tempoMeasures = Object.keys(changes).map(Number).sort((a, b) => a - b);

    for (const startMn of tempoMeasures) {
      const c = changes[startMn];
      if (!c.ritKind) continue;

      const startMs     = measures[startMn];
      if (!startMs) continue;
      const startBPM    = startMs.tempoBPM;
      const startDenom  = startMs.tempoDenom;
      const startDotted = startMs.tempoDotted;

      let endMn = null, endBPM = null, endDenom = startDenom, endDotted = startDotted;
      let isAtempo = false;

      for (const mn of tempoMeasures) {
        if (mn <= startMn) continue;
        const nc = changes[mn];
        if (nc.atempo) {
          endMn = mn; isAtempo = true;
          endBPM = startBPM; endDenom = startDenom; endDotted = startDotted;
          break;
        }
        if (nc.tempoBPM) {
          endMn = mn; endBPM = nc.tempoBPM;
          endDenom  = nc.tempoDenom  ?? startDenom;
          endDotted = nc.tempoDotted ?? startDotted;
          break;
        }
      }

      let targetBPM, targetDenom, targetDotted;
      if (c.ritTargetBPM) {
        targetBPM    = c.ritTargetBPM;
        targetDenom  = c.ritTargetDenom  ?? startDenom;
        targetDotted = c.ritTargetDotted ?? startDotted;
      } else if (endBPM !== null && !isAtempo) {
        targetBPM = endBPM; targetDenom = endDenom; targetDotted = endDotted;
      } else if (c.ritTargetBPM === undefined && isAtempo) {
        warnings.push(t ? t.warnRitNeedsTarget(startMn) : `m.${startMn}: 'rit'/'accel' needs a target tempo, e.g. rit 1/4=60`);
        continue;
      } else {
        warnings.push(t ? t.warnRitNoTarget(startMn) : `m.${startMn}: 'rit'/'accel' has no target tempo and no following tempo mark`);
        continue;
      }

      if (endMn === null) {
        if (c.ritTargetBPM) {
          endMn = endAt + 1;
        } else {
          warnings.push(t ? t.warnRitNoFollowing(startMn) : `m.${startMn}: 'rit'/'accel' has no following tempo mark or 'a tempo'`);
          continue;
        }
      }

      let totalUnits = 0;
      const offsets  = {};
      for (let mn = startMn; mn < endMn; mn++) {
        if (!measures[mn]) continue;
        offsets[mn]  = totalUnits;
        totalUnits  += measures[mn].numerator;
      }
      if (totalUnits === 0) continue;

      const span = { kind: c.ritKind, startBPM, startDenom, startDotted,
                     targetBPM, targetDenom, targetDotted, totalUnits, endMn, isAtempo };

      for (let mn = startMn; mn < endMn; mn++) {
        if (!measures[mn]) continue;
        measures[mn].ritAccelSpan   = span;
        measures[mn].ritAccelOffset = offsets[mn];
      }

      if (isAtempo && measures[endMn]) {
        measures[endMn].tempoBPM    = startBPM;
        measures[endMn].tempoDenom  = startDenom;
        measures[endMn].tempoDotted = startDotted;
        for (let mn = endMn + 1; mn <= endAt; mn++) {
          if (changes[mn]?.tempoBPM) break;
          if (measures[mn]) {
            measures[mn].tempoBPM    = startBPM;
            measures[mn].tempoDenom  = startDenom;
            measures[mn].tempoDotted = startDotted;
          }
        }
      }
    }
  }

  // ── Build playback sequence ──────────────────────────────────────────────────
  let segnoAt = null;
  let codaAt  = null;

  for (let mn = 1; mn <= endAt; mn++) {
    const ms = measures[mn];
    if (!ms) continue;
    if (ms.segno)                  segnoAt = mn;
    if (ms.directive === 'CODA')   codaAt  = mn;
  }

  const seq          = [];
  const repeatPairs  = {};
  let anyRepeatSeen  = false;

  {
    const stack = [];
    for (let n = 1; n <= endAt; n++) {
      const sep = (measures[n] || {}).barline || ':';
      if (sep === '|:|') { repeatPairs[n] = n; anyRepeatSeen = true; continue; }
      const isClose            = sep === ':|';
      const isConditionalClose = sep === ':||';
      if (isClose || isConditionalClose) {
        if (stack.length > 0) {
          repeatPairs[n] = stack.pop();
        } else if (isClose) {
          if (anyRepeatSeen)
            warnings.push(t ? t.warnCloseRepeatNoOpen(n) : `m.${n}: close-repeat ':|' has no matching open repeat`);
          repeatPairs[n] = 1;
        } else {
          warnings.push(t ? t.warnDoubleBarNoOpen(n) : `m.${n}: ':||' has no matching open repeat — use '||' to end the score`);
        }
      }
      if (sep === '|:' || sep === '||:') {
        // Nested repeat signs are not standard notation — repetition at a
        // larger scale is written with D.C./D.S. instead. Warn, but still
        // pair innermost-first so playback stays predictable.
        if (stack.length > 0)
          warnings.push(t ? t.warnNestedRepeat(n, stack[stack.length - 1]) : `m.${n}: opens a repeat while the one at m.${stack[stack.length - 1]} is still open — nested repeats are not standard notation; use D.C./D.S. for larger-scale repetition`);
        stack.push(n);
        anyRepeatSeen = true;
      }
    }
  }

  const isRepeatClose = (sep, n) =>
    sep === ':|' || sep === '|:|' || (sep === ':||' && repeatPairs[n] !== undefined);

  function walk(startMn, endMn, ignoreRepeats, stopAtFine, stopAtCodaJump) {
    const repeatVisited = new Set();
    let n = startMn;
    while (n <= endMn) {
      if (seq.length >= 10000) return 'done';
      const ms = measures[n];
      if (!ms) { n++; continue; }
      const sep     = ms.barline;
      const isClose = !ignoreRepeats && isRepeatClose(sep, n);
      seq.push(n);
      if (isClose && !repeatVisited.has(n)) {
        repeatVisited.add(n);
        n = repeatPairs[n] ?? 1;
        continue;
      }
      if (stopAtFine    && ms.directive === 'FINE') return 'fine';
      if (stopAtCodaJump && ms.codaJump)            return 'coda';
      if (!ignoreRepeats) {
        const dir = ms.directive;
        if (dir === 'DC_FINE' || dir === 'DC_CODA') {
          const result = walk(1, endMn, true, dir === 'DC_FINE', dir === 'DC_CODA');
          if (result === 'coda' && codaAt !== null) walk(codaAt, endAt, true, false, false);
          return 'done';
        }
        if (dir === 'DS_FINE' || dir === 'DS_CODA') {
          const from   = segnoAt ?? 1;
          const result = walk(from, endMn, true, dir === 'DS_FINE', dir === 'DS_CODA');
          if (result === 'coda' && codaAt !== null) walk(codaAt, endAt, true, false, false);
          return 'done';
        }
      }
      if (ms.isEnd) return 'done';
      n++;
    }
    return 'done';
  }

  const hasDCDS = Object.values(directives).some(d => d === 'DC_CODA' || d === 'DS_CODA');
  if (hasDCDS && codaAt !== null) {
    walk(1, codaAt - 1, false, false, false);
  } else {
    walk(1, endAt, false, false, false);
  }

  return { measures, seq, endAt, segnoAt, codaAt, warnings, ignored, loopScore: noExplicitEnd };
}
