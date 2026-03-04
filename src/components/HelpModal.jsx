// ─── Help modal ───────────────────────────────────────────────────────────────

import { RIT_EXAMPLE_SCORE } from '../constants.js';

export default function HelpModal({ C, onClose, onRunExample, mobile }) {
  const sections = [
    { h: 'Time Signatures', body: [
      'Standard: 4/4  3/4  6/8  2/2  12/8',
      'Compound (6/8, 12/8): primary beat = dotted quarter automatically.',
      'Odd meters: add grouping, e.g.  7/8 (2+2+3)  or  5/8 (2+3)',
      'Groupings are remembered per time signature across the score.',
    ]},
    { h: 'Tempo', body: [
      'Written as 1/note=BPM.  Examples:',
      '  1/4=120   quarter note = 120 bpm',
      '  1/4.=60   dotted quarter = 60 bpm (compound meters)',
      'Tempo carries forward until the next marking.',
    ]},
    { h: 'Score Format', body: [
      'Each line: measure separator [mark] N/D (grouping) 1/note=BPM',
      'All fields except the measure number and separator are optional.',
      '# or // starts a comment — can follow content on the same line.',
      'Bracketed measure number → also becomes rehearsal mark: [12]| 4/4',
    ]},
    { h: 'Practice Loop (no end marker)', body: [
      'Omit the final || and the score loops back to m.1 continuously.',
      'The quickest way to drill a short passage — just list the bars',
      'you want and hit play.',
    ], example: '1| 4/4, 1/4=120\n2| 7/8 (2+2+3)\n3| 4/4\n4| 5/4' },
    { h: 'Barline Separators', body: [
      '  |  or  :    Normal barline (default)',
      '  |:          Open repeat',
      '  :|          Close repeat (section plays twice)',
      '  |:|         Single-measure repeat',
      '  ||          Double barline; last one ends the score',
      '  ||:         Double barline + open repeat',
      '  :||         Close repeat + double barline',
      'If no || is present the score loops back to m.1 (practice loop).',
    ]},
    { h: 'DC / DS al Fine / al Coda', body: [
      'DC al Fine    Jump to m.1; stop at Fine',
      'DC al Coda    Jump to m.1; at @ jump to Coda section',
      'DS al Fine    Jump to $ (segno); stop at Fine',
      'DS al Coda    Jump to $; at @ jump to Coda section',
      'Place $ (segno) and @ (coda jump point) on their measure lines.',
      'The Coda section is skipped on the first pass.',
    ]},
    { h: 'Rit / Accel', body: [
      "Add 'rit' or 'accel' with a target tempo to begin a smooth",
      "tempo curve. Spans to the next tempo mark or 'a tempo'.",
      '  4| rit 1/4=60         rit this bar, arrive at 60 BPM',
      '  5| a tempo            snap back to previous tempo',
      '  8| 1/4=100 rit 1/4=60  new base tempo, then rit',
      '  12| 1/4=60            arrival; rit spreads m.8-11',
      'Tempo is interpolated smoothly on every beat.',
    ], example: RIT_EXAMPLE_SCORE },
    { h: 'Playback Controls', body: [
      '▶ / ◼  Play and stop.',
      'COUNT IN  Adds a count-in before playback; choose beats and note value.',
      'SUBDIVIDE  Primary beats only, or subdivided to 4ths / 8ths / 16ths / 32nds.',
      '  Sub-clicks are added only where a beat divides evenly.',
      'TEMPO slider  10–150% of written tempo.',
      '☀ / 🌙  Toggle between dark and daylight palettes.',
    ]},
    { h: 'Timeline', body: [
      'Shows the full piece with rehearsal marks, time signatures, and barlines.',
      'Desktop: click → set start · drag → loop region · shift-click → loop end.',
      'Touch: tap → set start · double-tap then drag → loop region.',
      'Touch: 2-finger drag → scroll timeline horizontally.',
      'Playhead tracks position; click/tap while playing to jump immediately.',
    ]},
    { h: 'Loop Region', body: [
      'Define a region to repeat during playback (orange highlight).',
      'Loop end is inclusive — m.6 to m.9 plays m.6, 7, 8, 9 then wraps.',
      'Repeats fully inside a loop are honoured (play twice per cycle).',
      'Repeats spanning a loop boundary are ignored.',
    ]},
    { h: 'Keyboard Shortcuts', body: [
      'Space        Play / Stop.',
      '← / →        Move start position one measure at a time.',
      'Shift+→      Start a loop from cursor, or extend loop end.',
      'Shift+←      Shrink loop end (or start a loop ending before cursor).',
      'Ignored while typing in the score editor.',
    ]},
    { h: 'Measure Grid', body: [
      'Click any cell to set start position.',
      'Active measure highlighted in gold. Loop region in orange.',
      'Tiles show time signature, grouping, and structural markers ($, @).',
      'On mobile, swipe vertically to scroll.',
    ]},
  ];

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
          maxHeight: '85vh', overflowY: 'auto',
          padding: 24,
          fontFamily: "'Courier New', monospace",
          color: C.text,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, color: C.gold, letterSpacing: 3, fontWeight: 'bold' }}>♩ CONDUCTOR — HELP</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textDim, borderRadius: 4, padding: '4px 10px',
            cursor: 'pointer', fontSize: 13,
          }}>✕</button>
        </div>

        {sections.map(({ h, body, example }) => (
          <div key={h} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, color: C.gold, letterSpacing: 2, marginBottom: 6,
              borderBottom: `1px solid ${C.border}`, paddingBottom: 4,
            }}>{h.toUpperCase()}</div>
            {body.map((line, i) => (
              <div key={i} style={{
                fontSize: 12, color: line.startsWith(' ') ? C.code : C.textDim,
                lineHeight: 1.7, paddingLeft: line.startsWith(' ') ? 12 : 0,
              }}>{line}</div>
            ))}
            {example && (
              <div style={{ marginTop: 8, background: C.bgDark, borderRadius: 4, border: `1px solid ${C.border}`, padding: '8px 10px' }}>
                <pre style={{ margin: 0, fontSize: 11, color: C.code, fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre' }}>{example}</pre>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    onClick={() => onRunExample(example)}
                    title="Load and run this example"
                    style={{
                      background: C.greenDim, border: '1px solid #336644', color: C.green,
                      padding: '4px 10px', cursor: 'pointer', borderRadius: 3,
                      fontSize: 11, fontFamily: 'monospace', letterSpacing: 1,
                    }}
                  >▶ RUN</button>
                  <button
                    onClick={() => navigator.clipboard.writeText(example)}
                    style={{
                      background: C.bgMid, border: `1px solid ${C.border}`, color: C.textDim,
                      padding: '4px 10px', cursor: 'pointer', borderRadius: 3,
                      fontSize: 11, fontFamily: 'monospace', letterSpacing: 1,
                    }}
                  >COPY</button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div style={{ fontSize: 10, color: C.textFaint, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
          Click outside this panel or press ✕ to close.
        </div>
      </div>
    </div>
  );
}
