// ─── Subdivision options ──────────────────────────────────────────────────────

export const SUBDIV_OPTIONS = [
  { label: 'Primary beats',      targetDenom: 0  },
  { label: 'Subdivided to 4ths', targetDenom: 4  },
  { label: 'Subdivided to 8ths', targetDenom: 8  },
  { label: 'Subdivided to 16ths',targetDenom: 16 },
  { label: 'Subdivided to 32nds',targetDenom: 32 },
];

// ─── Color palettes ───────────────────────────────────────────────────────────

export const PALETTES = {
  dark: {
    bg:        '#0d0d16',
    bgMid:     '#111120',
    bgDark:    '#080810',
    border:    '#252540',
    borderHi:  '#3a3a60',
    measure:   '#ff3333',
    primary:   '#ffaa00',
    unit:      '#00ccff',
    sub:       '#8888bb',
    gold:      '#f0c040',
    green:     '#44ee88',
    greenDim:  '#1a3328',
    red:       '#ee4444',
    redDim:    '#2a0e0e',
    orange:    '#ee9900',
    text:      '#e8e4f8',
    textDim:   '#9090c0',
    textFaint: '#7a7aaa',
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
