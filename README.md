# Conductor — Score-Aware Metronome

A metronome that follows a whole piece, not just a single time signature.
Handles tempo changes, odd meters, rehearsal marks, and loops — all defined
in a simple text format.

---

## Quick Start

Open `conductor.html` in any modern browser. No installation required.
An internet connection is needed on first load to fetch the React library
(~300 KB, then cached for offline use).

---

## Score Format

Each line describes what changes at a given measure:

```
measure: [rehearsal mark] time_signature (grouping) 1/note=BPM
```

Putting the measure number in brackets makes it a rehearsal mark automatically:

```
[12]: 4/4, 1/4=120
```

All fields except the measure number are optional.

### Examples

```
1:  4/4, 1/4=90          starts at m.1: 4/4, quarter = 90 bpm
[12]: 7/8 (2+2+3)         m.12 is rehearsal mark "12", time changes to 7/8
17: [B] 7/8              inherits grouping (2+2+3) from previous 7/8
19: (3+2+2)              grouping-only: changes subdivision, keeps 7/8
20: 4/4                  different time sig; later bare "7/8" recalls (3+2+2)
24: 8/8 (3+3+2) 1/4=72   new time sig, new tempo
28: 4/4                  back to 4/4 (tempo carries over)
38: Fine                  playback stops after m.37
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
`19: (3+2+2)` changes the subdivision without re-stating the time signature,
and updates the remembered grouping for future bare references.

### Tempo

Written as `1/note=BPM`, e.g. `1/4=120` means quarter note = 120 bpm.
A dotted note value can be written with a period: `1/4.=60` means dotted
quarter = 60 bpm, the natural way to express compound meter tempos like
6/8 and 12/8. The tempo stays in effect until the next tempo marking.

### Fine

`38: Fine` means playback stops when it reaches measure 38 — so measure 37
is the last measure that plays. To stop after measure 38, write `39: Fine`.

### Comments and blank lines

Lines starting with `#` or `//` are treated as comments and ignored.
Blank lines are also ignored. Use them freely to annotate your score:

```
# Symphony No. 5 — rehearsal score
# ♩=120 throughout except [C]

[1]: 4/4, 1/4=120

# Transition
[17]: 6/8, 1/4.=80
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

The horizontal bar shows the full piece with rehearsal marks and time signature
changes labelled. It scrolls horizontally when the piece is long.

**Desktop:**
- **Click** anywhere to set the cursor (start position)
- **Drag** to define a loop region (highlighted in orange)
- **Shift-click** to set the loop end point independently
- The playhead moves in real time; clicking while playing jumps immediately

**Mobile / touchscreen:**
- **Tap** to set the cursor
- **Double-tap then drag** to define a loop region (avoids conflict with scrolling)
- **Two-finger drag** to scroll the timeline horizontally

### Measure grid

Click or tap any cell to set the cursor. The currently playing measure is
highlighted in gold; the loop region in orange.

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
