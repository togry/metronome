// ─── English (source) ─────────────────────────────────────────────────────────

const en = {

  // ── Header ──────────────────────────────────────────────────────────────────
  appTitle:        '♩ METRONOMICON',
  appSubtitle:     'SCORE-AWARE METRONOME',
  btnScore:        'SCORE',
  btnThemeDark:    '☀',
  btnThemeLight:   '🌙',
  btnThemeTitleToDaylight: 'Switch to daylight palette',
  btnThemeTitleToNight:    'Switch to night palette',
  btnHelp:         '?',
  flashLabelMeas:  'MEAS',
  flashLabelBeat:  'BEAT',
  flashLabelUnit:  'UNIT',

  // ── Controls row 1 ──────────────────────────────────────────────────────────
  btnPlay:         '▶',
  btnStop:         '◼',
  labelNow:        'NOW',
  labelMeasure:    'M.',
  labelMeasureShort: 'm.',
  labelCountIn:    'COUNT IN',
  labelOnRepeat:   'ON REPEAT',
  countInDenom4:   '4ths',
  countInDenom8:   '8ths',

  // ── Controls row 2 ──────────────────────────────────────────────────────────
  labelSubdivide:  'SUBDIVIDE',
  labelTempo:      'TEMPO',
  labelBpm:        'bpm',
  labelBt:         'BT',

  // ── Pattern visualiser ──────────────────────────────────────────────────────
  labelPattern:    'PATTERN',
  patternClicks:   (n) => `${n} click${n !== 1 ? 's' : ''}`,

  // ── Start / loop row ────────────────────────────────────────────────────────
  labelStart:      'START',
  labelLoopEnd:    'LOOP END',
  btnClearLoop:    'CLEAR LOOP',
  loopRange:       (s, e) => `↺ m.${s}–${e}`,
  startAt:         (m)    => `start m.${m}`,

  // ── Score panel ─────────────────────────────────────────────────────────────
  // (ScorePanel.jsx strings — add here when that file is i18n'd)

  // ── Parser warnings / errors ─────────────────────────────────────────────────
  // These are parameterised; keep the function signatures intact.
  warnGroupingNotDivisible: (mn, units, num, den) =>
    `m.${mn}: grouping element (${units} unit${units !== 1 ? 's' : ''}) does not divide ${num}/${den} evenly — grouping ignored`,
  warnRitNeedsTarget: (mn) =>
    `m.${mn}: 'rit'/'accel' needs a target tempo, e.g. rit 1/4=60`,
  warnRitNoTarget: (mn) =>
    `m.${mn}: 'rit'/'accel' has no target tempo and no following tempo mark`,
  warnRitNoFollowing: (mn) =>
    `m.${mn}: 'rit'/'accel' has no following tempo mark or 'a tempo'`,
  warnCloseRepeatNoOpen: (mn) =>
    `m.${mn}: close-repeat ':|' has no matching open repeat`,
  warnDoubleBarNoOpen: (mn) =>
    `m.${mn}: ':||' has no matching open repeat — use '||' to end the score`,

  // ── Help modal ───────────────────────────────────────────────────────────────
  helpTitle:       '♩ METRONOMICON — HELP',
  helpClose:       '✕',
  helpCloseHint:   'Click outside this panel or press ✕ to close.',
  helpCredits:     [
    'Concept and design: Tom Grydeland <tom.grydeland@gmail.com>',
    'Implementation: Claude Sonnet 4.5 & 4.6 (Anthropic), directed by the above',
  ],
  helpBtnPlay:     '▶',
  helpBtnPlayTitle: 'Load and play',
  helpBtnCopy:     '⧉',
  helpBtnCopyTitle: 'Copy to clipboard',

  helpSections: [
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
      'All fields except the measure (number) and separator are optional.',
      '# or // starts a comment — can follow content on the same line.',
      'Bracketed measure number → also becomes rehearsal mark: [12]| 4/4',
    ]},
    { h: 'Practice Loop (no end marker)', body: [
      'Omit the final || and the score loops back to m.1 continuously.',
      'The quickest way to drill a short passage — just list the bars',
      'you want and hit play.',
    ], exampleKey: 'practice' },
    { h: 'Barline Separators', body: [
      '  |  or  :    Normal barline (default)',
      '  |:          Open repeat',
      '  :|          Close repeat (section plays twice)',
      '  |:|         Single-measure repeat',
      '  ||          Double barline; last one ends the score',
      '  ||:         Double barline + open repeat',
      '  :||         Close repeat + double barline',
      'To start a new repeat immediately after closing one, use',
      '  :| on the last bar of the first repeat, then',
      '  |: on the first bar of the next repeat.',
      'If no || is present the score loops back to m.1 (practice loop).',
    ]},
    { h: 'DC / DS al Fine / al Coda', body: [
      'DC al Fine    Jump to m.1; stop at Fine',
      'DC al Coda    Jump to m.1; at @ jump to Coda section',
      'DS al Fine    Jump to $ (segno); stop at Fine',
      'DS al Coda    Jump to $; at @ jump to Coda section',
      'Place $ (segno) and @ (coda jump point) on their measure lines.',
      'The Coda section is skipped on the first pass.',
    ], exampleKey: 'structure' },
    { h: 'Rit / Accel', body: [
      "Add 'rit' or 'accel' with a target tempo to begin a smooth",
      "tempo curve. Spans to the next tempo mark or 'a tempo'.",
      '  4| rit 1/4=60          rit this bar, arrive at 60 BPM',
      '  5| a tempo             snap back to previous tempo',
      '  8| 1/4=100 rit 1/4=60  new base tempo, then rit',
      ' 12| 1/4=60              arrival; rit spreads m.8-11',
      'Tempo is interpolated smoothly on every beat.',
    ], exampleKey: 'rit' },
    { h: 'Tuplets & Rhythmic Patterns', body: [
      'A tuplet group fits N notes into a span of denom-units:',
      '  N[div:slots]',
      '  N = denom-units spanned (default 1 if omitted)',
      '  div = number of equal parts to divide that span into',
      '  slots = note durations in parts (digits, compact or + separated)',
      '  .  in slots = rest (silent, no click)',
      '',
      'Examples:',
      '  [3:21]        triplet: long + short (swing feel)',
      '  [3:111]       three equal triplet notes',
      '  2[3:111]      quarter-note triplet spanning 2 beats',
      '  [3:.11]       triplet with silent first part',
      '  [5:11111]     quintuplet',
      '',
      'Single-element shortcut: a grouping with just one element tiles',
      'to fill the measure if it divides evenly.',
      '  4/4 ([3:21])  → four swing beats  ([3:21]+[3:21]+[3:21]+[3:21])',
      '  6/8 (3)       → two dotted-quarter beats  (same as default)',
    ], exampleKey: 'tuplet' },
    { h: 'Playback Controls', body: [
      '▶ / ◼  Play and stop.',
      'COUNT IN  Adds a count-in before playback; choose beats and note value.',
      '  ON REPEAT: also insert a count-in each time a loop or score repeats.',
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
  ],
};

export default en;
