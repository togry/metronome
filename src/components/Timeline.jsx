// ─── Timeline strip — wrapping multi-line layout ──────────────────────────────

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { groupingShortLabel } from '../beatModel.js';
import { timelineGeometry } from '../timeline.js';

export default function Timeline({
  C, mobile, t,
  totalMeasures, timelineContentWidth, pxPerSlot, measPx,
  timelineEvents,
  loopStart, loopEnd, startMeasure, currentMeasure, playing,
  timelineRef, timelineScrollRef, playheadRef, showPlayhead,
  onMouseDown, onTouchStart, onTouchMove, onTouchEnd,
}) {
  const activeLineRef = useRef(null);

  // ── Row geometry ────────────────────────────────────────────────────────────
  // Row 1: rehearsal mark
  // Row 2: time signature
  // Row 3: grouping (only where non-trivial)
  // Row 4: repeat / directive / segno / coda
  const TRACK_H = mobile ? 50 : 56;   // height of each timeline row
  const LABEL_H = 14;                 // measure-number strip below each row
  const ROW_GAP = mobile ? 8 : 10;

  const R1 = 2;
  const R2 = 14;
  const R3 = 26;
  const R4 = 38;

  // ── Compute wrapping ────────────────────────────────────────────────────────
  // Measured from the scroll container itself. The guess below is only ever
  // used for the very first render pass, before any DOM exists to measure;
  // it is wrong on desktop, where the strip is narrower than the window by the
  // score sidebar. useLayoutEffect corrects it after layout but *before* paint,
  // so the bad value is never shown. A ResizeObserver then keeps it right when
  // the window changes or the sidebar divider is dragged, without depending on
  // the parent re-rendering for the same reason.
  const [measuredWidth, setMeasuredWidth] = useState(0);
  useLayoutEffect(() => {
    const el = timelineScrollRef.current;
    if (!el) return;
    const measure = () => setMeasuredWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [timelineScrollRef]);

  // Guessing the width was the bug: on desktop the strip is narrower than the
  // window by the score sidebar, so the guess overflowed the container until
  // something forced a re-render. There is no good guess — so don't. Below,
  // the lines are simply not drawn until a real measurement exists, and the
  // measurement is taken in a layout effect, before paint, so nothing is seen
  // in the meantime.
  const geom = measuredWidth ? timelineGeometry(measuredWidth, totalMeasures, mobile) : null;
  const { filledSlotPx = 0, measPerLine = 1, lines = [], xInLine = () => 0 } = geom || {};

  // ── Auto-scroll active line into view ───────────────────────────────────────
  useEffect(() => {
    if (!playing || !activeLineRef.current || !timelineScrollRef.current) return;
    const container = timelineScrollRef.current;
    const el        = activeLineRef.current;
    const elTop     = el.offsetTop;
    const elBot     = elTop + el.offsetHeight + LABEL_H;
    const scrTop    = container.scrollTop;
    const scrBot    = scrTop + container.clientHeight;
    const margin    = ROW_GAP * 2;
    if (elTop < scrTop + margin) {
      container.scrollTop = Math.max(0, elTop - margin);
    } else if (elBot > scrBot - margin) {
      container.scrollTop = elBot - container.clientHeight + margin;
    }
  }, [currentMeasure, playing]);

  // Register touchmove as non-passive so preventDefault() works on iOS.
  // React registers onTouchMove as passive by default, which silently ignores
  // preventDefault() — meaning iOS will scroll even when we want loop drag.
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const handler = (e) => onTouchMove(e);
    el.addEventListener('touchmove', handler, { passive: false });
    return () => el.removeEventListener('touchmove', handler);
  }, [onTouchMove]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      padding: mobile ? '6px 12px 2px' : '8px 20px 4px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0,
    }}>
      {/* Hint */}
      <div style={{ fontSize: 8, color: C.textFaint, marginBottom: 4, letterSpacing: 1, flexShrink: 0 }}>
        {mobile
          ? (t?.timelineHintMobile  ?? 'TIMELINE · tap=start · dbl-drag=loop · 2-finger=scroll')
          : (t?.timelineHintDesktop ?? 'TIMELINE · click = set start · drag = loop · shift-click = set loop end')}
      </div>

      {/* Scrollable area */}
      <div
        ref={timelineScrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.borderHi} ${C.bgDark}`,
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <div
          ref={timelineRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: ROW_GAP + LABEL_H,
            paddingBottom: 8,
            cursor: 'crosshair',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        >
          {lines.map((line, li) => {
            // Not gated on `playing` — the playhead stays where it stopped.
            // It is gated on showPlayhead, which goes false once the cursor is
            // moved, since the frozen position is then stale.
            const lineHasActive = showPlayhead
              && currentMeasure >= line.start
              && currentMeasure <= line.end;
            const lineHasStart  = startMeasure >= line.start
              && startMeasure <= line.end;
            const lineWidth = Math.round((line.end - line.start + 1) * filledSlotPx);

            return (
              <div
                key={li}
                ref={lineHasActive ? activeLineRef : null}
                style={{
                  position: 'relative',
                  width: lineWidth,
                  height: TRACK_H,
                  background: C.bgDark,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                {/* Loop region */}
                {loopEnd !== null && (() => {
                  const loopS        = loopStart ?? startMeasure;
                  const overlapStart = Math.max(loopS, line.start);
                  const overlapEnd   = Math.min(loopEnd + 1, line.end + 1);
                  if (overlapStart >= overlapEnd) return null;
                  return (
                    <div style={{
                      position: 'absolute',
                      left:  xInLine(overlapStart, line.start),
                      width: Math.round((overlapEnd - overlapStart) * filledSlotPx),
                      top: 0, bottom: 0,
                      background: `${C.orange}20`,
                      borderLeft:  overlapStart === loopS      ? `2px solid ${C.orange}` : 'none',
                      borderRight: overlapEnd   === loopEnd + 1 ? `2px solid ${C.orange}` : 'none',
                      pointerEvents: 'none',
                    }} />
                  );
                })()}

                {/* Measure ticks + number labels */}
                {Array.from({ length: line.end - line.start + 1 }, (_, i) => {
                  const mn        = line.start + i;
                  const labelStep = filledSlotPx < 30 ? Math.ceil(30 / filledSlotPx) : 1;
                  const showLabel = mn === line.start || mn % labelStep === 0;
                  return (
                    <div key={mn} style={{
                      position: 'absolute',
                      left: xInLine(mn, line.start),
                      bottom: 0, height: showLabel ? 6 : 3, width: 1,
                      background: showLabel ? C.textDim : C.textFaint,
                      pointerEvents: 'none',
                    }}>
                      {showLabel && (
                        <div style={{
                          position: 'absolute', top: '100%', marginTop: 2,
                          left: '50%', transform: 'translateX(-50%)',
                          fontSize: 8, color: C.textFaint, whiteSpace: 'nowrap',
                        }}>{mn}</div>
                      )}
                    </div>
                  );
                })}

                {/* Timeline events */}
                {timelineEvents
                  .filter(ev => {
                    const m = ev.rightEdge ? ev.measure : ev.measure;
                    return m >= line.start && m <= line.end + 1;
                  })
                  .map((ev, idx) => {
                    const evPx = ev.rightEdge
                      ? Math.round(xInLine(ev.measure, line.start) + filledSlotPx) - 1
                      : xInLine(ev.measure, line.start);
                    const isReh = !!ev.rehearsal;

                    const vlineColor =
                      ev.isFine        ? C.text
                      : isReh          ? C.reh
                      : (ev.barline === '||' || ev.barline === ':||' || ev.barline === '||:') ? C.textDim
                      : ev.closeRepeat ? C.primary
                      : C.borderHi;
                    const vlineWidth = ev.isFine ? 3 : isReh ? 2 : ev.closeRepeat ? 2 : 1;

                    const rehLabel   = !ev.rightEdge && isReh ? `[${ev.rehearsal}]` : null;
                    const hasTuplet  = ev.grouping?.some(g => typeof g === 'object');
                    const sigLabel   = !ev.rightEdge
                      ? `${ev.numerator}/${ev.denominator}${hasTuplet ? '*' : ''}`
                      : null;
                    const groupLabel = !ev.rightEdge && ev.grouping
                      ? groupingShortLabel(ev.grouping)
                      : null;

                    const row4Label = (() => {
                      if (ev.isFine) return '‖';
                      if (ev.directive) return ev.directive
                        .replace('DC_FINE','D.C.aF').replace('DC_CODA','D.C.aC')
                        .replace('DS_FINE','D.S.aF').replace('DS_CODA','D.S.aC')
                        .replace('FINE','Fine').replace('CODA','Coda');
                      const parts = [];
                      if (ev.closeRepeat) parts.push(':]');
                      if (ev.segno)       parts.push('$');
                      if (ev.codaJump)    parts.push('@');
                      if (ev.openRepeat)  parts.push('[:');
                      return parts.length ? parts.join(' ') : null;
                    })();

                    const row4Color =
                      ev.isFine ? C.measure : C.orange;

                    const anchor = ev.rightEdge
                      ? { right: vlineWidth + 2, textAlign: 'right' }
                      : { left:  vlineWidth + 2 };

                    return (
                      <div key={idx} style={{ position: 'absolute', left: evPx, top: 0, bottom: 0, pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: vlineWidth, background: vlineColor }} />
                        {rehLabel && (
                          <div style={{ position: 'absolute', top: R1, ...anchor, fontSize: mobile ? 8 : 9, fontWeight: 'bold', color: C.reh, whiteSpace: 'nowrap' }}>
                            {rehLabel}
                          </div>
                        )}
                        {sigLabel && (
                          <div style={{ position: 'absolute', top: R2, ...anchor, fontSize: mobile ? 8 : 9, color: C.textDim, whiteSpace: 'nowrap' }}>
                            {sigLabel}
                          </div>
                        )}
                        {groupLabel && (
                          <div style={{ position: 'absolute', top: R3, ...anchor, fontSize: mobile ? 7 : 8, color: C.textFaint, whiteSpace: 'nowrap' }}>
                            {groupLabel}
                          </div>
                        )}
                        {row4Label && (
                          <div style={{ position: 'absolute', top: R4, ...anchor, fontSize: mobile ? 7 : 8, color: row4Color, whiteSpace: 'nowrap' }}>
                            {row4Label}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Playhead — `left` snaps to the bar, and the rAF loop in
                    Metronome adds a translateX to glide across it. Resetting
                    the offset here, as the element is attached, keeps it from
                    overshooting for a frame when the bar changes. */}
                {lineHasActive && (
                  <div
                    ref={el => {
                      if (!el || !playheadRef) return;
                      if (el._measure !== currentMeasure) el.style.transform = 'translateX(0px)';
                      el._measure       = currentMeasure;
                      el._slotPx        = filledSlotPx;
                      playheadRef.current = el;
                    }}
                    style={{
                    position: 'absolute',
                    left: xInLine(currentMeasure, line.start),
                    top: -4, bottom: -4, width: 2,
                    background: C.measure,
                    // Lit while playing; dimmed and unglowing once stopped, so a
                    // frozen needle reads as a position marker, not a playhead.
                    boxShadow: playing ? `0 0 8px ${C.measure}` : 'none',
                    opacity:   playing ? 1 : 0.4,
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: -4,
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `8px solid ${C.measure}`,
                    }} />
                  </div>
                )}

                {/* Start / loop-start marker */}
                {lineHasStart && (
                  <div style={{
                    position: 'absolute',
                    left: xInLine(startMeasure, line.start),
                    top: -4, bottom: 0, width: 2,
                    background: loopEnd !== null ? C.orange : C.green,
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: -4,
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `8px solid ${loopEnd !== null ? C.orange : C.green}`,
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
