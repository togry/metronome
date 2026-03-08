// ─── Timeline strip ───────────────────────────────────────────────────────────

export default function Timeline({
  C, mobile,
  totalMeasures, timelineContentWidth, pxPerSlot, measPx,
  timelineEvents,
  loopStart, loopEnd, startMeasure, currentMeasure, playing,
  timelineRef, timelineScrollRef,
  onMouseDown, onTouchStart, onTouchMove, onTouchEnd,
}) {
  // Fixed row tops (px from top of track) — same for every event label
  const R1 = 2;   // rehearsal mark
  const R2 = 13;  // time signature
  const R3 = 24;  // repeat / coda / segno / directive
  const TRACK_H = mobile ? 38 : 42;

  return (
    <div style={{ padding: mobile ? '6px 12px 2px' : '8px 20px 2px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 8, color: C.textFaint, marginBottom: 4, letterSpacing: 1 }}>
        {mobile
          ? 'TIMELINE · tap=start · dbl-drag=loop · 2-finger=scroll'
          : 'TIMELINE · click = set start · drag = loop · shift-click = set loop end'}
      </div>

      {/* Outer scroll container */}
      <div
        ref={timelineScrollRef}
        style={{
          overflowX: 'auto', overflowY: 'visible',
          borderRadius: 4,
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.borderHi} ${C.bgDark}`,
          touchAction: 'pan-x',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Inner track — extra bottom margin makes room for measure number labels */}
        <div
          ref={timelineRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'relative',
            width: timelineContentWidth,
            height: TRACK_H,
            background: C.bgDark,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            cursor: 'crosshair',
            marginBottom: 14,
          }}
        >
          {/* Loop region */}
          {loopEnd !== null && (
            <div style={{
              position: 'absolute',
              left: measPx(loopStart ?? startMeasure),
              width: Math.max(0, Math.round((loopEnd - (loopStart ?? startMeasure) + 1) * pxPerSlot)),
              top: 0, bottom: 0,
              background: `${C.orange}20`,
              borderLeft: `2px solid ${C.orange}`,
              borderRight: `2px solid ${C.orange}`,
              pointerEvents: 'none',
            }} />
          )}

          {/* Measure ticks + number labels below track */}
          {Array.from({ length: totalMeasures }, (_, i) => i + 1).map(mn => {
            const labelStep = pxPerSlot < 30 ? Math.ceil(30 / pxPerSlot) : 1;
            const showLabel = mn === 1 || mn % labelStep === 0;
            return (
              <div key={mn} style={{
                position: 'absolute', left: measPx(mn),
                bottom: 0, height: showLabel ? 6 : 3, width: 1,
                background: showLabel ? C.textDim : C.textFaint,
                pointerEvents: 'none',
              }}>
                {showLabel && (
                  <div style={{
                    position: 'absolute', top: '100%', marginTop: 2, left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 8, color: C.textFaint, whiteSpace: 'nowrap',
                  }}>{mn}</div>
                )}
              </div>
            );
          })}

          {/* Timeline events — fixed 3-row layout */}
          {timelineEvents.map((ev, idx) => {
            const px    = ev.rightEdge ? measPx(ev.measure + 1) : measPx(ev.measure);
            const isReh = !!ev.rehearsal;

            const lineColor =
              ev.isFine        ? C.text
              : isReh          ? C.reh
              : (ev.barline === '||' || ev.barline === ':||' || ev.barline === '||:') ? C.textDim
              : ev.closeRepeat ? C.primary
              : C.borderHi;
            const lineWidth = ev.isFine ? 3 : isReh ? 2 : ev.closeRepeat ? 2 : 1;

            // Row 1 — rehearsal mark (left-edge only)
            const rehLabel = !ev.rightEdge && isReh ? `[${ev.rehearsal}]` : null;

            // Row 2 — time signature (left-edge only)
            const hasTuplet = ev.grouping?.some(g => typeof g === 'object');
            const sigLabel  = !ev.rightEdge
              ? `${ev.numerator}/${ev.denominator}${hasTuplet ? '*' : ''}`
              : null;

            // Row 3 — repeat / directive / segno / coda / fine
            const row3Label =
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

            const row3Color =
              ev.isFine        ? C.measure
              : ev.directive   ? C.primary
              : (ev.segno || ev.codaJump) ? C.unit
              : (ev.openRepeat || ev.closeRepeat) ? C.primary
              : C.textFaint;

            const anchor = ev.rightEdge
              ? { right: lineWidth + 2, textAlign: 'right' }
              : { left:  lineWidth + 2 };

            return (
              <div key={idx} style={{ position: 'absolute', left: px, top: 0, bottom: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: lineWidth, background: lineColor }} />
                {rehLabel && (
                  <div style={{ position: 'absolute', top: R1, ...anchor, fontSize: mobile ? 8 : 9, fontWeight: 'bold', color: C.reh, whiteSpace: 'nowrap' }}>
                    {rehLabel}
                  </div>
                )}
                {sigLabel && (
                  <div style={{ position: 'absolute', top: R2, ...anchor, fontSize: mobile ? 7 : 8, color: C.textDim, whiteSpace: 'nowrap' }}>
                    {sigLabel}
                  </div>
                )}
                {row3Label && (
                  <div style={{ position: 'absolute', top: R3, ...anchor, fontSize: mobile ? 7 : 8, color: row3Color, whiteSpace: 'nowrap' }}>
                    {row3Label}
                  </div>
                )}
              </div>
            );
          })}

          {/* Playhead */}
          {playing && (
            <div style={{
              position: 'absolute', left: measPx(currentMeasure),
              top: -4, bottom: -4, width: 2,
              background: C.measure, boxShadow: `0 0 8px ${C.measure}`,
              pointerEvents: 'none',
            }}>
              <div style={{ position: 'absolute', top: 0, left: -4, width: 0, height: 0,
                borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                borderTop: `8px solid ${C.measure}` }} />
            </div>
          )}

          {/* Start / loop-start marker */}
          <div style={{
            position: 'absolute', left: measPx(startMeasure),
            top: -4, bottom: 0, width: 2,
            background: loopEnd !== null ? C.orange : C.green,
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: 0, left: -4, width: 0, height: 0,
              borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
              borderTop: `8px solid ${loopEnd !== null ? C.orange : C.green}` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
