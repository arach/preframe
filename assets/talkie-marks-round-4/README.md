# Talkie mark — Round 4 (Track 1: SVG / vector)

**Filed:** 2026-05-20
**Owner:** preframe (Track 1 of 3 — parallel raster tracks running on Codex+ImageGen and MiniMax)
**Brief:** `narrative-studio/docs/specs/talkie-mark-grand-brief.md`

This round questions the premise that the mark is a lowercase `t`. Divergent shape exploration across four direction buckets. Letterless where possible. Palette respected. Mics off-limits.

## Gallery

- **Local:** http://localhost:3100/marks/round-4
- **Source SVGs:** `preframe/assets/talkie-marks-round-4/`
- **Public copies (if mirrored):** `preframe/public/marks-round-4/`

Scale toggle: 16 / 64 / 256 / 1024. Dark canvas default.

## Candidates by bucket

| ID | Name | Notes |
|---|---|---|
| **A · Oscilloscope** | | |
| A1 | sine-bounce | Single rise+fall, Hot Mic at peak. Calmest of the set. |
| A2 | triple-bump | Three peaks evoking the "tal-kie" syllabic rhythm. |
| A3 | heartbeat | Plateaus + sharp spike. Medical/instrumental register. |
| A4 | closed-loop | Trace forms a sealed shape rather than a horizontal line. |
| **B · Tape reel** | | |
| B1 | symmetric-reels | Twin circles + ribbon. The canonical reel reading. |
| B2 | asymmetric-reels | One full, one half-spooled. Recording in progress. |
| B3 | orphan-reel | Single reel + trailing ribbon. Most abstract. |
| B4 | cross-section | Edge-on view, two ellipses stacked. Reads as depth. |
| **C · Two-state** | | |
| C1 | lozenge → wave | Closed lozenge opens into escaping waveform. (2 frames) |
| C2 | dot → line | Single dot extrudes into oscilloscope rhythm. (2 frames) |
| C3 | circle → twin | One circle splits into twin reels. Bridges to Bucket B. (2 frames) |
| **D · Walkie + p** | | |
| D1 | walkie-minimal | Antenna + body, faint speaker dot inside. |
| D2 | walkie-geometric | Solid capsule + diagonal antenna mark. Maximum reduction. |
| D3 | p-stem-bowl | Lowercase p with Hot Mic in the bowl ("press to talk"). |

14 candidates total. 6 SVGs in Bucket C (3 × 2 states).

## Top 3 picks across buckets

1. **C2 — dot → line.** This is the strongest of the set. The idle (single cream dot) is the brand's most reduced primitive — already the heartbeat of every Talkie surface — and the recording form (oscilloscope extrusion) names exactly what's happening. The shape *is* the transition. Survives the legibility ladder cleanly: at 16px the idle is a single pixel-circle, at 1024px the recording trace carries detail. Works everywhere.

2. **A1 — sine-bounce.** The calmest of the oscilloscope set. One rise, one fall, dot at the peak. It looks like a brand mark, not a sound-wave UI element. At 16px the dot survives even if the trace doesn't read precisely — the dot anchors. Reads "voice" without ever touching mic vocabulary.

3. **B1 — symmetric reels.** The brand has been speaking this vocabulary for months (palette names, processing motion). B1 consolidates it without going skeuomorphic. Hot Mic in the right reel reads as "this is the live source." Two-circle composition is the most distinct silhouette at icon scale.

## One surprise

**B3 — orphan-reel.** I expected this to be too abstract to read at 16px, but the single circle + trailing curve actually carries more silhouette identity than the twin-reel variants at small scales. The trailing ribbon gives it asymmetry that a plain circle wouldn't have. Push: try this as the favicon-scale mark even if a twin-reel variant wins for the app icon.

## One thing to push further

**C-bucket fluidity.** All three two-state candidates work as still images in both states (per spec), but the *transition* between them isn't drawn. The brief deferred motion explicitly — but C1's "opening" lozenge in particular wants to be animated to fully sell the metaphor. Round 5 might commission a Lottie-feasible motion study for the top C-bucket survivor, where the in-between frames are also still-legible mark candidates. The transition itself could be a 6th mark variant.

Also worth pushing: **B + C overlap.** C3 (circle → twin reels) and B1 (symmetric reels) are different framings of the same geometry. If C3 wins as the two-state primitive, B1 becomes redundant; if B1 wins as the static mark, C3 becomes its motion form. Round 5 should resolve this overlap by picking which framing leads.

## Cross-track observation (optional)

When the raster tracks (Codex+ImageGen, MiniMax) ship: I'd predict both will converge on Bucket A oscilloscope shapes — those are well-recognized in training data and ImageGen models tend to produce them as default "voice tech logo" output. The interesting signal will be whether either model surfaces Bucket B (tape reel) variations independently. If they do, that's evidence the cassette/reel vocabulary reads as "voice" outside our brand's intentional framing, which would strengthen B as a candidate. If they don't, B is genuinely brand-specific and Bucket A becomes the safer bet for recognition.

I also expect both raster tracks to *accidentally* produce mic-adjacent silhouettes despite explicit exclusion — the training-data gravity is strong. Flag any candidate that survives selection but reads as mic at 16px.

## Format ladder notes

All 14 SVGs survive 256–1024px cleanly. Per-scale legibility:

- **16px:** A3 heartbeat (the spike collapses), C1 wave (escaping curls become noise), B4 cross-section (ellipses too thin) struggle. A1, C2, C3, B1, B3, D2 read clean.
- **64px:** All survive but B2 (asymmetric reels) ribbon thins to near-invisible.
- **256px+:** All clean.

If a candidate is intended for favicon/system-tray use, only the 16px-clean set is in play.

## File structure

```
preframe/assets/talkie-marks-round-4/
├── README.md                 # this file
├── A-oscilloscope/
│   ├── A1-sine-bounce-{1024.svg, 64.png, 16.png}
│   ├── A2-triple-bump-{...}
│   ├── A3-heartbeat-{...}
│   └── A4-closed-loop-{...}
├── B-tape-reel/
│   ├── B1-symmetric-reels-{...}
│   ├── B2-asymmetric-reels-{...}
│   ├── B3-orphan-reel-{...}
│   └── B4-cross-section-{...}
├── C-two-state/
│   ├── C1-lozenge-to-wave-{idle,recording}-{...}
│   ├── C2-dot-to-line-{idle,recording}-{...}
│   └── C3-circle-to-twin-{idle,recording}-{...}
└── D-walkie-p/
    ├── D1-walkie-minimal-{...}
    ├── D2-walkie-geometric-{...}
    └── D3-p-stem-bowl-{...}
```

Each `*-1024.svg` is the master. PNG thumbs at 64 and 16 generated via ImageMagick for the legibility ladder.

## Reply target

`channel.font-studio` — per the brief reply format. Gallery URL + top 3 + surprise + push-further + cross-track observation.
