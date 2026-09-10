// ─── Score editor panel ───────────────────────────────────────────────────────
//
// The editor is a plain textarea, so text inside it cannot be coloured
// directly. Ignored text is marked by a highlight layer sitting behind a
// transparent-background textarea, sharing its font, padding and line height
// so the two line up. The layer paints only backgrounds and underlines, never
// glyphs — if it ever drifts out of alignment the result is a misplaced band
// rather than doubled, unreadable text. There is no wrapping to keep in step
// (whiteSpace: 'pre'), only scroll position.

import { useMemo, useRef } from 'react';
import { parseScore } from '../parser.js';

export default function ScorePanel({
  C, mobile, scoreText, setScoreText,
  parseError, parseWarnings,
  onParse, onClearPasteParse, onClose,
  scoreWidth, t,
}) {
  const overlayRef = useRef(null);
  const fontSize   = mobile ? 14 : 12.5;

  // Re-derived from the live editor text, not from the last parse, so the
  // marks track what you type rather than what you last parsed. Parsing is
  // sub-millisecond for any real score. The cap on measure numbers throws,
  // hence the guard.
  const ignored = useMemo(() => {
    try { return parseScore(scoreText).ignored || []; }
    catch { return []; }
  }, [scoreText]);

  const byLine = new Map();
  for (const ig of ignored) {
    if (!byLine.has(ig.line)) byLine.set(ig.line, []);
    byLine.get(ig.line).push(ig.text);
  }

  // Two shades, both background only — the glyphs stay in the textarea, so a
  // misaligned band is cosmetic where misplaced text would not be.
  const ignoredShade = {
    background: `${C.red}33`,
    borderRadius: 2,
    textDecoration: 'underline wavy',
    textDecorationColor: C.red,
  };
  // A solid per-theme token rather than an alpha over textFaint: at low alpha
  // this band is a pure lightness shift on a neutral ground, which is far
  // harder to see on near-black than on cream even at the same contrast
  // ratio. Tuned to sit just under the red band, which has hue and an
  // underline to carry it.
  const commentShade = { background: C.commentBg, borderRadius: 2 };

  const marked = scoreText.split('\n').map((ln, i) => {
    // Split the comment off first, so ignored fragments are located in the
    // code part only and cannot match text inside a comment.
    const cm      = ln.match(/(\/\/|#)/);
    const code    = cm ? ln.slice(0, cm.index) : ln;
    const comment = cm ? ln.slice(cm.index)    : '';
    const frags   = byLine.get(i) || [];

    const out = [];
    let cursor = 0;
    frags.forEach((f, fi) => {
      const idx = code.indexOf(f, cursor);
      if (idx < 0) return;
      if (idx > cursor) out.push(code.slice(cursor, idx));
      out.push(<span key={`${i}-${fi}`} style={ignoredShade}>{f}</span>);
      cursor = idx + f.length;
    });
    out.push(code.slice(cursor));
    if (comment) out.push(<span key={`c${i}`} style={commentShade}>{comment}</span>);
    out.push('\n');
    return <span key={i}>{out}</span>;
  });

  function syncScroll(e) {
    const o = overlayRef.current;
    if (!o) return;
    o.scrollTop  = e.target.scrollTop;
    o.scrollLeft = e.target.scrollLeft;
  }

  // Shared by the textarea and the layer behind it — any divergence here shows
  // up as misaligned highlights.
  const textBox = {
    fontFamily: 'monospace', fontSize, lineHeight: 2,
    padding: 10, whiteSpace: 'pre',
  };

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

      <div style={{
        position: 'relative', flex: 1, display: 'flex', minHeight: 0,
        background: C.bgDark, border: `1px solid ${C.border}`, borderRadius: 4,
      }}>
        <div ref={overlayRef} aria-hidden="true" style={{
          ...textBox,
          position: 'absolute', inset: 0,
          overflow: 'hidden', pointerEvents: 'none',
          color: 'transparent', borderRadius: 4,
        }}>{marked}</div>
        <textarea
          value={scoreText}
          onChange={e => setScoreText(e.target.value)}
          onScroll={syncScroll}
          style={{
            ...textBox,
            position: 'relative', flex: 1, minWidth: 0,
            background: 'transparent', border: 'none', borderRadius: 4,
            color: C.code, resize: 'none', outline: 'none',
            WebkitAppearance: 'none', overflowX: 'auto',
          }}
        />
      </div>

      {parseError && (
        <div style={{ color: C.red, fontSize: 11 }}>{parseError}</div>
      )}
      {parseWarnings.map((w, i) => (
        <div key={i} style={{ color: C.primary, fontSize: 11 }}>⚠ {w}</div>
      ))}

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setScoreText('')} style={{
          background: C.redDim, border: `1px solid ${C.red}44`, color: C.red,
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
          flex: 1, background: C.greenDim, border: `1px solid ${C.green}44`, color: C.green,
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
