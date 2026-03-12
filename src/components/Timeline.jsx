// ─── Timeline strip — wrapping multi-line layout ──────────────────────────────

import { useEffect, useRef } from 'react';
import { groupingShortLabel } from '../beatModel.js';

export default function Timeline({
  C, mobile, t,
  totalMeasures, timelineContentWidth, pxPerSlot, measPx,
  timelineEvents,
  loopStart, loopEnd, startMeasure, currentMeasure, playing,
  timelineRef, timelineScrollRef,
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
  // Use the scroll container's actual width; fall back on first render.
  const containerWidth = timelineScrollRef.current
    ? timelineScrollRef.current.clientWidth - 2   // -2 for border
    : (typeof window !== 'undefined' ? window.innerWidth - (mobile ? 24 : 80) : 600);

  const MIN_PX      = mobile ? 22 : 26;
  const naturalPx   = containerWidth / Math.max(1, totalMeasures);
  const slotPx      = Math.max(MIN_PX, naturalPx);
  const measPerLine = Math.max(1, Math.floor(containerWidth / slotPx));
  // Stretch slots to fill line exactly
  const filledSlotPx = containerWidth / measPerLine;

  const lineCount = Math.ceil(totalMeasures / measPerLine);
  const lines     = Array.from({ length: lineCount }, (_, li) => ({
    start: li * measPerLine + 1,
    end:   Math.min((li + 1) * measPerLine, totalMeasures),
  }));

  // x position of measure mn within its line
  function xInLine(mn, lineStart) {
    return Math.round((mn - lineStart) * filledSlotPx);
  }

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
            const lineHasActive = playing
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

                    const row4Label =
                      ev.isFine        ? '‖'
                      : ev.directive   ? ev.directive
                          .replace('DC_FINE','D.C.aF').replace('DC_CODA','D.C.aC')
                          .replace('DS_FINE','D.S.aF').replace('DS_CODA','D.S.aC')
                          .replace('FINE','Fine').replace('CODA','Coda')
                      : ev.segno       ? '$'
                      : ev.codaJump    ? '@'
                      : ev.closeRepeat ? ':]'
                      : ev.openRepeat  ? '[:'
                      : null;

                    const row4Color =
                      ev.isFine        ? C.measure
                      : ev.directive   ? C.primary
                      : (ev.segno || ev.codaJump) ? C.unit
                      : (ev.openRepeat || ev.closeRepeat) ? C.primary
                      : C.textFaint;

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

                {/* Playhead */}
                {lineHasActive && (
                  <div style={{
                    position: 'absolute',
                    left: xInLine(currentMeasure, line.start),
                    top: -4, bottom: -4, width: 2,
                    background: C.measure, boxShadow: `0 0 8px ${C.measure}`,
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
