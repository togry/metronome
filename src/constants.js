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

export const RIT_EXAMPLE_SCORE = `1| 4/4 1/4=160
3| rit 1/4=60
7| 1/4=60 accel 1/4=160
8| 3/4
9| 7/8 (2+2+3)
11| 9/8
15| 3/4 1/4=160`;

export const DEFAULT_SCORE = `1|: 4/4, 1/4=90      # |: opens a repeat section
8:| [A]              # :| closes it; rehearsal mark A
9|: $ 7/8 (2+2+3)   # $ = segno; new repeat, odd meter
16:|| [B]             # :|| closes repeat; || marks section boundary; rehearsal mark B
17|: 4/4              # |: opens new repeat section
24:| @               # close repeat; @ = coda jump point on D.S. pass
25| [C] 1/4=120      # new section, faster
32| DS al Coda       # go back to $ (segno), on return jump to @
33| Coda             # coda section starts here
36||                 # end of score (last double barline)`;
