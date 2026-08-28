# OpenScout — theme range · production notes

**Deliverable:** two finished films, one locked picture, two original scores.
**A · BEAT** and **B · DRIFT** — 1920×1080, 60 fps, 1872 frames, 31.200000 s.

---

## 1. The brief, and what it actually constrains

The ask was a clean A/B: *"Build ONE locked visual montage, then deliver TWO
final renders whose visuals, timing, typography, transitions, and grade are
identical. The only substantive difference should be the score."*

That is a stronger constraint than it first reads. It is easy to produce two
films that *look* the same and are not, because any of the following silently
breaks it:

- a composition that reads the score's duration, name or gain to lay anything out;
- a render that picks a different CRF, preset or concurrency per target;
- a "small" per-variant tweak that seems harmless at the time.

So the guarantee is built structurally rather than maintained by discipline:

| Layer | How it is guaranteed | How it is proved |
|---|---|---|
| Edit | `THEME_RANGE_EDIT` is one object; the two exports spread it and override only `score`/`scoreGain` | Validator diffs the two edit objects key by key against `AB_VARIABLE_KEYS` |
| Composition | The only place `edit.score`/`edit.scoreGain` are read is the `<Audio>` element, which emits no pixels | Read the bottom of `OpenScoutThemeRange.tsx` — there is no other reference |
| Render | Encoder settings are module-level constants shared by both targets, not per-target fields | — |
| Delivery | — | Every decoded video frame of both MP4s is SHA-1 hashed and compared frame for frame |

The last row is the one that matters, because it is measured on the delivered
files and therefore survives a mistake in any of the rows above.

---

## 2. The source, and the journey that was already in it

`theme-range.mp4` — 1514×1072, 34.583 s, 60 fps, H.264, no audio, browser chrome
already removed.

The theme boundaries were **measured, not eyeballed**: mean luma per frame across
the whole timeline for the light/dark switch, and mean chroma (U/V) over the LIVE
SPECIMEN panel for the palette switches, then confirmed against contact sheets.

| Window (s) | State |
|---|---|
| 0.000 – 3.850 | Dark · Scout — the conservative default |
| 3.850 – 9.117 | Dark · Graphite |
| 9.117 – 15.317 | Dark · Polar |
| 15.317 – 19.017 | Dark · Solar |
| 19.017 – 22.700 | **LIGHT** · Solar — whole-frame luminance flip |
| 22.700 – 27.350 | Light · Scout |
| 27.350 – 34.583 | Dark · Scout — the return |

The capture already tells the story the brief asked for — open conservative, show
the range, come home. So the edit's job was to *time* it, not to reorder it. No
beat is out of source order anywhere in the film.

One thing the measurement caught that a visual pass would have missed: the page
**scrolls** as well as recolours, and a chroma jump at 3.850 s is a theme switch
while a similar-looking one nearby is only scroll. Every boundary above was
cross-checked on a contact sheet before it was used.

---

## 3. The grid — built on the music that arrived, not the one requested

MiniMax does not honour a requested BPM. The V3 provenance in this repo records
143.9 delivered against 120 asked for; this pass asked BEAT for 120 and measured
**99.84**.

Rather than fight it, the film was built on the delivered tempo, nudged to a
round value:

- `atempo = 100.000 / 99.84` → exactly **100.000 BPM**
- one 4/4 bar = **2.400 s** = **exactly 144 frames at 60 fps**

Every chapter is a whole number of those bars, so every chapter boundary is a
downbeat. The mastering window is then **snapped to a measured downbeat** rather
than cut at a round number of seconds — beat phase from the onset envelope, bar
phase from whichever of the four beat positions carries the most onset energy.
Cutting a bar-locked film at an arbitrary offset would have put every boundary a
fraction of a beat off for the entire runtime.

DRIFT has no pulse to align, so it is cut for **shape** instead: it opens in the
quietest sustained passage of its generation, blooms under the light reveal at
16.8 s of film, and comes from a window that decays naturally rather than one
still rising.

---

## 4. The one-beat pre-roll — why the film has no transitions of its own

Each chapter opens **exactly one beat (0.600 s / 36 frames) before its theme
switch.**

So the cut lands on the downbeat showing the *outgoing* theme, and the interface
recolours on beat two. The edit asks the question; the product answers it.

This is what "let UI state changes motivate transitions" buys, and it is the
reason the film contains **no artificial wipe, luma ramp or colour flash at all**.
Every visible transition is the real interface recolouring, in full, at true
speed. Nothing is cut away mid-recolour, and no cut is retimed — every playing
cut runs at `rate: 1`, which the validator asserts.

The room turns with it: the stage lifts from near-black to warm graphite across
the same beat, centred on the recolour frame rather than on the cut. An earlier
pass ramped it from the cut and lifted the room a beat early, which gave the
reveal away.

### The cut

| # | Chapter | Bars | Source window (s) | Note |
|---|---|---|---|---|
| I | SCOUT · DARK | 2 | hold @ 0.850, then 0.850 – 3.250 | opens held, so the type can land |
| II | GRAPHITE | 2 | 3.250 – 8.050 | push 1.20× — cards *and* specimen |
| III | POLAR | 2 | 8.517 – 13.317 | push 1.42× — the specimen alone |
| IV | SOLAR | 1 | 14.717 – 17.117 | |
| V | LIGHT | 1 | 18.417 – 20.817 | **the reveal** — locked, no push |
| VI | SCOUT · LIGHT | 1 | 22.100 – 24.500 | |
| VII | SCOUT · DARK | 2 | 26.750 – 31.550 | the return, given room |
| — | outro | 2 | — | wire mark lockup |

13 bars = 1872 frames = 31.200 s.

The shape is deliberate. Graphite and Polar hold for two bars each because they
are *comparisons*, and comparisons need dwell. Then the film accelerates — Solar,
Light and Scout·Light land one bar apiece — so the reveal arrives with momentum
rather than being announced. The return gets two bars back and the outro two
more, so the film rests on the identity it came from.

All four inter-chapter skips are forward, and every one of them sits inside a
dwell, never across a recolour.

---

## 5. Camera, and the decision not to use a loupe

The brief asked for "restrained macro/detail zooms" but also "do not obscure the
real interaction." An inset magnifier would have violated the second to satisfy
the first, so the film moves the **camera** instead and keeps one unbroken image.

Two pushes, both of which **settle and rest**:

- **II** — 1.20× on (990, 596). Wide enough to hold the card grid *and* the live
  specimen, because this chapter establishes that the two are connected. `cx` is
  set so the visible region's right edge clears 1404 px rather than slicing the
  specimen in half.
- **III** — 1.42× on (1230, 530). The only real detail shot: the live specimen,
  where a palette change is actually legible.

Each is moving for 84 of its 288 frames and still for the other 204. Chapters
IV–VII — the reveal and the return — are locked absolutely still, so the
strongest idea in the film carries attention without competition.

*(One bug worth recording: the push was first applied to the same element that
carried `overflow: hidden`, which scales the clip along with the picture and let
the screen grow to fill the frame. The fix is two divs — a fixed window and an
inner layer that is the only thing that moves.)*

---

## 6. Preserving source clarity

- **Never upscaled.** 1514 px of source is presented at **1340 px** on a 1920
  frame — a 0.885 downscale. Inside a push, 1.20–1.42× magnification brings the
  effective scale back to roughly 1.06–1.26, still close to 1:1. Filling 1920
  would have meant a 1.27× upscale of a text-dense interface for the whole
  runtime.
- **60 fps, not the house 30.** The subject is a colour *transition*; decimating
  would have thrown away half of every recolour and half of the cursor's motion
  for no gain.
- **No grade on the screen.** No LUT, no curve, no saturation push, no overlay
  blend touches the capture's pixels anywhere in the composition. The grade is
  applied to the stage; the one effect that reaches the screen's neighbourhood
  (`Bloom`) is drawn strictly behind and outside it.
- Grain is deliberate and functional as well as aesthetic: large near-flat dark
  gradients band badly in 8-bit H.264, and a little noise dithers the ramp away.
  It sits beneath the screen layer, never on the capture.

---

## 7. Copy

Minimal, per the brief. The film has **one written line in its body** — *"And the
whole room turns."* on the reveal — a mono chapter index in the margin beneath
the screen, and two lines in the outro.

Deliberately claim-free: nothing asserts a capability, a licence, a comparison or
a count. The outro foot just names what was on screen. The mark is the canonical
off-white `#F7F4EA` wire mark, never the green one, and the validator locates it
*geometrically* and then checks its colour — selecting warm pixels to prove the
mark is warm would prove nothing.

---

## 8. Known limitations

- **The status bar is not redacted.** The capture's footer carries
  `ARTS-MAC-MINI-4` and a working branch name (`dev codex/context-rail-content-aware
  @ 63ae8612`). These are the operator's own machine and repo, and they read as
  authentic local-first product chrome rather than as a leak — but they are real
  strings, and if the film is going anywhere public they are the one thing worth
  a second look. Removing them is a source-level redaction, not an edit change.
- **One aspect ratio.** 1920×1080 only. A vertical or square cut of a wide
  desktop settings page would have to crop away the very grid the film is about.
- **BEAT's loudness range is narrow** (LRA ≈ 1.1 LU measured on the master). That
  is the generation, not the mastering: its own source window measures 2.10 LU,
  and mastering runs two-pass `loudnorm` in **linear** mode specifically so a
  single static gain is applied rather than the level being ridden. Single-pass
  loudnorm flattened it further and was replaced for exactly this reason.

---

## 9. Commands

```bash
bun run scripts/generate-theme-range-scores.ts both     # MiniMax, both prompts
bun run scripts/analyze-theme-range-score.ts <mp3>      # tempo + RMS map
bun run scripts/master-theme-range-scores.ts            # downbeat snap, exact runtime
bun run scripts/render-openscout-theme-range.ts --stills
bun run scripts/render-openscout-theme-range.ts         # both finals
bun run scripts/validate-openscout-theme-range.ts
bun run scripts/register-openscout-theme-range.ts
```
