// ─── Subdivision options ──────────────────────────────────────────────────────

// targetDenom: -1 = one click per measure; 0 = primary beats only;
// 4/8/16/32 = subdivide to that note value.
export const SUBDIV_OPTIONS = [
  { label: 'Once per measure',   targetDenom: -1 },
  { label: 'Primary beats',      targetDenom: 0  },
  { label: 'Subdivided to 4ths', targetDenom: 4  },
  { label: 'Subdivided to 8ths', targetDenom: 8  },
  { label: 'Subdivided to 16ths',targetDenom: 16 },
  { label: 'Subdivided to 32nds',targetDenom: 32 },
];

// ─── Color palettes ───────────────────────────────────────────────────────────
//
// Dark-theme contrast, measured against bgMid (#111120, the lightest of the
// three dark backgrounds, so the worst case):
//
//   text       15.0     — primary
//   textDim    10.5     — secondary, 10-11px
//   textFaint   8.0     — smallest labels, 8-9px
//   borderHi    2.6     — divider, hover edge
//   border      1.8     — panel separators
//
// The text ramp deliberately exceeds WCAG AA. AA's 4.5:1 assumes 18.66px text,
// and these labels render at 8–11px in letterspaced uppercase, which reads far
// fainter than the ratio alone suggests. The separators stay well below the
// 3:1 non-text guideline on purpose: they only need to delineate panels, and
// brightening them would have them competing with the text for attention.
// Keep that ordering if you touch these — the ramp *is* the hierarchy.
//
// `sub` (6.0 here) is a mark colour for subdivision dots, not part of the text
// ramp, so it is free to sit anywhere in the ordering.

export const PALETTES = {
  dark: {
    bg:        '#0d0d16',
    bgMid:     '#111120',
    bgDark:    '#080810',
    border:    '#3c3c67',
    borderHi:  '#525288',
    measure:   '#ff3333',
    primary:   '#ffaa00',
    unit:      '#00ccff',
    sub:       '#8e8ebe',
    gold:      '#f0c040',
    green:     '#44ee88',
    greenDim:  '#1a3328',
    red:       '#ee4444',
    redDim:    '#2a0e0e',
    orange:    '#ee9900',
    text:      '#e8e4f8',
    textDim:   '#c0c0db',
    textFaint: '#a7a7c7',
    code:      '#00cc88',
    reh:       '#88aaff',
  },
  light: {
    bg:        '#f5f0e8',
    bgMid:     '#ece6d8',
    bgDark:    '#ddd6c4',
    border:    '#b0a890',
    borderHi:  '#8a7e6a',
    measure:   '#b80e0e',
    primary:   '#7a3e00',
    unit:      '#003d66',
    sub:       '#4a2d80',
    gold:      '#5e3f00',
    green:     '#003d1a',
    greenDim:  '#c8ecd8',
    red:       '#bb1111',
    redDim:    '#f5d8d8',
    orange:    '#b85000',
    text:      '#1a1408',
    textDim:   '#3e3428',
    textFaint: '#5a4e38',
    code:      '#004d2a',
    reh:       '#1a3a8a',
  },
};

// ─── Example scores ───────────────────────────────────────────────────────────

export const getRitExampleScore = (t) => t.exampleRit ?? `1| 4/4 1/4=160
3| rit 1/4=60
7| 1/4=60 accel 1/4=160
8| 3/4
9| 7/8 (2+2+3)
11| 9/8
15| 3/4 1/4=160`;

export const getTupletExampleScore = (t) => t.exampleTuplet ?? `1: 4/4 1/4=90
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
25:`;

export const getStructureExampleScore = (t) => t.exampleStructure ?? `1|: 4/4 1/4=90       # |: opens a repeat section
8:| [A]               # :| closes it; rehearsal mark A
9|: $ 7/8 (223)       # $ = segno; new repeat, odd meter
16:|| [B]              # :|| closes repeat + double barline
17|: 4/4               # open new repeat section
24:| @                 # close repeat; @ = coda jump point
25| [C] 1/4=120        # new section, faster
32| DS al Coda         # go back to $; on return jump to @
33| Coda               # coda section starts here
36||                   # end of score`;

export const getDefaultScore = (t) => t.defaultScore ?? `1| 4/4 1/4=90
5| 3/4
9| 7/8 (223)
12|  # Repeat indefinitely
# Click "?" for more examples`;

// Legacy named exports kept for backward compatibility — use locale-aware getters above
export const RIT_EXAMPLE_SCORE       = getRitExampleScore({});
export const TUPLET_EXAMPLE_SCORE    = getTupletExampleScore({});
export const STRUCTURE_EXAMPLE_SCORE = getStructureExampleScore({});
export const DEFAULT_SCORE           = getDefaultScore({});
