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
[1]: 4/4, 1/4=120
```

All fields except the measure number are optional.

### Examples

```
1: 4/4, 1/4=90          starts at m.1: 4/4, quarter = 90 bpm
[12]: 7/8 (2+2+3)        m.12 is rehearsal mark "12", time changes to 7/8
19: [B] 7/8 (3+2+2)      m.19 is rehearsal mark "B", different grouping
24: 8/8 (3+3+2) 1/4=72   m.24: new time sig, new tempo
28: 4/4                   m.28: back to 4/4 (tempo carries over)
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

### Tempo

Written as `1/note=BPM`, e.g. `1/4=120` means quarter note = 120 bpm.
The tempo stays in effect until the next tempo marking.

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
    (e.g. a group of 3 eighths won't subdivide to quarters)
- **REHEARSAL TEMPO** — scale the tempo from 10% to 150% of the written speed;
  the actual BPM is shown next to the slider

### Click sounds

| Colour | Sound | Meaning |
|--------|-------|---------|
| 🔴 Red | High pitch | Measure downbeat |
| 🟡 Amber | Mid pitch | Primary beat |
| 🔵 Cyan | Lower pitch | Subdivision click |

### Timeline

The horizontal bar shows the full piece with rehearsal marks and time signature
changes labelled.

- **Click** anywhere on the timeline to set the start position
- **Drag** to define a loop region (highlighted in orange); playback will
  repeat that section until stopped
- **Shift-click** to set the loop end point independently
- The start position and loop end can also be typed in the fields below the timeline
- The **red playhead** moves in real time during playback; clicking the timeline
  while playing jumps immediately to that measure

### Measure grid

The grid at the bottom shows every measure. Click any cell to set the start
position. The currently playing measure is highlighted in gold.

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