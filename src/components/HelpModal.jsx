// ─── Help modal ───────────────────────────────────────────────────────────────

const EXAMPLE_KEYS = {
  practice:  'defaultScore',
  structure: 'exampleStructure',
  rit:       'exampleRit',
  tuplet:    'exampleTuplet',
};

export default function HelpModal({ C, onClose, onRunExample, mobile, t }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bgMid, border: `1px solid ${C.borderHi}`,
          borderRadius: 8, maxWidth: 560, width: '100%',
          maxHeight: '85dvh', overflowY: 'auto',
          padding: 24,
          fontFamily: "'Courier New', monospace",
          color: C.text,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, color: C.gold, letterSpacing: 3, fontWeight: 'bold' }}>{t.helpTitle}</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textDim, borderRadius: 4, padding: '4px 10px',
            cursor: 'pointer', fontSize: 13,
          }}>{t.helpClose}</button>
        </div>

        {t.helpSections.map(({ h, body, exampleKey }) => {
          const example = exampleKey ? t[EXAMPLE_KEYS[exampleKey]] ?? null : null;
          return (
            <div key={h} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, color: C.gold, letterSpacing: 2, marginBottom: 6,
                borderBottom: `1px solid ${C.border}`, paddingBottom: 4,
              }}>{h.toUpperCase()}</div>
              {body.map((line, i) => (
                <div key={i} style={{
                  fontSize: 12, color: line.startsWith(' ') ? C.code : C.textDim,
                  lineHeight: 1.7, paddingLeft: line.startsWith(' ') ? 12 : 0,
                }}>{line || '\u00A0'}</div>
              ))}
              {example && (
                <div style={{ marginTop: 8, position: 'relative', background: C.bgDark, borderRadius: 4, border: `1px solid ${C.border}`, padding: '8px 10px' }}>
                  <div style={{ position: 'absolute', top: 5, right: 6, display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => onRunExample(example)}
                      title={t.helpBtnPlayTitle}
                      style={{
                        background: C.greenDim, border: `1px solid ${C.green}44`,
                        color: C.green, borderRadius: 5,
                        width: 22, height: 22, padding: 0,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, lineHeight: 1,
                      }}
                    >{t.helpBtnPlay}</button>
                    <button
                      onClick={() => navigator.clipboard.writeText(example)}
                      title={t.helpBtnCopyTitle}
                      style={{
                        background: C.bgMid, border: `1px solid ${C.border}`,
                        color: C.textDim, borderRadius: 5,
                        width: 22, height: 22, padding: 0,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, lineHeight: 1,
                      }}
                    >{t.helpBtnCopy}</button>
                  </div>
                  <pre style={{ margin: 0, fontSize: 11, color: C.code, fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre', paddingRight: 52 }}>{example}</pre>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ fontSize: 10, color: C.textFaint, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
          {t.helpCloseHint}
        </div>
        <div style={{ fontSize: 10, color: C.textFaint, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 8, lineHeight: 1.7 }}>
          {t.helpCredits.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>
    </div>
  );
}
