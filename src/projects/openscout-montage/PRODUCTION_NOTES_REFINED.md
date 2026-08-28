# OpenScout Reimagined — refined · production notes

**Film:** `Refined` · 55.000 s · 1650 frames @ 30 fps · three formats
**Edit module:** `src/projects/openscout-montage/edit-refined.ts`
**Composition:** `src/projects/openscout-montage/OpenScoutRefined.tsx`
**Brief:** `/Users/art/dev/openscout/docs/artifacts/ios-reimagined-capture-2026-08-13/PREFRAME_REFINEMENT_BRIEF.md`
**Date:** 2026-08-13

A refinement pass over the reimagined cut, not a new film. It takes the first
montage's sense of ceremony and presentation and applies it to the reimagined
era's footage, locked phone and improved assets.

The source map, the frame-accurate audit behind it, and the score provenance are
all unchanged and still documented in `PRODUCTION_NOTES_REIMAGINED.md`. This
document covers only what this pass changed, and why.

---

## 1. The score is unchanged — and it constrained everything else

**The latest reimagined score is retained exactly as it stands.** Same asset,
same gain, same length:

| | |
|---|---|
| Asset | `public/tracks/openscout/openscout-reimagined-score.wav` |
| In-composition gain | `0.92` |
| Length | 55.000000 s · 2 640 000 samples · 48 kHz stereo 24-bit PCM |

It was **not** re-cut, **not** re-mastered, **not** regenerated, and the film
does **not** revert to the first montage's cue. The operator's correction of
2026-08-13 is binding: the latest cue is the better one and stays as it is.

This is the fixed quantity the rest of the pass was built around, and it is the
reason the new opening looks the way it does. A 55.000 s cue cannot accommodate
a film that got longer, so **the opening was paid for out of picture rather than
added to runtime** — see §2.

Because the claim matters, `validate-openscout-refined.ts` checks it at source
level rather than asserting it: the refined edit must reference the same asset,
at the same gain, for the same total frame count, with every boundary still on a
50-frame downbeat. All four are compared directly against `EDIT_REIMAGINED`.

---

## 2. Structure — the revised grid

The bed is 144 BPM, so one bar is exactly 50 frames at 30 fps. The film is still
33 bars, and every boundary still lands on a downbeat.

| # | Verb | Title | Explanatory line | Frames | Bars |
|---|---|---|---|---|---|
| — | opening | *mark · OPENSCOUT · rule* | A local-first control plane for coding agents. | 0–100 | **2** |
| I | COMMAND | One surface for the agents already working. | A reply lands in the thread, with its receipt. | 100–200 | **2** |
| II | INDEX | Every conversation, one broker. | Names, last messages, and how long ago. | 200–350 | 3 |
| III | SEE | See what is working, right now. | Sessions running now, across hosts and agents. | 350–500 | 3 |
| IV | START | Start from a host and a project. | One machine, its projects, and the composer. | 500–650 | 3 |
| V | CHOOSE | Pick the agent, the model, the effort. | The agent, its model, and the effort it spends. | 650–850 | 4 |
| VI | OBSERVE | Watch the work as it happens. | Reasoning, tool calls, results — as they land. | 850–1000 | 3 |
| VII | BROWSE | Every project. Every workspace. | Each with its host, agent, and last activity. | 1000–1150 | 3 |
| VIII | PRESENT | Read it the way you read best. | Scout, Messages, WhatsApp, Original. | 1150–1350 | 4 |
| IX | RETURN | Then back to the work. | The thread, where it started. | 1350–1450 | **2** |
| — | ending | *the branded payoff* | — | 1450–1650 | 4 |

**Totals:** 2 opening + 27 content + 4 ending = 33 bars = 1650 frames = 55.000 s.

### 2.1 Where the two bars came from

The reimagined cut ran 29 bars of content with no opening. The two bars the
opening needs were taken from the two loosest passages, not spread thin across
the film:

- **Chapter I: 3 → 2 bars.** The preamble now does this chapter's arrival work,
  so the beat only has to be looked at. Its source window tightens from
  1.000→5.000 to 1.000→4.000, and its lens retimes from 30→140 to 22→92.
- **Chapter IX: 3 → 2 bars.** At three bars this lens-free bookend was the
  loosest stretch in the cut. Its window tightens from 96.350→101.350 to
  96.350→99.683.

**Every other chapter keeps its exact source window**, including the two beats
the source audit established as the film's centre of gravity: chapter V still
sits either side of the 22.498 selection change, and chapter VIII still plays
the full 75.450→81.150 Presentation cycle.

### 2.2 The opening

Two bars, and four elements revealed in order over a stage that is otherwise
empty: the off-white mark, `OPENSCOUT`, a hairline that draws out, and
*A local-first control plane for coding agents.* It then leaves as a group while
the phone fades up underneath, so the handover is a crossfade rather than a cut.

Nothing in it moves. No orbit, no logo draw-on, no scale, no travel — the
ceremony is in the pacing and the spacing. The positioning line appearing here
and again in the ending is deliberate: it is the film's spine, stated once on the
way in and once on the way out.

---

## 3. The layout is locked

This is the largest change, and it closes out a defect the previous cut's own
notes had flagged.

`OpenScoutMontage` drives layout by interpolating between a `base` state and a
`lensed` state. That is what made the reimagined cut's titles begin centred and
travel upward as a detail lens faded in — recorded in
`PRODUCTION_NOTES_REIMAGINED.md` §4.1 as a known characteristic, with the note
that fixing it would mean changing the shared composition for all three films.

That is exactly what this pass avoids doing. The refined film runs on **its own
component and its own format table**, so the two earlier films keep the
composition they shipped with and still render byte-for-byte as before.

`REFINED_FORMATS` has **one layout state per format**. There is no `base`/`lensed`
pair, and the type cannot express one. For every chapter, in every format:

- the **phone** sits in its fixed column — the reimagined cut's placement,
  carried over unchanged, because the operator's direction is that it is good;
- the **title and its explanatory line** sit in a fixed type column;
- the **detail lens** sits in a fixed, preallocated slot.

Elements fade in and out of that standing composition. There is no transform on
the type or the lens anywhere in the component — **opacity is the entire reveal
vocabulary**. Nothing recenters, slides between layout states, or negotiates for
position.

### 3.1 Top-anchored, not centred

Both the type column and the lens slot are anchored by their **top** edge.

This is what actually makes the composition hold still. Chapter rectangles have
very different aspect ratios — chapter VIII's is 1045×470, chapter II's is
1130×790 — so a vertically centred lens panel would arrive at a different height
in every chapter, which is the same "negotiating for position" in a slower
disguise. Anchored at the top, the panel's top edge and its caption are in
exactly the same place all film; only the panel's depth changes. The same
reasoning applies to the type column, where a two-line title would otherwise
shift a one-line one.

Chapter IX has no lens, and its slot is simply left empty rather than backfilled.

### 3.2 Per-format layout, and what was measured

| | Landscape 1920×1080 | Vertical 1080×1920 | Square 1080×1080 |
|---|---|---|---|
| Device (H, cx, cy) | 0.845, 0.300, 0.500 | 0.460, 0.500, 0.300 | 0.700, 0.265, 0.500 |
| Type column top | 0.175 | 0.555 | 0.155 |
| Type column x / width | 0.545 / 0.40 | 0.500 / 0.82 (centred) | 0.485 / 0.44 |
| Title scale | 1.00 | 0.86 | 0.72 |
| Lens top / width | 0.385 / 0.40 | 0.675 / 0.64 | 0.430 / 0.44 |

Device fields are the reimagined cut's, unchanged.

Three of these were corrected on rendered stills rather than trusted:

1. **Landscape lens slot 0.40 → 0.385.** At 0.40 the deepest rectangles bottomed
   out ~45 px above the footer while ~120 px of dead space sat between the type
   column and the lens caption.
2. **Vertical type column 0.525 → 0.555.** The device's real bottom edge is at
   1030 px, not the 1018 its screen height implies — `PhoneShell` adds a 12 px
   bezel on each side. At 0.525 the chapter index line printed across the phone's
   bottom bezel.
3. **Vertical lens width 0.74 → 0.64.** At the reimagined cut's width the tallest
   rectangle collided with the footer; at 0.64 it lands 49 px clear.

In landscape and square the type column and the lens share one editorial column —
identical left and right edges — so the chapter reads as a single block of
material rather than two floating panels.

---

## 4. Typography

The brief's direction was a quieter editorial voice: considered weight and
spacing, cleaner hierarchy, fewer loud all-caps gestures, small mono for useful
metadata only, and nothing generically product-marketing or tactical/HUD.

| | Reimagined cut | Refined |
|---|---|---|
| Chapter eyebrow | mono 13u, `0.26em`, numeral and rule in **mint**, verb in ink at 0.82 | mono 10.5u, `0.20em`, numeral and verb in **faint ink**; mint on the tick alone |
| Headline | sans 40u, `-0.012em` | sans 34u × per-format scale, `-0.020em`, leading 1.26 |
| Explanatory line | *(did not exist)* | sans 17u × per-format scale, leading 1.50, `inkSoft` |
| Lens caption | mono 12u, `0.22em` | mono 10.5u, `0.20em` |
| Header / footer | mono 13u / 11u | mono 12u / 10u, tighter tracking |
| Ending wordmark | mono 34u, `0.30em` | mono 26u, `0.28em` |

The chapter eyebrow was the loudest thing on screen that carried the least
information — mint, wide-tracked, all-caps, at headline scale. It is now a small
faint index line, which is what it always was. **Mint no longer appears on any
word in the film**: it is on rules, the chapter ticks and the lens caption dash
only.

The new explanatory line is the reason the headline could get quieter. Each
chapter now states its point and then names what is literally on screen, so the
title no longer has to do both jobs at once.

`titleScale` exists because the three formats have very different column widths.
The square's type column is only 475 px, and at full size a 43-character title
broke to four lines; the vertical's 1.34 type scale is sized for the mono
metadata and is too loud on a headline. Both are pulled back so the headline
reads at the same *weight* in all three formats rather than at the same *size*.

### 4.1 Copy

Every explanatory line names something the source audit already verified — the
broker index's names, last messages and ages; the picker's agent, model and
effort; the Tail's reasoning, tool calls and results; the four real Presentation
values. Nothing claims beyond coordination and reachability: no delivery
guarantees, no consensus, no cloud sync, no autonomy language.

Chapter IX's line — *The thread, where it started.* — is deliberately honest
about the bookend. The source audit established that the two conversation
passages are pixel-identical, so the film says it is the same thread rather than
implying a re-render.

---

## 5. The ending

The vague copy is gone. `A command surface for the agents already working.` and
the `YOUR AGENTS · YOUR PROJECTS · YOUR OWN MACS` foot are both replaced with the
first montage's hierarchy, in its order:

1. the canonical off-white `#F7F4EA` mark, and `OPENSCOUT`
2. **A local-first control plane for coding agents.**
3. `CLAUDE · CODEX · GROK · KIMI — ON YOUR OWN MACS`
4. `EARLY · LOCAL DEVELOPER PILOTS`

Checked against the first montage's own frame, supplied with the brief. The four
steps reveal in sequence by opacity; the only thing that moves in the whole
lockup is the hairline drawing out.

The mark is `PALETTE.mark` — `#F7F4EA`, the canonical `ScoutWireMark` colour —
drawn at full opacity so it renders exactly rather than as a dimmed
approximation. There is no green or mint mark anywhere in the film, verified on
decoded pixels (§7.1).

---

## 6. What was deliberately not touched

- **The score.** §1.
- **The footage and its source map.** Every frame still comes from
  `openscout-reimagined-dark-device-master-cfr30.mp4`, and every window is one
  the frame-accurate audit already verified.
- **The device framing.** Locked, and in the same place as the reimagined cut.
- **The detail-lens rectangles.** All eight are unchanged, including the two that
  were corrected during the previous pass (chapter I raised 48 px off the panel's
  bottom mask, chapter VIII widened to 1045 to clear the revert glyphs).
- **The two source findings.** There is no "Split" presentation in this build,
  and the two conversation passages are pixel-identical. Both still shape the
  edit.
- **The earlier films.** `edit-a.ts`, `edit-b.ts` and `edit-reimagined.ts` are
  untouched. `edit.ts` gained two optional fields (`Chapter.sub`,
  `MontageEdit.preamble`) which the earlier edits leave unset, so their placement
  is unchanged — asserted directly in validation. `OpenScoutMontage.tsx` changed
  only by exporting primitives the refined component reuses.

---

## 7. Checks

`bun run scripts/validate-openscout-refined.ts` — **all checks passed across all
three files.** Full output in `out/openscout-refined/VALIDATION.md`.

<!-- VALIDATION-SUMMARY -->

---

## 8. Deliverables

| Format | Path |
|---|---|
| 16:9 | `out/openscout-refined/openscout-refined-1920x1080.mp4` |
| 9:16 | `out/openscout-refined/openscout-refined-1080x1920.mp4` |
| 1:1 | `out/openscout-refined/openscout-refined-1080x1080.mp4` |

All three are the same 1650-frame cut recomposed, not cropped.

### 8.1 Pipeline

`bun run scripts/render-openscout-refined.ts`

1. `remotion render` → `out/openscout-refined/_raw/`, H.264, CRF 16 (16:9) /
   17 (1:1, 9:16), `--x264-preset=slow`, `yuv420p`, `--color-space=bt709`, AAC
   256 kb/s.
2. `ffmpeg -c copy` remux → completes BT.709 in both the SPS VUI and the
   container via `h264_metadata`, and moves `moov` before `mdat`.

The bundle uses a minimal hardlinked public dir (`.scratch/…`) holding only the
capture and the score. The project's real `public/` is ~400 MB and Remotion
copies all of it into every bundle, which is enough to exhaust the disk
mid-render.

---

## 9. Reproduce

```bash
bun run scripts/render-openscout-refined.ts --stills   # layout check, all formats
bun run scripts/render-openscout-refined.ts            # three MP4s
bun run scripts/validate-openscout-refined.ts          # streams, score check, stills
bun run scripts/register-openscout-refined.ts          # treatments + run
```

The score step from the reimagined pipeline is **not** repeated: the cue is
carried over as-is.
