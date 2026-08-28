# OpenScout montage — production note

A ~45-second product montage cut from a single silent iOS screen recording of
OpenScout, staged inside a modular device/frame system that recomposes across
16:9, 9:16 and 1:1.

## Source record

- Original: `/Users/art/Desktop/Simulator Screen Recording - iPhone 16 - 2026-08-12 at 12.12.54.mov` (preserved, never edited)
- Staged copy: `public/demos/openscout/openscout-ios-2026-08-12.mov`
- SHA-256 (both): `949600862341f65de3ebe1f7eb4af76c8a89b6e26e89875ecd84ab732380bcdb`
- Probe: H.264 High, 1178×2556 portrait, 126.873333 s, **silent**, variable frame
  rate (avg 26.847 fps), 9.46 Mb/s
- Render-time dependency: `public/demos/openscout/openscout-ios-2026-08-12-cfr30.mp4`

The capture is VFR, which makes frame-accurate seeking unreliable. It was
normalised once to constant 30 fps and used as the edit master so every
`startFrom` in the EDL lands on the frame it names:

```sh
ffmpeg -i openscout-ios-2026-08-12.mov -vf fps=30 \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -movflags +faststart -an openscout-ios-2026-08-12-cfr30.mp4
```

Both files live under `public/demos/`, which is gitignored — the same convention
the Blink demo uses. Source timecodes below refer to the CFR master, which shares
the original's timebase.

## Editorial thesis

The recording is a 127-second wander through the whole app. The montage does not
speed-ramp it; it selects eleven cuts across five chapters where something true
about the product is legible on screen, and lets each one play at real time
wherever the payoff is — only three cuts run faster, none above 1.6×.
The arc is **see → dispatch → converse → observe → route**: the feed shows what
every agent is doing, the composer shows you choosing one, the thread shows you
talking to it, the tail shows the work, and Settings → Routes shows that all of
it prefers your LAN before anything leaves the house.

Nothing is simulated. No UI was redrawn, no state was fabricated, no claim is
made that the capture does not show. Playback rates above 1× are disclosed in the
header while they are on screen.

Total: **1350 frames / 45.000 s at 30 fps**.

## Timecoded edit decision list

| # | Comp | Source | Rate | Purpose |
|---|---|---:|---:|---|
| I | 00:00.00–00:06.20 | 00:00.20–00:06.40 | 1.0× | Host feed: WORKING NOW, then agent updates from six sessions |
| II | 00:06.20–00:07.40 | 01:36.90–01:38.80 | 1.6× | New session composer on Arts Mac mini |
| II | 00:07.40–00:09.90 | 01:38.80–01:41.30 | 1.0× | Agent + model picker open — the chapter's payoff |
| II | 00:09.90–00:12.30 | 01:41.30–01:44.40 | 1.3× | Picker dismisses, project list appears |
| III | 00:12.30–00:18.00 | 00:36.80–00:42.50 | 1.0× | A real brief sent to an agent; "Agent responded ✓"; structured reply |
| III | 00:18.00–00:20.70 | 00:47.50–00:50.20 | 1.0× | Hold a message — reply, pin on this phone, forward |
| III | 00:20.70–00:24.90 | 01:10.30–01:14.50 | 1.0× | Direct message thread with `feynman-2` |
| IV | 00:24.90–00:33.60 | 01:25.50–01:34.20 | 1.0× | Cross-agent live tail: agent replies, tool calls, plan updates |
| IV | 00:33.60–00:35.30 | 01:51.90–01:53.60 | 1.0× | Shell on the paired Mac, with the quick-keys accessory row |
| V | 00:35.30–00:36.43 | 01:04.35–01:05.48 | 1.0× | Settings inspector opens Routes |
| V | 00:36.43–00:40.00 | hold @ 01:05.42 | — | Held frame on the transport stack |
| — | 00:40.00–00:45.00 | — | — | Signature outro |

**Why the hold.** The Routes panel is only fully on screen for about 0.6 s — the
capture taps through the inspector's rail quickly. Rather than slow-motion a UI
scroll into judder, the cut plays the transition at 1× and then holds the real
frame while the camera pushes in. It is the captured pixel, not a recreation.

**Why the shell cut ends at 01:53.60.** The capture's quick-keys accessory row
(esc, tab, mic, ^C, return) is up from 01:51.5 to 01:53.9; at 01:54.0 it swaps to
the full keyboard and at 01:54.2 to an emoji row, neither of which says anything
about the product. Two passes were needed. The first ran to 01:54.20 and put emoji
straight into the chapter's last dissolve. The second stopped at 01:53.90 — but a
cut keeps playing for nine frames underneath whatever dissolves in on top of it,
so the tail still reached 01:54.20 and the emoji row was legible at roughly 70 %
opacity at 00:35.80. The cut now ends at 01:53.60 so the *tail* lands on 01:53.90,
still on quick keys. The frames it gave up went to the Routes hold, keeping the
runtime at exactly 45.000 s.

**What was left out.** Roughly 80 seconds: repeated passes over the same feed,
the reactions sheet a second and third time, the Alerts tab (empty), a long
static settings scroll, and the keyboard-open shell states. Nothing omitted
reorders an action or invents continuity — each selected passage plays forward
from its own start.

## Design system

**Stage.** A near-black environment (`#06070A`) with a cool key pool behind the
device, a warm off-axis counter-light low in the frame, a drifting hairline
lattice masked to the centre, and four almost-subliminal signal lines carrying
slow mint dashes — a routing motif, not a decoration. A floor pool grounds the
device. One vignette closes the frame.

**Device.** A purpose-built iPhone shell: titanium-gradient chassis, 1.38 %
bezel, 5.85 % screen radius, deep contact shadow, a slow specular pass across the
glass and a hairline contact ring. It deliberately draws **no** status bar and
**no** Dynamic Island — the capture already contains the real ones, so adding
them would double the chrome.

**Camera.** Each chapter owns a pose pair (`rotateY`, `rotateX`, scale, drift)
interpolated across its own length with a long settle curve, inside a real CSS
perspective. Chapters alternate the sign of `rotateY` so every cut lands on a new
angle; that plus a 9-frame A/B dissolve is what makes the cuts read as designed
rather than accidental.

**Detail lens.** The one genuinely elaborate element. Three chapters magnify a
rectangle of the *live* capture into a glass panel beside the device, so the
content stays legible at 1080p without blowing the phone up to fill the frame:

| Chapter | Source rect (px) | Shows |
|---|---|---|
| II DISPATCH | 24, 610 → 1130 × 680 | Claude · Opus 5 (default), Codex · Sonnet 4.6, Grok, Kimi |
| IV OBSERVE | 20, 760 → 1140 × 700 | The live tail band — tool calls and agent replies |
| V ROUTE | 152, 484 → 1012 × 700 | Order · first reachable wins → LAN → TSN → OSN |

The panel plays the same cut stack as the device, so it is always the current
frame, never a still. Its top and bottom edges are masked so lines clipped by the
crop soften instead of being sliced.

**Typography.** Two families only: the system grotesque for the one line per
chapter, mono for every technical mark (numeral, verb, header, footer, lens
caption, outro lockup). Five chapter cards in 45 seconds, one line each. The
header carries the wordmark and the rate disclosure; the footer carries the host
and five progress ticks.

**Copy.** Every line is defensible from the capture:
I *Every agent on your Macs, in one feed.* · II *Open a session. Choose the
agent.* · III *Message an agent. Read the reply in the thread.* · IV *Watch the
run. Drop into a shell on the host.* · V *First reachable wins — LAN, then
tailnet, then relay.* Outro: *A local-first control plane for coding agents.*
with `EARLY · LOCAL DEVELOPER PILOTS` — no enterprise or compliance language, no
capability the recording does not show.

## Parametric layout

`edit.ts` holds every format as two normalised layout states — `base` (no lens on
screen) and `lensed` (room made for one) — which the composition interpolates
with the lens envelope. Nothing is expressed in output pixels, so a new aspect
ratio is a data entry, not a re-layout.

| Composition | Size | Device | Type |
|---|---|---|---|
| `OpenScoutMontage` | 1920×1080 | left third, 84.5 % of height | right column, left-aligned; lens stacks beneath |
| `OpenScoutMontage-Vertical` | 1080×1920 | centred; shrinks 60 % → 40 % when the lens appears | centred beneath, lens between device and type |
| `OpenScoutMontage-Square` | 1080×1080 | left, 78 % → 72 % | right column; type rises to the top when the lens appears |

The vertical and square cuts are recompositions, not crops: the device changes
size and position, the lens changes width and anchor, and the type changes
alignment, width and vertical anchor.

## Sound

The capture is silent. `public/tracks/openscout/openscout-montage-score.wav` is
an original instrumental generated through Preframe's configured MiniMax Music
path (`readMusicModelConfig` + `getMiniMaxApiKey` → `music-2.6`, instrumental,
trace `06cbd3332501d27e25b0391cfa12babb`). The credential resolves from the
environment and is never written to disk or logged.

- Master: 45.000 s, 48 kHz, stereo, 24-bit PCM — exactly the composition length
- Measured: −18.6 LUFS integrated, 9.1 LU range, −1.58 dBTP
- Cut from the 199 s generation: its own quiet intro and build (0–35.5 s) joined
  by a 3.1 s equal-power crossfade to its composed resolution (186.0–198.6 s), so
  the 45 s piece has a real ending rather than a trim
- In the composition: gain 0.94 plus 8-frame / 18-frame safety ramps, since the
  master already carries its own fades
- Full generator settings, processing chain, hashes and rights notes:
  `openscout-montage-score.provenance.json`

`scripts/generate-montage-score.ts` is the reproducible generator for this path.

## Renders

```sh
bunx remotion render src/projects/openscout-montage/openscout-montage-entry.tsx \
  OpenScoutMontage out/openscout/openscout-montage-1920x1080.mp4 \
  --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p \
  --color-space=bt709 --audio-codec=aac --audio-bitrate=256k --concurrency=6

# same command with OpenScoutMontage-Vertical (1080×1920) and
# OpenScoutMontage-Square (1080×1080) at --crf=17
```

Remotion's `--color-space=bt709` writes the matrix but leaves primaries and
transfer unset, and it does not move the moov atom. Each render is finished with
a lossless remux that completes the BT.709 signalling in both the SPS VUI and the
container, and makes the file start-playable over HTTP:

```sh
ffmpeg -i _raw/<name>.mp4 -c copy -movflags +faststart \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -bsf:v "h264_metadata=colour_primaries=1:transfer_characteristics=1:\
matrix_coefficients=1:video_full_range_flag=0" <name>.mp4
```

`out/openscout/_raw/` keeps the pre-remux renders; `out/openscout/*.mp4` are the
delivered files.

## Next revision — operator direction (received, not yet applied)

Direction from the operator after reviewing the delivered cut. **Nothing below is
implemented**: the source in this folder still reproduces the shipped MP4s
exactly. Do not re-render or spend another MiniMax generation until the operator
asks for the next cut.

**Keep and lean into:** the simultaneous detail lens — a magnified region running
live while the full phone stays visible and active — is the strongest visual idea
in the piece. It should carry attention, with the whole device acting as stable
spatial context behind it.

**Pull back:** the phone's ongoing rotation, tilt and drift are over-authored and
sometimes pull attention off the UI. Keep device motion subtle, reduce amplitude
and frequency, and give the phone longer settled moments. Camera movement should
happen mainly around transitions or for motivated emphasis, then come to rest.

### Where the problem actually is

Not the pose values on their own — the driver. `OpenScoutMontage.tsx` computes

```ts
const progress = clampInterpolate(local, [0, chapter.durationInFrames], [0, 1])
```

which spreads every camera pose across the *entire* chapter, so the phone is
always mid-move and never arrives. Shrinking the numbers alone would produce
slower drift, not stillness. The change that matters is to let the move complete
early and then hold:

```ts
// settle within the first third of the chapter, then rest
const settleFrames = Math.min(chapter.durationInFrames * 0.38, 34)
const progress = clampInterpolate(local, [0, settleFrames], [0, 1], Easing.out(Easing.cubic))
```

### Suggested parameter pass

With motion concentrated at the head of each chapter, the poses should also come
down roughly by half. Current values are in `edit.ts`; targets:

| | now | target |
|---|---|---|
| `rotY` delta | 4–5° | 1.5–2° |
| `rotX` delta | 1.3–2.6° | ≤0.8° |
| `scale` delta | 0.04–0.06 | ~0.015 |
| `driftX/Y` | ±6–12 px | ±3–4 px |

Then add motion back only where it is motivated, rather than continuously:

- a small scale nudge (~0.01) driven by the **lens envelope**, so the device
  eases back a touch as the lens arrives and settles again as it leaves;
- keep the alternating sign of `rotY` between chapters — that is what makes the
  cuts land on a new angle, and it survives a much smaller amplitude;
- leave chapter V's slightly larger push, since it is motivated by the hold.

### Brand mark — authenticity correction

The hexagon in the header and the outro lockup is **not the OpenScout mark**. I
drew it by eye from the app's tab bar; it is a placeholder and should be replaced
with the checked-in artwork. This is a correction, not a redesign — the operator
likes the restrained title/outro atmosphere as it stands.

Canonical asset, already staged at `public/brand/openscout-wire-mark.svg`
(byte-identical copy, sha256 `58a83b3ab77631f7c116220c090ea9e58dd43bf63fdd4423ca023620774fd5e1`) from:

```
/Users/art/dev/openscout/apps/ios/Scout/Assets.xcassets/ScoutWireMark.imageset/scout-wire-mark.svg
```

It is the preferred mark for the airy title/outro treatment: it is already
off-white and needs no app-icon tile behind it. Alternatives if a full app-icon
treatment ever suits the composition — iOS `AppIcon.appiconset/icon_1024.png`,
web `landing/openscout.app/public/{favicon.svg,openscout-icon.png}`.

**Preserve the source geometry and colour. Do not redraw or approximate.** What
the current placeholder gets wrong:

| | placeholder | canonical |
|---|---|---|
| viewBox | `0 0 48 48` (square) | `0 0 224 236` — **taller than wide**, so width must be `size × 224/236` |
| corners | mitred | rounded, quadratic (`Q`) joins |
| stroke | 3 units on a 48 grid | 24 units on a 224 grid, `stroke-linejoin="round"` |
| inner element | filled circle | filled **hexagon**, `M112 70 154 94v48l-42 24-42-24V94Z` |
| colour | mint `#3FE0A0` | off-white `#f7f4ea` |

Both uses take a `stroke` prop that is currently `PALETTE.mint`; the canonical
mark is off-white, so pass `#f7f4ea` and let the mint stay on the rules, ticks
and chapter numerals. Simplest swap is to inline the two canonical paths in
`HexMark` (keeps it colour- and size-controllable) rather than `<Img>`-ing the
file, since the outro animates its opacity and scale.

### Leaning into the lens

Selectively, not everywhere — four lens beats in 45 s is probably the ceiling.
The one chapter without a lens that could earn one is **III CONVERSE**, on the
agent's structured reply (source ≈ 00:40.5–00:42.3, the `Group 1 — the front edge
of a turn` block with the `Agent responded ✓` receipt). A gentle scale-in on the
lens panel itself at entry would also help it take focus, now that the device
behind it is holding still.

## Review record

Checks run against the delivered files, not against the composition.

1. **Runtime.** All three are 1350 frames at 30 fps = 45.000 s exactly, inside
   the 44–48 s target at the preferred value. The AAC stream runs to 45.056 s;
   that 56 ms is the encoder's frame padding after the score has already faded,
   and it does not extend the picture.
2. **Container and colour.** H.264 High / yuv420p, BT.709 signalled on all three
   of primaries, transfer and matrix with `tv` range, `moov` before `mdat`
   (verified by atom order, so the files start playing before they finish
   downloading). AAC-LC 48 kHz stereo at ~253 kb/s.
3. **Black frames.** `blackdetect` over the full timeline returns zero hits in
   every format. The darkest frame in the master averages luma 23.4/255 at
   00:40.8 — the outro handover, where the device has receded and the lockup is
   still fading up. Nothing approaches a true black frame (~16).
4. **Frame inspection.** Sixteen frames sampled across the master (every chapter
   body, every chapter boundary mid-dissolve, and the outro) plus targeted checks
   at each lens window and each cut boundary. The device screen is legible at
   every sample; the three lens panels are legible at reading size.
5. **Rate disclosure.** Verified on the rendered pixels: `CAPTURE · REAL TIME`
   at 00:03.0, `CAPTURE · 1.6×` at 00:06.8, back to `REAL TIME` at 00:08.5 for
   the picker payoff, `CAPTURE · 1.3×` at 00:11.0.
6. **Cut hygiene.** The IV→V dissolve was inspected frame-by-frame after the
   shell cut was retimed twice; at 00:35.45–00:35.85 the outgoing layer shows
   only the quick-keys row, and the emoji keyboard that bled through an earlier
   pass at ~70 % opacity is gone.
7. **Audio.** −19.0 LUFS integrated, 9.8 LU range, −2.6 dBFS peak on the final
   mux — a conservative music-led bed with real headroom, and clean at both head
   and tail.

Per-format results are identical apart from bitrate and file size; the vertical
and square were checked with the same script and the same frame samples.
