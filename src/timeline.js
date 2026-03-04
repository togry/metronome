// ─── Timeline helpers ─────────────────────────────────────────────────────────
//
// Pure functions — no React dependency.

export function getTimelineEvents(measures, endAt) {
  const events  = [];
  let prevSig   = null;
  const mNums   = Object.keys(measures).map(Number).filter(n => n >= 1).sort((a, b) => a - b);

  for (const mn of mNums) {
    const ms = measures[mn];
    if (!ms) continue;
    const sig = `${ms.numerator}/${ms.denominator}|${(ms.grouping || []).join(',')}|${ms.tempoBPM}`;

    const openRepeat  = ms.barline === '|:'  || ms.barline === '||:' || ms.barline === '|:|';
    const closeRepeat = ms.barline === ':|'  || ms.barline === ':||' || ms.barline === '|:|';

    // Left-edge: sig change, rehearsal, open-repeat, directives, segno, codaJump
    if (ms.rehearsal || sig !== prevSig || mn === 1 || openRepeat ||
        ms.directive || ms.segno || ms.codaJump) {
      events.push({
        measure: mn, rightEdge: false,
        rehearsal: ms.rehearsal,
        numerator: ms.numerator, denominator: ms.denominator,
        grouping: ms.grouping, tempoBPM: ms.tempoBPM,
        isFine: false,
        directive: ms.directive, barline: ms.barline,
        segno: ms.segno, codaJump: ms.codaJump,
        openRepeat, closeRepeat: false,
      });
    }

    // Right-edge: close-repeat or end barline
    if (closeRepeat || ms.isEnd) {
      events.push({
        measure: mn, rightEdge: true,
        rehearsal: null, numerator: ms.numerator, denominator: ms.denominator,
        grouping: null, tempoBPM: ms.tempoBPM,
        isFine: ms.isEnd,
        directive: null, barline: ms.barline,
        segno: false, codaJump: false,
        openRepeat: false, closeRepeat,
      });
    }

    prevSig = sig;
  }
  return events;
}

// Compute seq-index bounds for the user loop region [loopStartMn, loopEndMn]
export function computeLoopSeqBounds(seq, loopStartMn, loopEndMn) {
  let s = -1;
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] >= loopStartMn && seq[i] <= loopEndMn) { s = i; break; }
  }
  if (s < 0) return { s: 0, e: 1 };
  let e = s + 1;
  for (let i = s + 1; i < seq.length; i++) {
    if      (seq[i] >= loopStartMn && seq[i] <= loopEndMn) e = i + 1;
    else break;
  }
  return { s, e };
}
