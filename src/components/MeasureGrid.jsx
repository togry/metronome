// ─── Measure grid ─────────────────────────────────────────────────────────────

export default function MeasureGrid({
  C, mobile, portrait,
  measures, playing, currentMeasure, previewMeasure,
  startMeasure, loopStart, loopEnd,
  onMeasureClick,
}) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', overflowX: 'hidden',
      padding: mobile ? '8px 12px' : '12px 20px',
      minHeight: 0, touchAction: 'pan-y', WebkitOverflowScrolling: 'touch',
      ...(mobile && !portrait ? { flex: 'none', overflowY: 'visible', minHeight: 'unset' } : {}),
    }}>
      <div style={{ fontSize: 9, color: C.textFaint, letterSpacing: 2, marginBottom: 6 }}>MEASURES</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile
          ? 'repeat(auto-fill, minmax(48px, 1fr))'
          : 'repeat(auto-fill, minmax(58px, 1fr))',
        gap: 3,
      }}>
        {Object.values(measures).filter(Boolean).map(ms => {
          const isActive    = playing && ms.measureNumber === currentMeasure;
          const isPrev      = !playing && ms.measureNumber === previewMeasure;
          const isStart     = ms.measureNumber === startMeasure;
          const inLoop      = loopEnd !== null
            && ms.measureNumber >= (loopStart ?? startMeasure)
            && ms.measureNumber <= loopEnd;
          const hasOpenRep  = ms.barline === '|:' || ms.barline === '||:' || ms.barline === '|:|';
          const hasCloseRep = ms.barline === ':|' || ms.barline === ':||' || ms.barline === '|:|';

          return (
            <div
              key={ms.measureNumber}
              onClick={() => onMeasureClick(ms.measureNumber)}
              style={{
                padding: mobile ? '4px' : '3px 5px',
                borderRadius: 3, cursor: 'pointer',
                minHeight: mobile ? 38 : 44,
                background:
                  isActive ? `${C.gold}18` :
                  isPrev   ? `${C.unit}12` :
                  inLoop   ? `${C.orange}14` :
                  ms.isEnd ? C.redDim : C.bgDark,
                border: `1px solid ${
                  isActive    ? C.gold :
                  isPrev      ? `${C.unit}88` :
                  isStart     ? C.green :
                  ms.rehearsal ? C.reh :
                  inLoop      ? `${C.orange}55` : C.border}`,
              }}
            >
              {/* Top row: measure number + rehearsal mark */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 8, color: isActive ? C.gold : C.textFaint }}>
                  {ms.measureNumber}
                </div>
                {ms.rehearsal && (
                  <div style={{ fontSize: mobile ? 8 : 9, color: C.reh, fontWeight: 'bold', lineHeight: 1 }}>
                    [{ms.rehearsal}]
                  </div>
                )}
              </div>

              {/* Time signature */}
              <div style={{ fontSize: 8, color: C.textDim }}>
                {ms.numerator}/{ms.denominator}
              </div>

              {/* Grouping */}
              <div style={{ fontSize: 7, color: C.textFaint }}>
                {ms.grouping ? ms.grouping.join('+') : ''}
              </div>

              {/* Bottom row: open/close repeat, end barline, directives */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: '1em' }}>
                <div style={{ fontSize: 7, color: C.primary, lineHeight: 1 }}>
                  {hasOpenRep ? '[: ' : ''}
                  {ms.isEnd ? '‖' : ''}
                  {ms.directive
                    ? ms.directive
                        .replace('DC_FINE', 'D.C.aF')
                        .replace('DC_CODA', 'D.C.aC')
                        .replace('DS_FINE', 'D.S.aF')
                        .replace('DS_CODA', 'D.S.aC')
                        .replace('FINE', 'Fine')
                        .replace('CODA', 'Coda')
                    : ''}
                  {ms.segno    ? <span style={{ color: C.unit }}>$</span> : ''}
                  {ms.codaJump ? <span style={{ color: C.unit }}>@</span> : ''}
                </div>
                <div style={{ fontSize: 7, color: C.primary, lineHeight: 1 }}>
                  {hasCloseRep ? ':]' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
