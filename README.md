# Metronomicon — Score-Aware Metronome

A metronome that follows a whole piece, not just a single time signature.
Handles tempo changes, odd meters, rehearsal marks, repeats, ritardando,
accelerando, and practice loops — all defined in a simple text format.

Live: https://togry.github.io/metronome/

---

## Quick Start

```bash
npm install
npm run dev        # local dev server at http://localhost:5173
npm run build      # produces dist/index.html — single self-contained file
```

The built `dist/index.html` can be opened directly in a browser with no
server required.

---

## Practice Loop — Quick Example

The simplest use: list the bars you want to drill, with no end marker.
The score loops back to m.1 continuously until you stop it.

```
1| 4/4, 1/4=120
2| 7/8 (2+2+3)
3| 4/4
4| 5/4
```

That's it — four bars cycling forever. Add a time signature, tempo, or
grouping only on lines where something changes.

---

## Score Format

Each line describes what changes at a given measure:

```
measure_number separator [rehearsal_mark] time_signature (grouping) 1/note=BPM
```

The separator between the measure number and the content determines the
barline type (see **Repeat notation** below). The simplest separator is `|`
or `:`, meaning a normal barline.

All fields except the measure number and separator are optional.

### Barline separators

| Separator | Meaning |
|-----------|---------|
| `\|` or `:` | Normal barline |
| `\|:` | Open repeat |
| `:\|` | Close repeat |
| `\|:\|` | Single-measure repeat |
| `\|\|` | Double barline / section boundary (last one ends the score) |
| `\|\|:` | Double barline + open repeat |
| `:\|\|` | Close repeat + double barline |

To start a new repeat immediately after closing one, use `:\|` on the last
bar of the first repeat and `\|:` on the first bar of the next — two
separate lines rather than a combined `:\|:` glyph, which is ambiguous
(is that bar part of the first repeat, the second, or both?).

### Example score

```
1|: 4/4, 1/4=90       open repeat at m.1
8:| [A]               close repeat; m.1-8 plays twice; rehearsal mark A
9|: $ 7/8 (2+2+3)     open repeat; segno ($) at m.9
16:|| [B]             close repeat; double barline; rehearsal mark B
17|: 4/4              open new repeat
24:| @                close repeat; coda jump point (@) for D.S.
25| [C] 1/4=120       new section, faster
32| DS al Coda        jump to $, and on return bail out at @
33| Coda              coda section starts here
36||                  end of score
```

Putting the measure number in brackets is equivalent to supplying an explicit
rehearsal mark with that number as the label:

```
[12]| 4/4, 1/4=120    same as: 12| [12] 4/4, 1/4=120
```

### Time signatures

Standard signatures like `4/4`, `3/4`, `6/8`, `2/2` work as expected.
For compound meters (6/8, 12/8) the primary beat is the dotted quarter automatically.

### Groupings

For odd meters, specify how beats are grouped within the measure:

| Signature | Grouping | Primary beats |
|-----------|----------|---------------|
| `7/8` | `(2+2+3)` | 3 beats: ♩♩♩. |
| `5/8` | `(2+3)` | 2 beats: ♩ ♩. |
| `8/8` | `(3+3+2)` | 3 beats: ♩. ♩. ♩ |

Groupings are remembered per time signature. If you write `7/8 (2+2+3)` at
measure 4 and bare `7/8` at measure 19, measure 19 automatically inherits
`(2+2+3)`.

### Tuplets & rhythmic patterns

A tuplet group fits a set of notes into a given number of denom-units:

```
N[div:slots]
```

- `N` — denom-units spanned (omit for 1)
- `div` — number of equal parts to divide that span into
- `slots` — note durations in parts; digits run together (compact) or separated by `+`; `.` is a rest

```
[3:21]       triplet: 2 parts long + 1 part short  (swing)
[3:111]      three equal triplet notes
2[3:111]     quarter-note triplet spanning 2 beats
[3:.11]      triplet with silent first part
[5:11111]    quintuplet
[8:71]       double-dotted 8th + 32nd
```

**Single-element tiling shortcut** — a grouping containing only one element
is automatically tiled to fill the measure (error if it doesn't divide evenly):

```
4/4 ([3:21])       → [3:21]+[3:21]+[3:21]+[3:21]  (four swing beats)
4/4 ([3:111])      → twelve equal triplet 8ths
6/8 (3)            → 3+3  (same as the compound-meter default)
```

Rest slots (`.`) produce a silent tick — the dot is shown hollow in the
pattern visualiser and the header flash dims, but no audio click fires.
Tuplets always play as written regardless of the SUBDIVIDE setting.

**Pasteable example** covering common tuplet patterns:

```
1: 4/4 1/4=90
3: (1+1+2[3:111])          # triplets of 1/4ths
5: (1+1+[3:111]+[3:111])   # triplets of 1/8ths
7: (1+1+2[5:11111])        # quintuplets
9: ([3:21])                # swing beat (tiled ×4)
11: ([4:31])               # dotted 1/8th + 16th (tiled ×4)
13: ([8:71])               # d-dotted 1/8th + 32nd (tiled ×4)
# patterns with rests
15: (1+1+[3:.11]+[3:.11])           # triplets with rest on first beat
17: (1+1+[4:..11]+[4:..11])         # 1/8th rest + 2 1/16ths
19: (1+1+[3:1.1]+[3:1.1])           # triplets with rest on middle beat
21: ([3:.11]+[4:.111]+[5:.1111]+[6:.11111])
# A particularly troublesome pattern
23: 6/4 ([2:11]+[3:.11]+[2:11]+[3:.11]+2)
25:
```



### Tempo

Written as `1/note=BPM`, e.g. `1/4=120` means quarter note = 120 bpm.
A dotted note value can be written with a period: `1/4.=60` means dotted
quarter = 60 bpm, the natural way to express compound meter tempos.
The tempo stays in effect until the next tempo marking.

### Rit / Accel

Add `rit` or `accel` with a target tempo to begin a smooth tempo curve.
The curve spans to the next explicit tempo mark or `a tempo`.

```
1| 4/4 1/4=160
3| rit 1/4=60          rit from m.3; arrive at 60 BPM
7| 1/4=60 accel 1/4=160  new base tempo, then accelerate
12| 1/4=160            arrival; accel spreads across m.7-11
```

Use `a tempo` to snap back to the tempo that was in effect before the rit/accel:

```
4| rit 1/4=60
5| a tempo             restores the pre-rit BPM
```

Tempo is interpolated smoothly on every beat, not just once per bar.

### Repeat notation

The score is pre-expanded at parse time into a flat playback sequence.

**Simple repeats** — `|:` opens a repeat section, `:|` closes it. The section
plays twice.

**Single-measure repeat** — `|:|` on a single line repeats just that measure.

**D.C. / D.S. al Fine / al Coda**

| Directive | Meaning |
|-----------|---------|
| `DC al Fine` | Jump to m.1; stop when `Fine` is reached |
| `DC al Coda` | Jump to m.1; at `@` jump to the `Coda` section |
| `DS al Fine` | Jump to `$` (segno); stop at `Fine` |
| `DS al Coda` | Jump to `$`; at `@` jump to the `Coda` section |

**End of score** — the last `||` or matched `:|` ends playback. Omit it
entirely for a practice loop that repeats from m.1.

### Comments and blank lines

Anything from `#` or `//` to the end of a line is a comment. Blank lines
are ignored.

```
# Symphony No. 5 — rehearsal score
1|: 4/4, 1/4=120
16:|| [A]              # section A ends here
```

---

## Controls

### Playback

- **▶ / ◼** — play and stop
- **COUNT IN** — checkbox to enable a count-in before playback; choose 2, 3,
  or 4 beats of quarters or eighths. Tick **ON REPEAT** to also insert a
  count-in each time a loop region or looping score wraps around.
- **SUBDIVIDE** — primary beats only, or subdivided to 4ths / 8ths / 16ths /
  32nds (sub-clicks added only where the beat divides evenly)
- **TEMPO** slider — 10–150% of written tempo; actual BPM shown next to slider
- **BT** — Bluetooth latency offset (0–500 ms); compensates for wireless
  headphone delay so clicks and visual flashes align with what you hear
- **☀ / 🌙** — toggle between dark and daylight colour palettes

### Click sounds

| Colour | Meaning |
|--------|---------|
| 🔴 Red | Measure downbeat |
| 🟡 Amber | Primary beat |
| 🔵 Cyan | Subdivision click |

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Stop |
| `←` / `→` | Move cursor one measure |
| `Shift+→` | Start a loop from cursor, or extend existing loop end |
| `Shift+←` | Shrink loop end, or start a loop ending before cursor |

Arrow keys and Space are ignored while typing in the score editor.

### Timeline

Shows the full piece with rehearsal marks, time signature changes, and
barline markers. Scrolls horizontally for long pieces.

**Desktop:** click to set cursor · drag to define loop · shift-click to set
loop end · playhead tracks position in real time.

**Mobile:** tap to set cursor · double-tap then drag to define loop ·
two-finger drag to scroll.

### Loops

When a loop region is defined, only measures within that region play and
repeat. Repeat sections fully inside the loop are honoured (play twice per
cycle). The loop end is inclusive.

### Measure grid

Click any tile to set the cursor. Active measure highlighted in gold; loop
region in orange. Tiles show time signature, grouping, and structural
markers (`$`, `@`, directives).

---

## Hosting

The built `dist/index.html` is a single self-contained file — no assets
folder, no server needed.

**GitHub Pages (this repo):** pushing to `main` triggers a GitHub Actions
workflow that runs `npm run build` and deploys `dist/` automatically.

**Netlify:** drag `dist/index.html` onto [app.netlify.com/drop](https://app.netlify.com/drop).

**Anywhere else:** copy `dist/index.html` to any static file host.

---

## Development

```
src/
  parser.js          score text → measures[], seq[], warnings
  beatModel.js       beat patterns, tempo math (pure functions)
  timeline.js        timeline event list, loop seq bounds
  constants.js       palettes, subdivision options, example scores
  Metronome.jsx      top-level component: all state, scheduler, layout
  main.jsx           React entry point
  components/
    ScorePanel.jsx   score editor, clear/paste/parse buttons
    HelpModal.jsx    in-app help overlay
    Timeline.jsx     timeline strip with markers and playhead
    MeasureGrid.jsx  measure tile grid
```
