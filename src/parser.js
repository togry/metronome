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

// SEP_RE: optional bracket open, digits, optional bracket close, separator, rest
const SEP_RE = /^(\[?)(\d+)(\]?)\s*(\|:\||:\|\||\|\|:|\|:|:\||\|\||[:|])\s*(.*)$/;

export function parseScore(text) {
  const lines = text.split('\n')
    .map(l => l.replace(/\s*(\/\/|#).*$/, '').trim())
    .filter(l => l);

  const rawEvents = [];

  for (const line of lines) {
    const m = line.match(SEP_RE);
    if (!m) continue;
    const bracketed = m[1] === '[' && m[3] === ']';
    const measure   = parseInt(m[2]);
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

    const tsM = remaining.match(/(\d+)\/(\d+)(?![.=])/);
    if (tsM) {
      ev.numerator   = parseInt(tsM[1]);
      ev.denominator = parseInt(tsM[2]);
      remaining = remaining.slice(remaining.indexOf(tsM[0]) + tsM[0].length).trim();
    }

    const grpM = remaining.match(/\(([0-9+]+)\)/);
    if (grpM) {
      ev.grouping = grpM[1].split('+').map(Number);
      remaining = remaining.slice(remaining.indexOf(grpM[0]) + grpM[0].length).trim();
    }

    if (/\ba tempo\b/i.test(remaining)) {
      ev.atempo  = true;
      remaining  = remaining.replace(/\ba tempo\b/i, '').trim();
    }

    const ritM = remaining.match(/\b(rit|accel)\b/i);
    if (ritM) {
      ev.ritKind      = ritM[1].toLowerCase();
      const ritIdx    = remaining.search(/\b(rit|accel)\b/i);
      const beforeRit = remaining.slice(0, ritIdx).trim();
      const afterRit  = remaining.slice(ritIdx + ritM[0].length).trim();
      remaining       = beforeRit;
      const ritTempoM = afterRit.match(/1\/(\d+)(\.?)\s*=\s*(\d+)/);
      if (ritTempoM) {
        ev.ritTargetDenom  = parseInt(ritTempoM[1]);
        ev.ritTargetDotted = ritTempoM[2] === '.';
        ev.ritTargetBPM    = parseInt(ritTempoM[3]);
      }
    }

    const tempoM = remaining.match(/1\/(\d+)(\.?)\s*=\s*(\d+)/);
    if (tempoM) {
      ev.tempoDenom  = parseInt(tempoM[1]);
      ev.tempoDotted = tempoM[2] === '.';
      ev.tempoBPM    = parseInt(tempoM[3]);
    }

    rawEvents.push(ev);
  }

  rawEvents.sort((a, b) => a.measure - b.measure);

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
    if (ev.grouping)    changes[mn].grouping    = ev.grouping;
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

  const lastDefinedMeasure = Math.max(...Object.keys(changes).map(Number), 1);
  const noExplicitEnd      = lastDoublebar === null;
  const endAt              = noExplicitEnd ? lastDefinedMeasure : lastDoublebar;

  // ── Forward pass: build measures[] ──────────────────────────────────────────
  let state = { numerator: 4, denominator: 4, grouping: null, tempoDenom: 4, tempoDotted: false, tempoBPM: 120 };
  const measures       = [];
  const knownGroupings = {};

  for (let mn = 1; mn <= endAt; mn++) {
    if (changes[mn]) {
      const c      = changes[mn];
      const newNum = c.numerator   ?? state.numerator;
      const newDen = c.denominator ?? state.denominator;
      let resolvedGrouping;
      if (c.grouping) {
        resolvedGrouping = c.grouping;
        knownGroupings[`${newNum}/${newDen}`] = c.grouping;
      } else {
        resolvedGrouping =
          knownGroupings[`${newNum}/${newDen}`]
          ?? (newNum === state.numerator && newDen === state.denominator ? state.grouping : null);
      }
      state = {
        numerator:   newNum,
        denominator: newDen,
        grouping:    resolvedGrouping,
        tempoDenom:  c.tempoDenom  ?? state.tempoDenom,
        tempoDotted: c.tempoDotted ?? state.tempoDotted,
        tempoBPM:    c.tempoBPM    ?? state.tempoBPM,
        rehearsal:   c.rehearsal   ?? undefined,
      };
    } else {
      state = { ...state, rehearsal: undefined };
    }
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
  const warnings = [];
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
        warnings.push(`m.${startMn}: 'rit'/'accel' needs a target tempo, e.g. rit 1/4=60`);
        continue;
      } else {
        warnings.push(`m.${startMn}: 'rit'/'accel' has no target tempo and no following tempo mark`);
        continue;
      }

      if (endMn === null) {
        if (c.ritTargetBPM) {
          endMn = endAt + 1;
        } else {
          warnings.push(`m.${startMn}: 'rit'/'accel' has no following tempo mark or 'a tempo'`);
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
            warnings.push(`m.${n}: close-repeat ':|' has no matching open repeat`);
          repeatPairs[n] = 1;
        } else {
          warnings.push(`m.${n}: ':||' has no matching open repeat — use '||' to end the score`);
        }
      }
      if (sep === '|:' || sep === '||:') { stack.push(n); anyRepeatSeen = true; }
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

  return { measures, seq, endAt, segnoAt, codaAt, warnings, loopScore: noExplicitEnd };
}
