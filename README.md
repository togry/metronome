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

The target tempo may be **omitted** when it is the same as the tempo that
follows — it is then taken from the next tempo mark:

```
1| 4/4 1/4=120 rit     no target given …
5| 1/4=60              … so the rit arrives at 60 here
7| 1/4=120
```

This short form cannot be combined with `a tempo`, since there is then no
following tempo mark to take the target from; write the target explicitly in
that case.

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

The return pass is **senza replica** — repeat signs are not taken on the way
back, as is usual. Repetition at a larger scale is what D.C./D.S. is for;
nested repeat signs are not standard notation and are not supported.

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

### Parse warnings

Structural problems are listed in amber below the score editor after parsing.
They never block playback — the parser falls back to reasonable behaviour and
plays on.

| Warning | Fallback |
|---------|----------|
| A grouping is malformed — a tuplet's slots do not sum to its divisor | Grouping ignored |
| A grouping element does not divide the measure evenly | Grouping ignored |
| `rit`/`accel` needs a target tempo (short form used with `a tempo`) | Curve dropped |
| `rit`/`accel` has no target and no following tempo mark | Curve dropped |
| `:\|` has no matching open repeat, after an earlier repeat | Repeats from m.1 |
| `:\|\|` has no matching open repeat | Treated as a plain end barline |
| `\|:` opens while another repeat is still open (nested repeats) | Paired innermost-first |

A `:|` with no open repeat *anywhere* in the score is not a warning — it is
the ordinary way to write a piece that repeats from the top.

---

## Controls

### Playback

- **▶ / ◼** — play and stop
- **COUNT IN** — checkbox to enable a count-in before playback; choose 2, 3,
  or 4 beats of quarters or eighths. Tick **ON REPEAT** to also insert a
  count-in each time a loop region or looping score wraps around.
- **SUBDIVIDE** — how much to click:
  - *Once per measure* — a single downbeat per bar, for conducting long or
    fast passages by the measure rather than the beat
  - *Primary beats* — one click per beat group (the default)
  - *Subdivided to 4ths / 8ths / 16ths / 32nds* — sub-clicks added only where
    the beat divides evenly
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

### Pattern visualiser

Above the timeline, one dot per click in the current measure, sized and
coloured by weight (downbeat / primary / subdivision). Rests are drawn as
small hollow dots. Each click flashes its dot for about 120 ms, or until the
next click if that comes sooner — so fast subdivisions read as a moving light
and slow beats as a distinct pulse. The header line shows the measure number,
any rehearsal mark, the grouping, and the resulting click count.

When stopped, the visualiser previews whatever measure the cursor is on, so
you can step through the piece with the arrow keys and see each bar's pattern
without playing it.

### Timeline

Shows the full piece with rehearsal marks, time signature changes, groupings,
and barline markers, in four label rows per line. Long pieces **wrap onto
multiple lines** and the strip scrolls vertically, auto-scrolling to keep the
playing line in view.

**Desktop:** click to set cursor · drag to define loop · shift-click to set
loop end.

**Mobile:** tap to set cursor · double-tap then drag to define loop ·
two-finger drag to scroll.

The playhead glides continuously across each bar rather than stepping from
barline to barline, so it shows where you are within the measure whatever the
subdivision setting. On stop it stays where it stood, dimmed, as a marker of
where playback left off — distinct from the cursor, which is where playback
will next begin.

### Loops

When a loop region is defined, only measures within that region play and
repeat. Repeat sections fully inside the loop are honoured (play twice per
cycle). The loop end is inclusive.

The **START** and **LOOP END** number inputs below the pattern visualiser set
the same values numerically, with a **CLEAR LOOP** button beside them.

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
  i18n/
    index.js         locale registry, detection, `t` proxy
    useLocale.js     React hook — [t, locale, setLocale]
    en.js  no.js     string tables
extractor.html       standalone tool, not part of the app build
```

### Architecture

**The score is fully expanded at parse time.** `parseScore()` returns both
`measures[]` (state per *written* measure number) and `seq[]` — a flat array
of measure numbers in playback order, with every repeat, D.C./D.S. jump, and
coda skip already resolved. The scheduler just walks `seq[]`; it never has to
reason about musical structure. Measure numbers shown anywhere in the UI are
always written numbers, never played positions. Expansion is capped at 10 000
entries as a runaway guard for pathological scores.

**Audio and visuals are driven off the audio clock, not timers.** The
scheduler runs a 150 ms lookahead, queueing WebAudio oscillator clicks at
exact `AudioContext` times, and pushes each tick's visual state onto a queue
tagged with the time it should fire. A `requestAnimationFrame` loop drains
that queue by comparing against `ctx.currentTime` and mutates the DOM
directly, so flashes stay locked to the clicks without `setTimeout` jitter or
a React re-render per beat. React state updates only when the measure
changes. The **BT** control offsets audio earlier than visuals to compensate
for Bluetooth output latency.

Two things ride on that same loop. Each queued tick carries an *off* time as
well as a fire time, so a flash ends on its own rather than waiting to be
replaced by the next one — without which any pattern whose ticks all target
the same dot, such as *once per measure*, would sit permanently lit. And each
tick carries the start time and length of its bar, which lets the loop
interpolate the playhead across the bar every frame, again with no React
state involved.

**Tempo curves are per tick.** `rit`/`accel` spans are resolved to a start
BPM, target BPM, and a total length in denominator units; each tick
interpolates its own duration from its offset into the span, so the tempo
moves smoothly within a bar rather than stepping at barlines.

### Localization

UI strings live in `src/i18n/`, currently English and Norwegian. `t` is a
Proxy that reads from the active locale and falls back to English for any
missing key, so a partial translation is safe to ship. Some entries are
functions (`t.patternClicks(3)`) and some are whole example scores, which
means the example scores and parser warnings are translatable too. The locale
is detected from `navigator.language` and overridable from the flag menu in
the header; the choice persists in `localStorage` under
`metronomicon_locale`.

To add a locale: copy `en.js`, translate, and register it in the `LOCALES`
map in `index.js`.

### extractor.html

A standalone single-file tool ("Score → Conductor Timesheet") for turning a
score into a printable timesheet. It is not built, imported, or deployed by
the app — open it directly in a browser.

### Tests

```bash
npm test
```

Runs the test suite (`test/*.test.js`) on Node's built-in test runner —
no dependencies, no config. It covers the score language: barlines and
repeat expansion, D.C./D.S. al Fine/Coda, groupings and their inheritance,
tuplet slots, tempo, rit/accel spans, and every warning case. It also checks
the beat patterns each subdivision setting produces, and that every locale
carries a label for every control option. What it exercises is `parser.js`,
`beatModel.js`, and the option tables — all pure; the React layer and the
scheduler are not covered.
