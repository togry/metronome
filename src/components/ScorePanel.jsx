// ─── Score editor panel ───────────────────────────────────────────────────────

export default function ScorePanel({
  C, mobile, scoreText, setScoreText,
  parseError, parseWarnings,
  onParse, onClearPasteParse, onClose,
  scoreWidth, t,
}) {
  return (
    <div style={{
      ...(mobile ? {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100, display: 'flex', flexDirection: 'column',
        background: C.bgMid,
      } : {
        width: scoreWidth, borderRight: `1px solid ${C.border}`, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: C.bgMid,
      }),
      padding: 14, gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: C.textFaint }}>{t.btnScore}</div>
        {mobile && (
          <button onClick={onClose} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textDim, padding: '4px 10px', cursor: 'pointer',
            borderRadius: 3, fontSize: 12,
          }}>{t.helpClose} {t.btnScore}</button>
        )}
      </div>

      <textarea
        value={scoreText}
        onChange={e => setScoreText(e.target.value)}
        style={{
          flex: 1, background: C.bgDark, border: `1px solid ${C.border}`, borderRadius: 4,
          color: C.code, fontFamily: 'monospace', fontSize: mobile ? 14 : 12.5,
          padding: 10, resize: 'none', outline: 'none', lineHeight: 2,
          WebkitAppearance: 'none', overflowX: 'auto', whiteSpace: 'pre',
        }}
      />

      {parseError && (
        <div style={{ color: '#ff6666', fontSize: 11 }}>{parseError}</div>
      )}
      {parseWarnings.map((w, i) => (
        <div key={i} style={{ color: C.primary, fontSize: 11 }}>⚠ {w}</div>
      ))}

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setScoreText('')} style={{
          background: C.redDim, border: '1px solid #442222', color: '#cc6666',
          padding: mobile ? '12px' : '7px 10px', cursor: 'pointer', borderRadius: 3,
          letterSpacing: 2, fontSize: mobile ? 14 : 11, fontFamily: 'monospace',
        }}>CLEAR</button>
        <button onClick={onClearPasteParse} title="Clear, paste clipboard, and parse" style={{
          background: C.bgDark, border: `1px solid ${C.border}`, color: C.textDim,
          padding: mobile ? '12px' : '7px 10px', cursor: 'pointer', borderRadius: 3,
          letterSpacing: 1, fontSize: mobile ? 14 : 11, fontFamily: 'monospace',
          flexShrink: 0,
        }}>📋▶</button>
        <button onClick={onParse} style={{
          flex: 1, background: C.greenDim, border: '1px solid #336644', color: C.green,
          padding: mobile ? '12px' : '7px 12px', cursor: 'pointer', borderRadius: 3,
          letterSpacing: 2, fontSize: mobile ? 14 : 11, fontFamily: 'monospace',
        }}>PARSE</button>
      </div>

      {!mobile && (
        <>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: C.textFaint, marginBottom: 8 }}>LEGEND</div>
            {[
              { color: C.measure, label: 'Measure downbeat' },
              { color: C.primary, label: 'Primary beat' },
              { color: C.unit,    label: 'Subdivision click' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.textDim }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: C.textFaint, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
            <span style={{ color: C.textDim }}>Format: </span>
            m: [mark] N/D (g+r+p) 1/D=BPM
          </div>
        </>
      )}
    </div>
  );
}
