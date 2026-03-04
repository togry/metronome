// ─── Timeline strip ───────────────────────────────────────────────────────────

export default function Timeline({
  C, mobile,
  totalMeasures, timelineContentWidth, pxPerSlot, measPx,
  timelineEvents,
  loopStart, loopEnd, startMeasure, currentMeasure, playing,
  timelineRef, timelineScrollRef,
  onMouseDown, onTouchStart, onTouchMove, onTouchEnd,
}) {
  return (
    <div style={{ padding: mobile ? '8px 12px 4px' : '12px 20px 4px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 9, color: C.textFaint, marginBottom: 6 }}>
        {mobile
          ? 'TIMELINE · tap = start · double-tap & drag = loop · 2-finger drag = scroll'
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
        {/* Inner track */}
        <div
          ref={timelineRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'relative',
            width: timelineContentWidth,
            height: mobile ? 52 : 60,
            background: C.bgDark,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            cursor: 'crosshair',
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

          {/* Measure ticks */}
          {Array.from({ length: totalMeasures }, (_, i) => i + 1).map(mn => {
            const labelStep = pxPerSlot < 30 ? Math.ceil(30 / pxPerSlot) : 1;
            const showLabel = mn === 1 || mn % labelStep === 0;
            return (
              <div key={mn} style={{
                position: 'absolute', left: measPx(mn),
                bottom: 0, height: showLabel ? 8 : 4, width: 1,
                background: showLabel ? C.textDim : C.textFaint,
                pointerEvents: 'none',
              }}>
                {showLabel && (
                  <div style={{
                    position: 'absolute', bottom: -14, left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 8, color: C.textFaint, whiteSpace: 'nowrap',
                  }}>{mn}</div>
                )}
              </div>
            );
          })}

          {/* Timeline events */}
          {timelineEvents.map((ev, idx) => {
            const px        = ev.rightEdge ? measPx(ev.measure + 1) : measPx(ev.measure);
            const isReh     = !!ev.rehearsal;
            const lineColor = ev.isFine    ? C.text
              : isReh                      ? C.reh
              : (ev.barline === '||' || ev.barline === ':||' || ev.barline === '||:') ? C.textDim
              : ev.closeRepeat             ? C.primary
              : C.borderHi;
            const lineWidth = ev.isFine ? 3 : isReh ? 2 : ev.closeRepeat ? 2 : 1;
            const label =
              ev.isFine      ? '‖'
              : isReh        ? `[${ev.rehearsal}]`
              : ev.directive ? ev.directive
                  .replace('DC_FINE', 'D.C. al Fine')
                  .replace('DC_CODA', 'D.C. al Coda')
                  .replace('DS_FINE', 'D.S. al Fine')
                  .replace('DS_CODA', 'D.S. al Coda')
                  .replace('FINE',    'Fine')
                  .replace('CODA',    'Coda')
              : ev.segno       ? '$'
              : ev.codaJump    ? '@'
              : ev.closeRepeat ? ':]'
              : ev.openRepeat  ? '[:'
              : ' ';
            const labelColor =
              ev.isFine      ? C.measure
              : isReh        ? C.reh
              : ev.directive ? C.primary
              : (ev.segno || ev.codaJump) ? C.unit
              : (ev.openRepeat || ev.closeRepeat) ? C.primary
              : 'transparent';

            return (
              <div key={idx} style={{ position: 'absolute', left: px, top: 0, bottom: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: lineWidth, background: lineColor }} />
                <div style={{
                  position: 'absolute', top: 3,
                  ...(ev.rightEdge
                    ? { right: lineWidth + 2, textAlign: 'right' }
                    : { left: lineWidth + 2 }),
                  fontSize: mobile ? 8 : 9, lineHeight: 1.4, whiteSpace: 'nowrap',
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: mobile ? 9 : 10, color: labelColor, height: mobile ? 12 : 14, overflow: 'hidden' }}>
                    {label}
                  </div>
                  {!ev.rightEdge && (
                    <>
                      <div style={{ color: C.textDim }}>{ev.numerator}/{ev.denominator}</div>
                      <div style={{ color: C.textFaint }}>{ev.grouping ? `(${ev.grouping.join('+')})` : ''}</div>
                    </>
                  )}
                </div>
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
          <div style={{
            position: 'absolute', left: measPx(startMeasure),
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
        </div>
      </div>

      {/* Ruler end labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: '0 2px' }}>
        <span style={{ fontSize: 9, color: C.textFaint }}>m.1</span>
        <span style={{ fontSize: 9, color: C.textFaint }}>m.{totalMeasures}</span>
      </div>
    </div>
  );
}
