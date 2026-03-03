# Conductor — Score-Aware Metronome

A metronome that follows a whole piece, not just a single time signature.
Handles tempo changes, odd meters, rehearsal marks, repeats, and loops —
all defined in a simple text format.

---

## Quick Start

Open `conductor.html` in any modern browser. No installation required.
An internet connection is needed on first load to fetch the React library
(~300 KB, then cached for offline use).

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
measure 4 and bare `7/8` at measure 19 (even after intervening time signatures),
measure 19 automatically inherits `(2+2+3)`. A grouping-only line like
`19| (3+2+2)` changes the subdivision without re-stating the time signature,
and updates the remembered grouping for future bare references.

### Tempo

Written as `1/note=BPM`, e.g. `1/4=120` means quarter note = 120 bpm.
A dotted note value can be written with a period: `1/4.=60` means dotted
quarter = 60 bpm, the natural way to express compound meter tempos like
6/8 and 12/8. The tempo stays in effect until the next tempo marking.

### Repeat notation

The score is pre-expanded at parse time into a flat playback sequence, so
all repeat-related structures affect only what is heard — the measure numbers
in the score are always the written (not played) numbers.

**Simple repeats** — `|:` opens a repeat section, `:|` closes it. The section
plays twice. A `:|` at the very start of the score with no prior `|:` implicitly
repeats from m.1.

**Single-measure repeat** — `|:|` on a single line repeats just that measure.

**Back-to-back sections** — use `:|` then `||:` on consecutive lines:

```
8:|      close first repeat
9||:     double barline + open second repeat
```

**D.C. / D.S. al Fine / al Coda**

| Directive | Meaning |
|-----------|---------|
| `DC al Fine` | Jump to m.1; stop when `Fine` is reached |
| `DC al Coda` | Jump to m.1; at `@` jump to the `Coda` section |
| `DS al Fine` | Jump to `$` (segno); stop at `Fine` |
| `DS al Coda` | Jump to `$`; at `@` jump to the `Coda` section |

Place `$` (segno) and `@` (coda jump point) as standalone tokens on their
respective measure lines. The `Coda` section is skipped on the first pass
when a D.C./D.S. al Coda is present; it is entered only via the jump.

**End of score** — the last `||` or matched `:|` in the score ends playback.
Use `||` (plain double barline) to end cleanly. `:||` is only valid when
there is a matching `|:` earlier; an unmatched `:||` is flagged as a warning.

### Parse warnings

Structural problems are shown below the score editor in amber after parsing:

- `:|` after any prior repeat with no matching `|:`
- `:||` with no matching `|:` anywhere

Warnings do not prevent playback; the parser falls back to reasonable behaviour
(an unmatched `:|` with no prior repeats repeats from m.1).

### Comments and blank lines

Anything from `#` or `//` to the end of a line is treated as a comment and
ignored. Comments can appear on their own line or after the content on any
line. Blank lines are also ignored. Use them freely to annotate your score:

```
# Symphony No. 5 — rehearsal score
# ♩=120 throughout except [C]

1|: 4/4, 1/4=120

# Transition
16:|| [A]
17||: 6/8, 1/4.=80
```

---

## Controls

### Playback

- **▶ PLAY / ◼ STOP** — start or stop the metronome
- **COUNT IN** — checkbox to enable a count-in before playback starts;
  choose 2, 3, or 4 beats of quarters or eighths
- **SUBDIVIDE** — what level of clicks to hear:
  - *Primary beats* — one click per beat group (e.g. 3 clicks in 7/8)
  - *Subdivided to 4ths / 8ths / 16ths / 32nds* — adds sub-clicks within
    each beat, but only where the beat divides evenly into that note value
- **REHEARSAL TEMPO** — scale the tempo from 10–150% of written speed;
  actual BPM shown next to the slider
- **☀ / 🌙** — toggle between dark (night) and light (daylight) colour palettes

### Click sounds

| Colour | Sound | Meaning |
|--------|-------|---------|
| 🔴 Red | High pitch | Measure downbeat |
| 🟡 Amber | Mid pitch | Primary beat |
| 🔵 Cyan | Lower pitch | Subdivision click |

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Stop |
| `←` / `→` | Move cursor one measure; loop is preserved |
| `Shift+→` | Start a loop from cursor, or extend existing loop end |
| `Shift+←` | Shrink loop end, or start a loop ending before cursor |

Arrow keys and Space are ignored while typing in the score editor.

The cursor (`startMeasure`) and the loop region are independent. Navigate
freely with plain arrows without disturbing the loop; use Shift+arrows to
define or adjust it. A Shift+arrow from outside the current loop's anchor
clears the old loop and starts a fresh one from the cursor position.

### Timeline

The horizontal bar shows the full piece with rehearsal marks, time signature
changes, and repeat/navigation markers labelled. It scrolls horizontally
when the piece is long. Double barlines (`||`, `:||`) are shown as heavier
lines; segno (`$`), coda jump (`@`), and directives are shown in colour.

**Desktop:**
- **Click** anywhere to set the cursor (start position)
- **Drag** to define a loop region (highlighted in orange)
- **Shift-click** to set the loop end point independently
- The playhead moves in real time; clicking while playing jumps immediately

**Mobile / touchscreen:**
- **Tap** to set the cursor
- **Double-tap then drag** to define a loop region (avoids conflict with scrolling)
- **Two-finger drag** to scroll the timeline horizontally

### Loops and repeats

When a loop region is defined, only the measures within that region play and
repeat. Repeat sections (`|: … :|`) that fall **completely inside** the loop
are honoured — they play twice on every loop cycle. Repeats that **span a
loop boundary** are ignored; only the measures within the loop window play.

The loop end is **inclusive** — a loop set from m.6 to m.9 plays m.6, 7, 8,
and 9, then wraps back to m.6.

### Measure grid

Click or tap any cell to set the cursor. The currently playing measure is
highlighted in gold; the loop region in orange. Tiles show the measure number,
time signature, grouping, and any structural markers (`$`, `@`, directives).

### Mobile use

On small screens the score editor is hidden by default. Tap **SCORE** in the
header to open it as a full-screen overlay; tap **PARSE SCORE** to apply and
return. The measures grid scrolls vertically with a normal swipe.

---

## Hosting

The app is a single HTML file and can be hosted anywhere that serves static files.

**Netlify (quickest):** drag `conductor.html` onto [app.netlify.com/drop](https://app.netlify.com/drop) and get an instant URL.

**GitHub Pages:** rename the file to `index.html`, push to a repository, and
enable Pages under Settings → Pages → Deploy from branch.

**GitLab Pages:** same as GitHub, but also add a `.gitlab-ci.yml`:
```yaml
pages:
  script:
    - mkdir public
    - cp index.html public/
  artifacts:
    paths: [public]
```
