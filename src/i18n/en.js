// ─── English (source) ─────────────────────────────────────────────────────────

const en = {

  // ── Header ──────────────────────────────────────────────────────────────────
  appTitle:        '♩ METRONOMICON',
  appSubtitle:     'SCORE-AWARE METRONOME',
  tooltipReset:    'Reset score and settings to defaults',
  confirmReset:    'Reset the score and all settings to their defaults? Your saved score will be discarded.',
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
  // Kept short — these set the width of the dropdown, in the most crowded
  // row of the layout.
  subdivOptions: [
    'Per measure',
    'Primary beats',
    'Div to 4ths',
    'Div to 8ths',
    'Div to 16ths',
    'Div to 32nds',
  ],
  labelTempo:      'TEMPO',
  tooltipTempoReset: 'Back to written tempo (100%)',
  tooltipTempoCurve: 'Tempo is changing — the figure is the written tempo, not the one playing',
  errClipboard:    'Clipboard read failed — paste manually and click PARSE',
  labelBpm:        'bpm',
  labelBt:         'BT',
  labelBtAuto:     'auto',
  tooltipBtAuto:   'Use the delay reported by the device',

  // ── Pattern visualiser ──────────────────────────────────────────────────────
  labelPattern:    'PATTERN',
  patternClicks:   (n) => `${n} click${n !== 1 ? 's' : ''}`,

  // ── Start / loop row ────────────────────────────────────────────────────────
  labelStart:      'START',
  labelLoopEnd:    'LOOP END',
  btnClearLoop:    'CLEAR LOOP',
  loopRange:       (s, e) => `↺ m.${s}–${e}`,
  startAt:         (m)    => `start m.${m}`,

  // ── Timeline ─────────────────────────────────────────────────────────────────
  timelineHintDesktop: 'TIMELINE · click = set start · drag = loop · shift-click = set loop end',
  timelineHintMobile:  'TIMELINE · tap = set start · hold+drag = loop · drag = scroll',

  // ── Score panel ─────────────────────────────────────────────────────────────
  // (ScorePanel.jsx strings — add here when that file is i18n'd)

  // ── Example scores ───────────────────────────────────────────────────────────
  defaultScore: `1| 4/4 1/4=90
5| 3/4
9| 7/8 (223)
12|  # Repeat indefinitely
# Click "?" for more examples`,

  exampleRit: `1| 4/4 1/4=160
3| rit 1/4=60
7| 1/4=60 accel 1/4=160
8| 3/4
9| 7/8 (2+2+3)  # subdivided
10| 7/8 (322)   # abbr. form
11| 9/8
15| 3/4 1/4=160`,

  exampleTuplet: `1: 4/4 1/4=90
3: (1+1+2[3:111])          # triplets of 1/4ths
5: (1+1+[3:111]+[3:111])   # triplets of 1/8ths
7: (1+1+2[5:11111])        # quintuplets
9: ([3:21])                       # swing beat (tiled ×4)
11: ([4:31])                         # dotted 1/8th + 16th (tiled ×4)
13: ([8:71])                         # d-dotted 1/8th + 32nd (tiled ×4)
# patterns with rests
15: (1+1+[3:.11]+[3:.11])           # triplets with rest on first beat
17: (1+1+[4:..11]+[4:..11])         # 1/8th rest + 2 1/16ths
19: (1+1+[3:1.1]+[3:1.1])           # triplets with rest on middle beat
21: ([3:.11]+[4:.111]+[5:.1111]+[6:.11111])
# A particularly troublesome pattern
23: 6/4 ([2:11]+[3:.11]+[2:11]+[3:.11]+2)
25:`,

  exampleStructure: `1|: 4/4 1/4=90        # |: opens a repeat section
8:|                   # :| closes it
9|: [A] $ 7/8 (223)   # $ = segno; new repeat, new meter; rehearsal mark A
16:|                  # close repeat
17||: [B] 4/4         # new repeat, double barline; rehearsal mark B
24:|                  # close repeat
25| [C] 1/4=120       # rehearsal mark C, new tempo
28| @                 # coda jump point
32| DS al Coda        # go back to $; on return jump to @
33| Coda              # coda section starts here
36||                  # end of score`,

  // ── Parser warnings / errors ─────────────────────────────────────────────────
  // These are parameterised; keep the function signatures intact.
  errTooManyMeasures: (mn, max) =>
    `m.${mn}: measure number exceeds the limit of ${max} — check for a typo`,
  warnGroupingInvalid: (mn) =>
    `m.${mn}: malformed grouping — a tuplet's slots must sum to its divisor; grouping ignored`,
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
  warnNestedRepeat: (mn, openMn) =>
    `m.${mn}: opens a repeat while the one at m.${openMn} is still open — nested repeats are not standard notation; use D.C./D.S. for larger-scale repetition`,

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
      'Alternating subdivisions: list the alternatives and they cycle,',
      '  5/8 (23,32)   m.1 = 2+3, m.2 = 3+2, m.3 = 2+3 ...',
      '  Same thing:  (2+3,3+2)   (23),(32)   (2+3),(3+2)',
      '  Any length:  7/8 (223,232,322) repeats every three bars.',
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
      'A tuplet spans N beats and divides that span into div equal parts,',
      'which are then combined into notes and rests:',
      '  N[div:slots]',
      '  N     = beats spanned (default 1 if omitted)',
      '  div   = number of equal parts the span is divided into',
      '  slots = how parts are combined: digits and dots sum to div,',
      '          digit = note (duration in parts), . = rest (one part)',
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
      '  6/8 (2)       → three groups of two eighth notes  (hemiola feel)',
    ], exampleKey: 'tuplet' },
    { h: 'Playback Controls', body: [
      '▶ / ◼  Play and stop.',
      'COUNT IN  Adds a count-in before playback; choose beats and note value.',
      '  ON REPEAT: also insert a count-in each time a loop or score repeats.',
      'SUBDIVIDE  Once per measure, primary beats only, or subdivided to',
      '  4ths / 8ths / 16ths / 32nds.',
      '  Sub-clicks are added only where a beat divides evenly.',
      'TEMPO slider  10–150% of written tempo.',
      '  Tap the percentage to go back to 100%.',
      '☀ / 🌙  Toggle between dark and daylight palettes.',
      '',
      'The score and all settings are kept between visits.',
      '♩ METRONOMICON  Click the title — or press and hold it on a',
      '  touchscreen — to reset the score and every setting to defaults.',
    ]},
    { h: 'Timeline', body: [
      'Shows the full piece with rehearsal marks, time signatures, and barlines.',
      'Pointer: click → set start · drag → loop region · shift-click → loop end.',
      'Touch: tap → set start · hold then drag → loop region · drag → scroll.',
      'Tap or click while playing to jump immediately.',
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
  ],
};

export default en;
