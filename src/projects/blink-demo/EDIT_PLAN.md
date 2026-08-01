# Blink spatial desk — first composition plan

## Source record

- Source: `/Users/art/dev/action/artifacts/demos/blink-pi-surround-hotkey-demo-nocursor.mp4`
- Staged copy: `public/demos/blink/blink-pi-surround-hotkey-demo-nocursor.mp4`
- SHA-256 (both): `c5dae57d71fdec1aa14e31c3685110bbd4700ab52efc89939a2a4ed2ebb87beb`
- Probe: H.264, 1720×720, 60000/1001 fps, 119.202417s, silent
- Storyboards:
  - `public/demos/blink/blink-storyboard-4s.jpg`
  - `public/demos/blink/blink-storyboard-hotkey.jpg`

The staged file is a byte-identical copy. The source in the Action workspace is
never edited or used as a render-time dependency.

## Editorial thesis

The product proof is already in the capture: Pi learns Blink's CLI, types real
commands, and turns a centered terminal session into a spatial desk. The edit
should clarify that cause-and-effect rather than decorate it. We stay
chronological, compress reading and waiting, return to real time for every
spatial payoff, and never introduce a mouse or simulated product state.

Target: **1419 frames / 47.30s at 30fps**, 1920×1080.

## Timecoded edit decision list

| Comp | Source | Rate | Editorial purpose | Treatment |
|---|---:|---:|---|---|
| 00:00.00–00:04.83 | 00:07.80–00:13.60 | 1.2× | Session wakes; first visible typing | Exact 1:1 source pixels; title fades over live capture |
| 00:04.83–00:12.30 | 00:13.60–00:43.50 | 4.0× | Pi learns `present`, `open`, and desk controls | Exact 1:1 source pixels; rate is disclosed |
| 00:12.30–00:17.43 | 00:43.50–00:55.80 | 2.4× | Pi types the first note command | Preserve continuous source chronology |
| 00:17.43–00:21.83 | 00:55.80–01:00.20 | 1.0× | Launch brief appears on the canvas | Ease to the full spacious desktop; quiet UI tap |
| 00:21.83–00:24.07 | 01:00.20–01:06.50 | 2.8× | Pi inspects and types the move command | Full canvas; no transition flourish |
| 00:24.07–00:26.77 | 01:06.50–01:09.20 | 1.0× | First note moves to the upper left | Real-time payoff; quiet UI tap |
| 00:26.77–00:30.53 | 01:09.20–01:17.90 | 2.3× | Pi creates the second note | Full canvas; continuous source chronology |
| 00:30.53–00:33.03 | 01:17.90–01:20.40 | 1.0× | Next actions appears on the right | Real-time payoff; quiet UI tap |
| 00:33.03–00:35.90 | 01:20.40–01:29.00 | 3.0× | Pi verifies both note files and positions | Let the two-note composition settle |
| 00:35.90–00:44.77 | 01:46.40–01:55.27 | 1.0× | Hyper+B hides, then restores both notes | Clarify the capture's raw key viewer with restrained keycaps |
| 00:44.77–00:47.30 | — | — | Blink signature outro | The restored desk clears from the center into a website-derived parchment frame on the score's final lift: Cormorant Garamond, JetBrains Mono, the Blink mark, botanical green, fine grid/dither, and the four-part spec strip |

The omitted 01:29.00–01:46.40 interval is a static hold on the same two-note
desk state. Cutting it does not reorder an action or fabricate continuity.

## Caption and chapter system

- **01 / DRIVE** — “Pi learns the surface, then types the command.”
- **02 / PLACE** — “One launch brief. Positioned on the canvas.”
- **03 / SURROUND** — “A second note lands opposite.”
- **04 / RECALL** — “Hyper+B clears — and restores — the desk.”
- Header always identifies the proof chain: `PI → CLI → SPATIAL DESK`.
- Playback rates above 1× are disclosed at the top right.
- Hyper+B appears as a purpose-built key-chord card twice, labeled by action.
- The outro uses the live website's Cormorant Garamond + JetBrains Mono pairing,
  warm parchment/green palette, Blink mark, grid/dither, and spec strip. Type
  stays at fixed pixel sizes; the frame itself clears open during the score's
  final lift.

## Written visual rubric

Score the rendered pixels, not the code, against these six checks:

1. **Causal clarity** — a viewer can follow Pi/terminal → CLI command → Blink
   response without narration. Every product change follows visible terminal
   activity.
2. **Spatial proof** — the first note's reveal and move, the second note's
   opposite placement, and the hide/restore state are all readable at full
   canvas scale.
3. **Terminal fidelity** — the 1720×720 capture maps one-to-one into the 1080p
   master with no camera transform, fractional resampling, or scaled overlay
   type. The centered 160×60 iTerm2 session stays as crisp as the source allows.
4. **Editorial honesty** — chronology is preserved; acceleration is disclosed;
   the only discontinuous source skip removes an unchanged 17.4-second hold.
5. **Premium restraint** — one dark proof frame, one website-derived cream
   signature, hairline chrome, four chapter verbs, and two key cards. Cormorant
   appears only in the branded outro; technical overlays remain fixed-size mono.
   No glitch, neon, scanline, cursor, fake UI, or template transition stack.
6. **Pace and finish** — total runtime remains 45–55 seconds; important product
   responses return to 1×; sound stays below the image and ends cleanly.

## Sound treatment

The source is silent. `public/tracks/blink/blink-spatial-score.wav` is a
MiniMax-generated, low-density chamber/electronic score shaped around the first
note, move, second note, and hide/restore beats. Existing `tap.wav` and
`creamy_typing.wav` stay quiet in the mix; they should register as tactility,
not as UI cosplay. Generator settings, processing, source hash, and rights notes
are recorded in `blink-spatial-score.provenance.json`.

## Precision master exports

The capture is 1720×720 inside a 1920×1080 composition. Keep the capture at
exactly 1:1: do not add a render scale, CSS camera transform, or fractional
container size. The reviewable web master uses explicit BT.709 tagging and a
low CRF; the archival master keeps overlay typography in 10-bit 4:2:2 ProRes.

```sh
bunx remotion render \
  src/projects/blink-demo/blink-demo-entry.tsx \
  BlinkSpatialDemo \
  out/blink/blink-spatial-demo-final.mp4 \
  --codec=h264 --crf=14 --x264-preset=slow \
  --pixel-format=yuv420p --color-space=bt709 \
  --audio-bitrate=320k --concurrency=4

bunx remotion render \
  src/projects/blink-demo/blink-demo-entry.tsx \
  BlinkSpatialDemo \
  out/blink/blink-spatial-demo-master.mov \
  --codec=prores --prores-profile=hq --pixel-format=yuv422p10le \
  --color-space=bt709 --concurrency=4
```

## Final review record

1. The capture remains at exact 1:1 pixels; the terminal is materially sharper
   than the scaled draft and no separate detail crop is needed.
2. The MiniMax score is the chosen soundtrack; UI typing and taps stay quiet
   underneath it.
3. Runtime is locked at 47.30 seconds. The restored desk registers before the
   website-derived outro opens at 44.77 seconds on the score's final lift.
