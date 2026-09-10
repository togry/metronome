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

    // Left-edge: sig change, rehearsal, open-repeat, directives, segno, codaJump.
    // For the final measure (isEnd), treat the || as a plain barline so it doesn't
    // render as a new-section double-barline — the isFine right-edge event handles that.
    const leftBarline = ms.isEnd ? ':' : ms.barline;
    if (ms.rehearsal || sig !== prevSig || mn === 1 || openRepeat ||
        ms.directive || ms.segno || ms.codaJump) {
      events.push({
        measure: mn, rightEdge: false,
        rehearsal: ms.rehearsal,
        numerator: ms.numerator, denominator: ms.denominator,
        grouping: ms.grouping, tempoBPM: ms.tempoBPM,
        isFine: false,
        directive: ms.directive, barline: leftBarline,
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

// ─── Timeline wrapping geometry ───────────────────────────────────────────────
//
// The single source of truth for how the strip wraps. Both the drawing
// (Timeline.jsx) and the hit-testing (measureFromXY in Metronome.jsx) must
// agree exactly — when they drifted apart by the 2px border, clicks near the
// end of a line resolved to the wrong measure.
//
// `clientWidth` is the raw scroll-container width; the border is subtracted
// here so no caller has to remember to.
export function timelineGeometry(clientWidth, totalMeasures, mobile) {
  const width       = Math.max(1, clientWidth - 2);
  const MIN_PX      = mobile ? 22 : 26;
  const naturalPx   = width / Math.max(1, totalMeasures);
  const slotPx      = Math.max(MIN_PX, naturalPx);
  const measPerLine = Math.max(1, Math.floor(width / slotPx));
  const filledSlotPx = width / measPerLine;
  const lineCount   = Math.ceil(Math.max(1, totalMeasures) / measPerLine);
  const lines       = Array.from({ length: lineCount }, (_, li) => ({
    start: li * measPerLine + 1,
    end:   Math.min((li + 1) * measPerLine, totalMeasures),
  }));
  return {
    width, slotPx, measPerLine, filledSlotPx, lineCount, lines,
    // x of measure `mn` within the line starting at `lineStart`
    xInLine: (mn, lineStart) => Math.round((mn - lineStart) * filledSlotPx),
    // which measure sits at offset `relX` on the line with index `lineIdx`
    measureAt: (lineIdx, relX) => {
      const lineStart = lineIdx * measPerLine + 1;
      return Math.max(1, Math.min(totalMeasures, lineStart + Math.floor(relX / filledSlotPx)));
    },
  };
}
