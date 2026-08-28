# OpenScout — daylight · production notes

**Film:** `Daylight` · 55.000 s · 1650 frames @ 30 fps · three formats
**Edit module:** `src/projects/openscout-montage/edit-daylight.ts`
**Composition:** `src/projects/openscout-montage/OpenScoutDaylight.tsx`
**Date:** 2026-08-13

A preserved iteration, not a patch. `edit-a.ts`, `edit-b.ts`, `edit-reimagined.ts`
and `edit-refined.ts` are all untouched and still render; the refined film in
particular is still registered and is the cut this one is reviewed against.

This document covers only what this pass changed. The dark capture's source map,
the frame-accurate audit behind it and the score provenance are unchanged and
still documented in `PRODUCTION_NOTES_REIMAGINED.md`.

---

## 1. The story — daylight first, dark on purpose

The refined cut opens cold: already inside the product, already dark, from its
first product frame. The direction for this pass is that the film should first
meet the product in daylight — the airy host/agent overview, then the settings
surface that says the app is yours to configure — and turn dark only afterwards,
as a deliberate transformation rather than as the default first impression.

So the film is now told in two halves with a hinge between them.

| # | Verb | Title | Explanatory line | Frames | Bars | Source |
|---|---|---|---|---|---|---|
| — | opening | *mark · OPENSCOUT · rule* | A local-first control plane for coding agents. | 0–100 | 2 | — |
| I | CONNECT | Your Macs, discovered and online. | Hosts, agents, and what is running now. | 100–250 | 3 | **light** |
| II | PERSONALIZE | Make it yours — light or dark. | Mode, tone and navigation, in Settings. | 250–400 | 3 | **light** |
| III | CONVERSE | An agent answers in the thread. | The question, the finding, and the root cause. | 400–550 | 3 | **light** |
| IV | DISPATCH | Start from a host and a project. | The host, its 68 projects, and the composer. | 550–700 | 3 | **light** |
| V | **TRANSFORM** | Then turn the whole surface dark. | The same panel, the same rows — one setting. | 700–850 | 3 | **light → dark** |
| VI | CHOOSE | Pick the agent, the model, the effort. | Claude, Codex, Grok, Kimi — and how hard they think. | 850–1000 | 3 | dark |
| VII | OBSERVE | Watch the work as it happens. | Reasoning, tool calls, results — as they land. | 1000–1150 | 3 | dark |
| VIII | PRESENT | Read it the way you read best. | Scout, Messages, WhatsApp, Original. | 1150–1350 | 4 | dark |
| IX | RETURN | Then back to the work. | The thread, where it started. | 1350–1450 | 2 | dark |
| — | ending | *the branded payoff* | — | 1450–1650 | 4 | — |

**Totals:** 2 opening + 27 content + 4 ending = 33 bars = 1650 frames = 55.000 s.

### 1.2 One bar moved, after the first build

DISPATCH ran at 2 bars and CHOOSE at 4 in the first build. Both were wrong, and
it showed on rendered stills: at 2 bars, DISPATCH's explanatory line reached full
opacity roughly one frame before the chapter began taking it away again, so it
read as a flicker rather than as a line; and CHOOSE's fourth bar was a pure hold
on a picker that had already finished moving. The bar was moved from the one to
the other. CHOOSE still plays its whole interaction — the selection change at
22.498 s is inside the play window, not the hold — so nothing was lost to pay
for it.

The two chapters the operator named are the two the film opens with, in that
order, on the exact footage the supplied reference frames were rendered from.

### 1.1 The film keeps its own promise

Chapter II states *"Make it yours — light or dark."* over the product's real Mode
row, showing `Light`, and does **not** cash it. Chapter V returns to that exact
row and does. That is why the turn is a chapter of its own rather than a
dissolve tucked inside another beat: the promise and the payoff are the two ends
of the same gesture, and putting them in one beat would have spent both at once.

---

## 2. Sources — two captures, and why that is honest

| Half | Master | Geometry |
|---|---|---|
| Light (I–V) | `public/demos/openscout/openscout-nav-light-v3-cfr30.mp4` | 1178×2556, 105.967 s, CFR 30, BT.709 |
| Dark (V–IX) | `public/demos/openscout/openscout-reimagined-dark-device-master-cfr30.mp4` | 1178×2556, 109.533 s, CFR 30, BT.709 |

These are captures **a day apart of the same architecture**, not two product
eras. Established on contact sheets before a line of the edit was written: both
carry the same `All hosts` header, the same `For you` · `WORKING NOW` feed, the
same `SCOUT · SETTINGS` inspector with its lettered rail, the same
`HOST · Arachs Mac mini` composer with `All 68 projects · 5 worktrees · 3 scratch
· 1 folder`, and the same tab bar. Both name the same host on screen, which is
why one `hostLabel` serves the whole film.

**No footage was recorded or recreated for this pass, and no UI was fabricated.**
Every light window below is one that already existed in the capture the earlier
explainer treatment drew on; every dark window is one the reimagined source audit
had already verified.

### 2.1 The light source map

Audited at 2 fps across the whole take, then at 2–3 fps across every transition
boundary, to find the first and last clean frame of each window.

| Source window (s) | Surface | Used |
|---|---|---|
| 0.000 – 13.50 | **For You** · `WORKING NOW` — running session card, `lavoisier`, `epicurus`, `System`, `mendel`, `wittgenstein` | ✅ ch. I (3.000–8.000) |
| 14.0 – 21.0 | Chats list | — |
| 21.0 – 23.50 | transition (white) | ✗ |
| 23.60 – 30.70 | **Thread** — `Openscout Agent`, the request quoted, the diagnosis, ROOT CAUSE, `Read more` | ✅ ch. III (24.200–29.200) |
| 30.90 – 41.0 | contact sheet rises · agent info | ✗ redundant |
| 42.0 – 45.0 | "Loading recent activity" | ✗ loading state |
| 46.0 – 54.0 | Logs · TAIL | — dark capture's Tail is better |
| 55.0 – 71.0 | Alerts — "No notifications yet" | ✗ empty state |
| 72.60 – 74.70 | Settings sheet rises · `INSPECTOR · HOME` | ✗ mid-arrival |
| 74.70 – 75.10 | cross-fade `HOME` → `APPEARANCE` | ✗ |
| **75.10 – 82.80** | **`INSPECTOR · APPEARANCE`** — `Mode Light`, `Tone Warm`, `Style Tabs`, `v3 navigation On` | ✅ ch. II (76.000–81.000) and ch. V (77.000–79.000) |
| 83.00 – 84.00 | settings dismisses | ✗ |
| 85.0 – 95.0 | For You again | ✅ but duplicate |
| 95.0 – 100.70 | Shell | — |
| **101.00 – 105.20** | **New session** — `HOST • Arachs Mac mini`, Action Grok Docs / 2048ish / Action, the composer, `Opus 5 · AUTO` | ✅ ch. IV (101.400–104.733, hold 104.700) |

The For You feed is **pixel-static** across both of its passes — verified at
0.5 s granularity over 0–13.5 and 85–95. That matters twice: chapter I is played
straight at 1× rather than held, because there is nothing to hold away from; and
it is why §5's redaction could not be solved by choosing a different window.

### 2.2 The dark source map

Unchanged, and documented in full in `PRODUCTION_NOTES_REIMAGINED.md` §1.2. Four
windows are used, and chapters VI–IX carry **the refined cut's exact source
windows and lens rectangles** — they were already audited, already measured on
gridded frames, and already signed off.

| Source window (s) | Surface | Used |
|---|---|---|
| **72.30 – 73.50** | `INSPECTOR · APPEARANCE` — `Mode Dark`, `Tone Warm`, `Style Tabs` | ✅ ch. V (72.400–73.400, hold 73.350) |
| 19.30 – 25.60 | Agent/model picker; **22.498** is the selection change | ✅ ch. VI |
| 40.33 – 45.35 | Tail — genuine live motion from ~41.9 | ✅ ch. VII |
| 75.45 – 81.15 | Presentation cycles Scout → Messages → WhatsApp → Original | ✅ ch. VIII |
| 96.17 – 109.53 | Conversation `talkie-epicurus` | ✅ ch. IX |

---

## 3. The hinge

This is the film's centrepiece and the thing the pass exists for.

### 3.1 The two panels register to the pixel

Measured on gridded full-resolution frames of both masters. The light
`INSPECTOR · APPEARANCE` panel and the dark one put every row on the same source
row:

| Row | Source y | Light | Dark |
|---|---|---|---|
| `INSPECTOR · APPEARANCE` | 388 | — | — |
| `CANVAS` | 527 | — | — |
| **`Mode`** | **641** | **`Light`** | **`Dark`** |
| `Tone` | 773 | `Warm` | `Warm` |
| `NAVIGATION` | 912 | — | — |
| `Style` | 1025 | `Tabs` | `Tabs` |
| last row | 1157 | `v3 navigation … On` | `Fleet navigation … On` |

So `Mode` is the only *value* that changes. `Tone · Warm` and `Style · Tabs`
staying put either side of the turn is the control that makes the change legible
as one setting rather than as a different screen.

The dark panel is clean with `Style · Tabs` **only** from 72.30 to 73.50 — the
capture flips Style to `Crown` at 73.67. The hold therefore sits at 73.350,
before that change, so the beat never appears to alter two settings at once.

### 3.2 A cross-dissolve was tried and rejected

The first build cross-dissolved the two panels over 30 frames. On the rendered
still at the dissolve's midpoint, the phone is a flat grey slab with both sets of
rows ghosted through each other and both rail orderings overlapping — it reads as
a broken frame, not as a transformation. A white surface cross-fading to a black
one always spends its middle in mud. (That still was taken at frame 725, on the
grid the first build used; the hinge has since moved to 760–790 — see §1.2.)

### 3.3 What it does instead

The dark panel is **revealed**, not dissolved: a soft-edged circle grows from the
`Mode` row's own value chip — measured at **(1005, 641)** in source pixels — until
it has cleared the frame. At every moment of the turn both sides of the edge are
a real, finished surface. Originating it at the control that changed makes the
change read as cause and effect.

Three things travel on exactly the same 30 frames (**760–790**), which is what
makes it a whole-frame event rather than a screen-only one:

1. the phone's surface, on the growing circle;
2. the detail lens, on the *same* circle — it sits over the reveal's origin, so
   the magnified `Mode` row turns first and the change visibly spreads outward
   from it;
3. the stage tone, from `PALETTE.stageLift` (#1E232B, the graphite the earlier
   light treatment used and the reference frames were rendered on) to
   `PALETTE.stage` (#06070A, the near-black the dark films use).

The feather is 4.5% of the final radius, held roughly constant in width as the
circle grows. At the 8% it started on, the arc read as fog and the rail's two
orderings ghosted through each other inside it — caught on a still a third of the
way into the reveal.

`DAYLIGHT_TURN` in `edit-daylight.ts` is the single declaration of those frames,
and the validation script measures the rendered luma to confirm the turn actually
lands inside them.

---

## 4. The transition framework

The refined cut had exactly one verb — opacity — applied uniformly to every
element at every boundary. That is what this pass replaces. Motion is now
authored and scheduled, and it still comes only from opacity, timing, masks, the
type reveal and the lens. **There is no phone motion, no title travel, no
recentering, no camera and no drift anywhere in the film.**

### 4.1 Titles are typed

Chapter titles reveal character by character on a 0.72-frame stagger, each glyph
arriving over 5 frames. A 33-character title takes ~28 frames — just under a
second.

Every glyph is rendered from frame zero **at its final position**; only its
opacity changes. Nothing reflows and no glyph ever moves, which is what keeps
this on the right side of the direction against title travel. Words are
`inline-block` so the line still wraps; the spaces between them are ordinary
breakable text nodes outside those boxes. Character indices are assigned once,
ahead of render, rather than by mutating a counter inside `map`, so the same text
always produces the same schedule.

The same reveal carries the positioning line in the opening and again in the
ending — it is the film's spine, stated once on the way in and once on the way
out, and the shared reveal is what makes the rhyme audible.

### 4.2 The lens arrives and leaves on an ease

| | Arrival | Departure |
|---|---|---|
| Frames | 20 | 15 |
| Curve | `cubic-bezier(0.16, 0.72, 0.22, 1)` | `cubic-bezier(0.5, 0.02, 0.62, 0.38)` |
| Opacity | 0 → 1 | 1 → 0 |
| Scale | 0.986 → 1.000 | 1.000 → 0.994 |
| Wipe | soft top-down, 6% leading edge | — |

The scale is deliberately tiny and is applied about the slot's **top centre**, so
a settling panel grows downward out of its own top edge and the caption above it
never moves. This is a lens settling into a slot it already owns, not a zoom.

The wipe opens the panel on arrival only. A closing wipe was considered and left
out: it read as the panel being deleted rather than withdrawn. Things arrive with
more ceremony than they leave.

The caption waits for the panel — it fades in from 10 frames after the lens
starts, over 16.

### 4.3 Chapters hand over rather than cross-fade

A boundary is a phrase — *out, change, in* — instead of three things happening at
once:

| Event | When |
|---|---|
| type block starts leaving | 22 frames before the chapter ends, over 12 |
| lens departs | its own `to`, set ≥20 frames before the chapter ends in every chapter |
| picture dissolves | at the boundary, 16 frames |
| new chapter's index line | +18, over 12 |
| new chapter's title starts typing | +24, at 0.64 frames per character |
| new chapter's explanatory line | after the title finishes typing, +3, over 13 |

`TYPE_OUT_LEAD` (22) is larger than the picture dissolve (16), so the type is
already gone by the time the next chapter's footage begins to appear.
`EYEBROW_IN` (18) is larger still on the way back in, so the new title lands on a
picture that has settled. Every lens `to` was pulled back to at least 20 frames
before its chapter's end, so a magnified detail is never on screen over the wrong
surface.

The whole schedule has to fit inside the **shortest** chapter — the two-bar
bookend, at 100 frames. Budgeted against it: the eyebrow is up by 30, a
22-character title has typed itself by 42, the explanatory line is at full
opacity from 58, and nothing begins to leave until 78. Even the shortest chapter
therefore holds its complete type for two thirds of a second. See §1.2 for the
build where that budget was not met.

**Measured on the delivered landscape master:** at the I → II boundary the type
column is empty from frame 240 to frame 268 — **28 frames, 0.93 s**. That gap is
the hand-over, and it is deliberate; the phone is playing continuously through
it, so the frame is never dead. It is called out here because it is a taste
question rather than a defect: if it reads as too much air, `EYEBROW_IN` and
`TYPE_OUT_LEAD` are the two constants that close it, and roughly 0.75 s is
available without breaking the shortest chapter's budget above.

The house dissolve went from 12 to 16 frames for the same reason: with the type
and the lens now clearing out first, a shorter picture dissolve arrived early
against them.

### 4.4 Gentle screen-change continuity

Applied where the source has a real interaction and nowhere else. In practice
that is one place — the hinge (§3) — because it is the only chapter in the film
whose beat *is* a screen change. Every other chapter plays one continuous
passage of its surface, and adding a device to it would have been decoration.

---

## 5. The redaction

The light For You capture carries a `System` row reading:

> **System** talkie · 6h
> Talkie failed to respond. Codex app-server cwd does not exist for
> talkie-isolated-f-6ky5hv: /Users/arach/.codex/worktrees/fcaf/talkie

Operator direction of 2026-08-13: *"Active writer should be a routing condition,
not a user-facing failure … remove, replace, crop, or choose a clean source. It
is internal routing behavior, not product narrative."* This row is that class of
thing — a routing/infrastructure condition surfaced as a user-facing failure —
and it sits second-from-top in the film's first product beat.

**Choosing a clean source was not available.** The feed is pixel-static across
both of its passes in the capture (0–13.5 and 85–95), verified at 0.5 s
granularity; there is no frame anywhere in the light master where that row is not
present. Cropping was not available either — the phone is shown whole, which is
the point of the composition.

So the row is removed. `Redaction` in `edit.ts` describes it in source pixels and
`RedactedVideo` in the composition applies it as three clipped views of the same
frame:

| | Destination rows | Source rows | Shift |
|---|---|---|---|
| A | 0 – 1244 | 0 – 1244 | none |
| B | 1244 – 2016 | 1519 – 2291 | up 275 |
| C | 2016 – 2556 | 2016 – 2556 | none |

`1244` and `1519` are the hairlines above and below the row; `2291` is the top of
the tab bar, i.e. the bottom of the scrolling region. B closes the 275 px gap so
the feed reads as one that never contained the row rather than as one with a hole
punched in it. C leaves the tab bar and the status footer exactly where the
capture put them. The 275 px this frees at the bottom of the scroll region was
**already empty surface** in the capture — nothing is invented to fill it, and
the join is invisible.

Confirmed on the rendered frame at 200: the feed runs `lavoisier` → `epicurus` →
`mendel` → `wittgenstein` with no seam and no gap. Chapter I's lens rectangle
sits entirely above the redacted block, so the magnified panel never went near
it; the redaction is applied in the lens path as well, so the two cannot drift.

`validate-openscout-daylight.ts` guards this at source level: every cut landing
in either For You window must carry the redaction, and no other cut may carry
one. That is the kind of thing that quietly regresses when a window is retimed.

**On "active writer" specifically:** no literal active-writer contention or error
text appears anywhere in either capture, in any chapter of this film, or in any
copy it puts on screen. Checked against the OpenScout source tree
(`/Users/art/dev/openscout`, no matches for `active writer` / `activeWriter` /
`active_writer`) and against both masters' surfaces on contact sheets.

---

## 6. Copy

Every explanatory line names something on screen at that moment: the feed's
hosts and running sessions; the Appearance panel's Mode, Tone and Style rows; the
thread's question, finding and root cause; the composer's host, projects and
model chip; the picker's six agents and its effort scale; the Tail's reasoning,
tool calls and results; the four real Presentation values.

Claims stay inside coordination and reachability. Nothing asserts delivery
guarantees, consensus, cloud sync or autonomy. Chapter IX's line — *The thread,
where it started.* — is deliberately honest about the bookend: the source audit
established that the two conversation passages are pixel-identical, so the film
says it is the same thread rather than implying a re-render.

The two chapter titles the operator specified are used verbatim.

One line was rewritten during the pass for exactly this reason. Chapter IV read
*"Start work on any of your Macs."*, and its own frame shows one host and
`1 active · 1/1 online`. The fleet is already established by chapter I and by the
`All hosts` header, so the beat did not need to re-assert it; it now reads
*"Start from a host and a project."*, which is what is on screen.

---

## 7. What was deliberately not touched

- **The score.** Same asset, same 0.92 gain, same 55.000 s. Not re-cut, not
  re-mastered, not regenerated. Checked field by field against `EDIT_REFINED`,
  and the asset itself is byte-identical to the copy the refined film rendered
  from — `md5 80384e435c6fc2090c9b224114fbaa00`, 55.000000 s, 48 kHz stereo
  24-bit PCM.
- **The spatial composition.** One locked layout per format, carried over from
  `REFINED_FORMATS` value for value: the same device height and placement, the
  same type column, the same lens slot, all top-anchored. `DAYLIGHT_FORMATS` is
  redeclared rather than imported so a future change here cannot silently move
  the refined film.
- **The brand.** `PALETTE.mark` = `#F7F4EA` in the header, the opening and the
  ending, at full opacity. Verified on decoded pixels (§8). No green or mint mark
  anywhere; mint carries rules, chapter ticks and the lens caption dash only.
- **The dark chapters.** VI–IX use the refined cut's exact source windows and
  lens rectangles.
- **The earlier films.** `edit-a.ts`, `edit-b.ts`, `edit-reimagined.ts`,
  `edit-refined.ts`, `OpenScoutMontage.tsx` and `OpenScoutRefined.tsx` are all
  unchanged. `edit.ts` gained two optional fields (`Cut.redact`, `Cut.enter`)
  which every earlier edit leaves unset, so their placement and pixels are
  byte-for-byte what they were.

### 7.1 Two honest continuity notes

Both are across the hinge, and both sit **outside** chapter V's lens rectangle,
so neither is ever magnified:

1. **The inspector rail is ordered differently between the captures.** Light runs
   `HOME / CONNECTION / ROUTES / IDENTITY / CHAT / ATTENTION / APPEARANCE /
   ADVANCED`; dark runs `HOME / APPEARANCE / CHAT / ATTENTION / CONNECTION /
   ROUTES / ADVANCED`. The `APPEARANCE` highlight therefore sits at a different
   height either side of the turn. It is a 128 px strip at the left edge of the
   phone, and the reveal crosses it in about a third of a second.
2. **The last row's label differs** — `v3 navigation (experimen…` in light
   against `Fleet navigation · home · ch…` in dark. The toggle reads `On` in
   both.

---

## 8. Checks

`bun run scripts/validate-openscout-daylight.ts` — **all checks passed across all
three files.** Full output in `out/openscout-daylight/VALIDATION.md`.

Beyond the standard media checks (resolution, frame count, duration, H.264
yuv420p, BT.709 on all three signalling fields, faststart, AAC, blackdetect,
loudness, canonical mark colour on decoded pixels), three checks test claims this
pass made:

- **the score is unchanged** — asset, gain, runtime and the 50-frame downbeat
  grid, all compared directly against `EDIT_REFINED`;
- **the redaction holds** — every light For You cut carries it, and no other cut
  does;
- **the film actually turns** — mean luma is measured per frame across the whole
  timeline; the light half must be decisively brighter than the dark half, and
  the crossing between the two levels must land inside the dissolve
  `DAYLIGHT_TURN` declares.

Headline results, identical in kind across all three formats:

| Check | 1920×1080 | 1080×1920 | 1080×1080 |
|---|---|---|---|
| Frames / duration | 1650 · 55.000000 s | 1650 · 55.000000 s | 1650 · 55.000000 s |
| Codec | H.264 High · yuv420p · 30 fps | ← | ← |
| BT.709 (primaries/transfer/matrix) | all three, tv range | ← | ← |
| faststart | moov before mdat | ← | ← |
| Audio | AAC 48 kHz 2ch ~253 kb/s | ← | ← |
| Loudness | −18.7 LUFS · LRA 6.6 LU · peak −2.1 dBFS | ← | ← |
| blackdetect | 0 hits | 0 hits | 0 hits |
| Darkest frame | 23.3 @ f1472 | 23.4 @ f1472 | 23.5 @ f1472 |
| **Light vs dark half** | **93.26 vs 28.27 (Δ 64.99)** | **88.63 vs 28.47 (Δ 60.16)** | **94.81 vs 28.49 (Δ 66.32)** |
| **Turn crosses** | **f768** | **f768** | **f769** |
| Wire mark | rgb(239.7, 237.9, 229.2) | rgb(242.5, 240.6, 231.1) | rgb(242.3, 240.9, 231.6) |

The turn is the one worth reading twice. It is not asserted anywhere — the mean
luma of every frame is measured, the two halves are compared, and the crossing
between them is located. It lands at frame 768–769 in all three formats, inside
the 760–790 dissolve `DAYLIGHT_TURN` declares, and the halves are separated by
60–66 levels out of 255. The film demonstrably turns, and it turns where it says
it does.

The darkest frame in every format is 23.3–23.5 against a true-black floor of 16,
and it falls at frame 1472 — the handover from the last chapter into the outro,
which is the darkest passage by design.

---

## 9. Deliverables

| Format | Path |
|---|---|
| 16:9 | `out/openscout-daylight/openscout-daylight-1920x1080.mp4` |
| 9:16 | `out/openscout-daylight/openscout-daylight-1080x1920.mp4` |
| 1:1 | `out/openscout-daylight/openscout-daylight-1080x1080.mp4` |

All three are the same 1650-frame cut recomposed, not cropped.

### 9.1 Pipeline

`bun run scripts/render-openscout-daylight.ts`

1. `remotion render` → `out/openscout-daylight/_raw/`, H.264, CRF 16 (16:9) /
   17 (1:1, 9:16), `--x264-preset=slow`, `yuv420p`, `--color-space=bt709`, AAC
   256 kb/s.
2. `ffmpeg -c copy` remux → completes BT.709 in both the SPS VUI and the
   container via `h264_metadata`, and moves `moov` before `mdat`.

The bundle uses a minimal hardlinked public dir (`.scratch/openscout-daylight-public`)
holding only the two captures and the score. The project's real `public/` is
~400 MB and Remotion copies all of it into every bundle, which is enough to
exhaust the disk mid-render.

---

## 10. Reproduce

```bash
bun run scripts/render-openscout-daylight.ts --stills   # layout check, all formats
bun run scripts/render-openscout-daylight.ts            # three MP4s
bun run scripts/validate-openscout-daylight.ts          # streams, score, turn, redaction, stills
bun run scripts/register-openscout-daylight.ts          # treatments + run
```

No score step: the cue is carried over as-is.
