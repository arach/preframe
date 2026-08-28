# OpenScout Reimagined — production notes

**Film:** `Reimagined` · 55.000 s · 1650 frames @ 30 fps · three formats
**Edit module:** `src/projects/openscout-montage/edit-reimagined.ts`
**Date:** 2026-08-13

A new flagship film for the redesigned OpenScout era. Not a teaser, not a style
insert, and not a patch on V3: a fresh source map, a fresh narrative, a fresh
grid, and a score mastered for this runtime.

---

## 1. Source

| | |
|---|---|
| Canonical master | `/Users/art/dev/openscout/docs/artifacts/ios-reimagined-capture-2026-08-13/openscout-reimagined-dark-device-master-cfr30.mp4` |
| Repo copy (the one the composition reads) | `public/demos/openscout/openscout-reimagined-dark-device-master-cfr30.mp4` |
| Capture notes | `…/ios-reimagined-capture-2026-08-13/CAPTURE_NOTES.md` |
| Container | H.264 High @ L5.0, `yuv420p`, BT.709 (primaries/transfer/matrix all signalled), TV range |
| Geometry | 1178 × 2556, progressive |
| Timing | 30/1 fps constant, 3286 frames, 109.533333 s |
| Audio | none |

**This is the only picture source in the film.** No V3 master, no legacy
2026-08-12 capture, no stock, no recreated UI. Every timecode below was mapped
on the CFR30 file, so `sourceStart` lands on the frame it names.

### 1.1 Method

1. 1 fps contact sheets with burnt-in timestamps across the whole take (110
   frames, five sheets) to establish the surface order.
2. 6 fps sweeps with burnt-in millisecond timestamps across every transition
   boundary, to find the first and last clean frame of each window.
3. Full-resolution gridded frames (100 px red / 500 px yellow) at each beat, to
   measure detail-lens rectangles in real source pixels rather than by eye.
4. A full-frame difference blend between the two conversation bookends, to test
   whether the thread is re-rendered later in the take.

The evidence is kept in `docs/openscout-reimagined/`:

| File | What it shows |
|---|---|
| `source-contact-sheet-01…05.jpg` | the whole take at 1 fps with burnt-in timestamps |
| `presentation-cycle-01.jpg`, `-02.jpg` | 73–81 s at 6 fps, cropped to the settings rows — the four Presentation values and the exact frame each changes on |
| `bookend-difference-blend.jpg` | t=5.000 s differenced against t=100.000 s: pure black |

### 1.2 Source map

| Source window (s) | Surface | Usable |
|---|---|---|
| 0.000 – 12.90 | Conversation `talkie-epicurus` — outgoing bubble with `Read more`, "Agent responded" receipt, agent reply card, composer | ✅ clean throughout |
| 12.97 – 13.44 | push transition to the broker | ✗ mid-animation |
| 13.45 – 14.30 | **Scout broker** conversation index — 11 rows, last-message previews, ages | ✅ only 0.85 s |
| 14.33 – 14.44 | cross-fade | ✗ |
| 14.45 – 16.55 | **For You** · `WORKING NOW` — running session card, `mahler`, `lavoisier`, `epicurus`, `System` | ✅ |
| 16.664 – 18.80 | **New session** — `HOST • Arachs Mac mini`, Action / Action Grok Docs / 2048ish, "All 68 projects · 5 worktrees · 3 scratch · 1 folder", composer chip `Opus 5 · MEDIUM` | ✅ |
| 18.83 – 19.29 | picker fades in | ✗ |
| 19.30 – 22.49 | **Agent/model picker** — Claude·Opus 5 (DEFAULT), Codex·Sonnet 4.6, Grok·Haiku 4.5, Kimi·Opus 4.8, Cursor·Opus 4.7, Pi·Sonnet 4.5; effort scale AUTO / LIGHT / **MEDIUM** / HIGH / EXTRA HIGH / MAX | ✅ |
| **22.498** | **selection moves to Codex · Sonnet 4.6 and the composer chip changes with it** | ✅ the money frame |
| 22.50 – 25.60 | picker holds on Sonnet 4.6 | ✅ |
| 25.70 – 26.30 | picker dismisses | ✗ |
| 26.30 – 40.00 | new session again, now chipped `Sonnet 4.6 · MEDIUM` | ✅ but static |
| 40.166 – 40.33 | cross-fade to Tail | ✗ |
| 40.33 – 45.35 | **Tail** — `updated 13:28 • Following`, 21 events; `agent_reasoning`, `tools.update_plan`, `AGENT REPLY`, `task complete`; scrolls to `wait 706` / `tools.exec_command` / `write_stdin` from ~41.9 | ✅ genuine live motion |
| 45.498 – 51.90 | **Projects · Workspaces** — 2048ish, Action, Arach, Arc, Atelier, Contextual, Dev, Devbar with host · agent · last-active chips | ✅ |
| 52.00 – 52.90 | Shell (empty) | ✗ nothing to show |
| 53.00 – 54.90 | Notifications ("No notifications yet") | ✗ empty state |
| 55.00 – 69.90 | For You again | ✅ but duplicate |
| 70.40 – 71.35 | **Settings** sheet rises · `INSPECTOR · HOME` (Style Fleet, Source Fleet snapshot, Connection LAN → Live, Context Active surface) | ✅ |
| 71.40 – 75.33 | `INSPECTOR · APPEARANCE` (Mode Dark, Tone Warm; Style Tabs → Crown at ~74.0, Fleet navigation On) | ✅ |
| **75.498 – 77.166** | `INSPECTOR · CHAT` · Presentation = **Scout** — "focused paper-and-ink" | ✅ |
| **77.332 – 78.664** | Presentation = **Messages** — "compact familiar…" | ✅ |
| **78.830 – 80.166** | Presentation = **WhatsApp** — "warm conversation…" | ✅ |
| **80.332 – 95.90** | Presentation = **Original** — "Scout's native con…" | ✅ |
| 96.00 – 96.15 | settings dismisses | ✗ |
| 96.166 – 109.53 | Conversation `talkie-epicurus` again | ✅ |

---

## 2. Two findings that changed the edit

### 2.1 There is no "Split" presentation in this build

The brief and `CAPTURE_NOTES.md` §9 both say the Presentation control cycles
*"Original, Split, Messages, and WhatsApp."* Read off the source at 6 fps, the
control actually cycles:

```
75.498 – 77.166   Scout      · focused paper-and-ink
77.332 – 78.664   Messages   · compact familiar…
78.830 – 80.166   WhatsApp   · warm conversation…
80.332 –          Original   · Scout's native con…
```

The fourth value is **Scout**, not Split, and no frame anywhere in the take shows
a Split value. Chapter VIII therefore plays the four values the product actually
offers, in the order it offers them. Inventing a Split row, or captioning the
beat as though one existed, would have put a false product claim on screen.

### 2.2 The thread is not re-rendered in different presentations

`CAPTURE_NOTES.md` §10 describes *"the same active conversation shown in Original
and Split presentations."* A full-frame difference blend of t=5.000 s against
t=100.000 s returns **pure black**: the two conversation passages are
pixel-identical, including scroll position and timestamps.

So the capture demonstrates the *selector* and its four values; it does not
demonstrate the thread re-rendering. The film shows exactly that much. Chapters
I and IX use the thread as the film's bookend — which is what the footage
supports — and chapter VIII carries the presentation story on the real control.

**If side-by-side presentation differences are wanted, that needs a new capture:**
set each value and record the same thread four times. That is a capture task, not
an edit task, and it is the single highest-value addition to this material.

---

## 3. Script / EDL

Nine chapters. Copy is nine lines, each under eight words, each describing what is
on screen at that moment. The bed is 144 BPM, so one bar is exactly 50 frames at
30 fps and every chapter is a whole number of bars.

| # | Verb | Line | Frames | Bars | Source cut |
|---|---|---|---|---|---|
| I | COMMAND | One surface for the agents already working. | 0–150 | 3 | play 1.000→5.000, hold 4.95 (30 f) |
| II | INDEX | Every conversation, one broker. | 150–300 | 3 | play 13.450→14.283, hold 14.25 (125 f) |
| III | SEE | See what is working, right now. | 300–450 | 3 | play 14.550→16.450, hold 16.40 (93 f) |
| IV | START | Start from a host and a project. | 450–600 | 3 | play 16.750→18.750, hold 18.70 (90 f) |
| V | CHOOSE | Pick the agent, the model, the effort. | 600–800 | 4 | play 20.900→24.500, hold 24.45 (92 f) |
| VI | OBSERVE | Watch the work as it happens. | 800–950 | 3 | play 40.350→45.350 (no hold) |
| VII | BROWSE | Every project. Every workspace. | 950–1100 | 3 | play 45.600→49.200, hold 49.15 (42 f) |
| VIII | PRESENT | Read it the way you read best. | 1100–1300 | 4 | play 75.450→81.150, hold 81.10 (29 f) |
| IX | RETURN | Then back to the work. | 1300–1450 | 3 | play 96.350→101.350 (no hold) |
| — | outro | A command surface for the agents already working. | 1450–1650 | 4 | — |

**Totals:** 29 bars content + 4 bars outro = 33 bars = 1650 frames = 55.000 s.

### 3.1 Why several beats play-then-hold

Four surfaces are on screen for well under their chapter length in the source —
the broker index is clean for only 0.85 s. Those beats play the real arrival at
1× and then hold the captured frame while the detail lens reads it. Nothing is
sped up, slowed down, or looped; the header reads `CAPTURE · REAL TIME`
throughout because every cut runs at rate 1.

### 3.2 Detail lens

Nine chapters, eight lenses. Chapter IX is deliberately lens-free so the film
settles on the whole surface before the mark. Every rectangle is in source pixels
and was measured on gridded full-resolution frames:

| Ch | Rect (x, y, w, h) | Caption |
|---|---|---|
| I | 180, 468, 980, 686 | AGENT · RESPONDED |
| II | 25, 360, 1130, 790 | SCOUT BROKER |
| III | 30, 490, 1120, 780 | WORKING NOW |
| IV | 30, 1310, 1120, 780 | HOST · PROJECT |
| V | 40, 1170, 1100, 770 | AGENT · MODEL · EFFORT |
| VI | 30, 620, 1120, 780 | LIVE TAIL |
| VII | 25, 490, 1130, 790 | PROJECTS · WORKSPACES |
| VIII | 100, 496, 1045, 470 | PRESENTATION |

Two were corrected after inspecting rendered stills rather than trusting the
measurements: chapter I's receipt line landed inside the panel's 5% bottom mask
and ghosted (rect raised 48 px), and chapter VIII sliced the per-row revert
glyphs at x≈1130 in half (rect widened to 1045).

---

## 4. Direction

- **The device never moves.** `FORMATS` holds the phone fields identical between
  `base` and `lensed` in all three aspect ratios. No orbit, no drift, no pulsing,
  no per-chapter pose, no scale ease on lens arrival. The specular sheen is fixed
  rather than travelling. Energy comes from cuts, from the UI acting on its own,
  from the score, and from the lens — the only thing on screen that moves.
- **12-frame dissolves**, between Edit A's 4-frame beat cuts and Edit B's
  24-frame ambient dissolves.
- **Claims stay inside coordination and reachability.** Nothing asserts delivery
  guarantees, consensus, cloud sync, or agent autonomy. Every noun on screen is
  the product's own: Scout broker, For You, Working now, Tail, Projects ·
  Workspaces, Presentation / Detail / Density, and the real agent, model and
  effort names.
- **The mark is off-white.** `PALETTE.mark` is `#F7F4EA`, the canonical
  `ScoutWireMark` colour, drawn at full opacity in both the header and the outro
  so it renders exactly rather than as a dimmed approximation. Mint (`#3FE0A0`)
  appears only on rules, numerals, chapter ticks and the lens caption dash. There
  is no green or mint mark anywhere in the film — verified on rendered pixels
  (§6.2).
- **Footer provenance** reads `iOS · ARACHS MAC MINI`, matching the host the
  capture names on screen. This is a new optional `hostLabel` on `MontageEdit`;
  Edits A and B keep their existing label unchanged.

### 4.1 One known characteristic, not a defect

The chapter line and the detail lens are driven by the same `lensAmount`
envelope, so for the ~16 frames the lens takes to arrive, the line is still
travelling from its centred position to its lensed one while the panel is
already fading up behind it. On a dense surface — chapter VI's Tail is the
clearest case, visible around frame 828 — that reads as a faint ghost behind the
headline for about half a second, at partial opacity on both elements.

This is inherent to the shared composition system and is equally present in the
two shipped V3 films; it is not something this edit introduced. Decoupling the
type's travel from the lens's opacity would mean changing `OpenScoutMontage.tsx`
for all three films, which is not a change worth making inside this delivery. Flagged
here so it is a known quantity rather than a surprise on review.

**Resolved in the refined cut (2026-08-13).** The operator subsequently called
this out directly, and it is fixed in `Refined` — see
`PRODUCTION_NOTES_REFINED.md` §3. The fix was made the way this section
anticipated it would have to be: not by changing `OpenScoutMontage.tsx`, but by
giving the refined film its own component and its own format table, in which
there is no `base`/`lensed` pair to travel between. **This film is unchanged**
and still renders exactly as described above; it is preserved for A/B comparison
against the refined cut.

---

## 5. Score

**Asset:** `public/tracks/openscout/openscout-reimagined-score.wav`
**Provenance:** `public/tracks/openscout/openscout-reimagined-score.provenance.json`
**Masterer:** `scripts/master-openscout-reimagined-score.ts`

55.000000 s · 2 640 000 samples · 48 kHz stereo 24-bit PCM · −18.0 LUFS ·
LRA 6.7 LU · true peak −1.5 dBFS. Exactly the length of picture, to the sample.

### 5.1 Fresh generation was not possible here — be aware of this

MiniMax Music resolves through `readMusicModelConfig()`, which needs either a
keyed `music` slot or `MINIMAX_API_KEY`. `.data/provider.json` carries empty
`apiKey` strings on both slots and the variable is unset, so
`scripts/generate-montage-score-v3-beat.ts` cannot run in this environment.

Rather than ship without a bed, this is a **new master of an existing raw
generation the operator already owns** —
`public/tracks/generated/openscout-v3-beat-msqxiv1l.mp3`, 133.886 s, `music-2.6`,
instrumental, generated on 2026-08-12 from a prompt asking for an eerie, spacious
electronic instrumental with a real but restrained pulse. That matches the brief's
requested character closely.

**Limitation, stated plainly:** the V3 Edit A master was cut from the same raw
file. This window opens 10.007 s earlier and runs 10.083 s longer, but roughly
82% of its material overlaps V3's. The two films therefore share a musical
identity. Setting `MINIMAX_API_KEY` and re-running the generator would fix this;
swapping the cue is a one-line change in `edit-reimagined.ts` plus a re-render,
with no impact on picture.

### 5.2 Window and tempo

The raw generation's first ~56 s is a 10-second phrase cycle that decays to near
silence between phrases (troughs of −42 to −52 dBFS at 6–8, 16–18, 26–28, 36–38
and 46–48 s) — under picture those read as dropouts. 56–108 s is the sustained,
locked section.

The window is **52.2491 → 107.2873 s**: six bars before the downbeat V3 was cut
from (in the delivered 143.9 BPM timebase), so it opens just inside the lift into
the locked section and still lands on a downbeat; it ends where the arrangement
thins naturally. A single continuous window — no splice, so the pulse stays
phase-continuous for the whole film.

MiniMax delivered 143.9 BPM against a requested 120. As with V3 the film is built
on the delivered tempo rather than fighting it: `atempo=1.0006949` nudges it to
exactly 144.000 BPM, where one bar is exactly 50 frames at 30 fps.

### 5.3 Chain

```
atempo=1.0006949
  → loudnorm(I=-18:TP=-1.5:LRA=9)
  → aresample=48000
  → afade in 0.35 s
  → afade out 3.0 s at 52.0 s
  → apad → atrim to exactly 2 640 000 samples
```

The pad-and-trim is deliberate: `loudnorm` runs at 192 kHz internally and the
resample back leaves the stream ~140 samples short of the arithmetic length. The
trimmed region is inside the finished fade-out, so nothing audible is added or
lost, and the bed is the same length as picture rather than 0.09 frames under it.

In-composition gain 0.92, with 8-frame in / 18-frame out safety ramps.

---

## 6. Deliverables

### 6.1 Files

| Format | Path |
|---|---|
| 16:9 | `out/openscout-reimagined/openscout-reimagined-1920x1080.mp4` |
| 9:16 | `out/openscout-reimagined/openscout-reimagined-1080x1920.mp4` |
| 1:1 | `out/openscout-reimagined/openscout-reimagined-1080x1080.mp4` |

All three are the same 1650-frame cut recomposed, not cropped: `FORMATS` drives
device size and position, lens size and position, and type placement per aspect
ratio in normalised stage units.

### 6.2 Pipeline

`bun run scripts/render-openscout-reimagined.ts`

1. `remotion render` → `out/openscout-reimagined/_raw/`, H.264, CRF 16 (16:9) /
   17 (1:1, 9:16), `--x264-preset=slow`, `yuv420p`, `--color-space=bt709`, AAC
   256 kb/s.
2. `ffmpeg -c copy` remux → completes BT.709 in both the SPS VUI and the
   container via `h264_metadata`, and moves `moov` before `mdat` so the files
   start playing before they finish downloading.

The bundle uses a minimal hardlinked public dir (`.scratch/…`) holding only the
capture and the score. The project's real `public/` is ~400 MB and Remotion copies
all of it into every bundle, which is enough to exhaust the disk mid-render.

Validation: `bun run scripts/validate-openscout-reimagined.ts` — see §7.

---

## 7. Checks

`bun run scripts/validate-openscout-reimagined.ts` — **all checks passed across
all three files.** Full output in `out/openscout-reimagined/VALIDATION.md`.

Identical on all three deliverables:

| Check | Result |
|---|---|
| Resolution | 1920×1080 / 1080×1920 / 1080×1080 as delivered |
| Codec | H.264 High, `yuv420p` |
| Frame rate | 30/1 |
| Frame count | **1650** (33 bars × 50) |
| Picture duration | **55.000000 s** (container 55.061 s incl. AAC padding) |
| Colour | BT.709 primaries + transfer + matrix, TV range |
| Audio | AAC 48 kHz stereo ≈253 kb/s, 55.061 s |
| Faststart | `moov` before `mdat` |
| Black frames | zero hits at `pix_th=0.05` over the full timeline |
| Darkest frame | mean luma 23.4–23.5 / 255 (true black ≈ 16) |
| Loudness | −18.7 LUFS, LRA 6.6 LU, true peak −2.1 dBFS |

### 7.1 Brand check

The wire mark is measured on decoded pixels, not asserted. `signalstats` works
in YUV and exposes no R/G/B keys, so the check crops the mark out of the outro
lockup — where it is the only bright object in frame — decodes to raw `rgb24`,
and averages every pixel whose darkest channel clears 180:

| File | Mark body | R−B |
|---|---|---|
| 1920×1080 | rgb(241.5, 239.7, 230.2) over 1351 px | 11.3 |
| 1080×1920 | rgb(243.6, 241.1, 231.5) over 1071 px | 12.1 |
| 1080×1080 | rgb(242.7, 240.1, 231.4) over 1394 px | 11.3 |

`#F7F4EA` is (247, 244, 234), R−B = 13. All three land warm off-white with
R > G > B after the H.264 and BT.709 round-trip. A mint mark would invert this
to G > R. **No green or mint mark appears anywhere in the film.**

### 7.2 Visual inspection

Beyond the automated checks, frames were inspected by eye at every stage:

- ten layout stills per format before committing to full renders, which is how
  the two lens-rectangle corrections in §3.2 were found;
- a 24-frame sweep across the whole landscape master;
- a 12-frame sweep across the vertical and the square;
- 14 validation stills per format, one inside every chapter plus the outro
  lockup, in `out/openscout-reimagined/validation-stills/`.

---

## 8. Reproduce

```bash
bun run scripts/master-openscout-reimagined-score.ts   # score → 55.000 s WAV
bun run scripts/render-openscout-reimagined.ts         # three MP4s
bun run scripts/validate-openscout-reimagined.ts       # streams + stills
bun run scripts/register-openscout-reimagined.ts       # treatments + run
```
