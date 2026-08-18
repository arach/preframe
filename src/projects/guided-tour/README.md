# Guided tour — subjects × script variants

The narrated guided-tour video that shows the Preframe workflow (capture → brief →
montage → review → export). The **subject** of the demo swaps; the workflow stays.

## Model

- **Subject** (`TOUR_EXAMPLE`): `scout` (OpenScout) · `talkie` · `lattices`
  — shared identity, raw capture, catalog id, and narrator voice.
- **Script variant** (`TOUR_SCRIPT`): `diary` · `problem` · `terse` · `craft`
  — a distinct creative take on the same six beats. 3 subjects × 4 takes = **12 scripts**.

Each beat carries an aligned `narration` (spoken VO) **and** `caption` (the on-screen
echo) so the two never drift. The six beats map to fixed stills: `studio-code`,
`studio-new`, `studio-grid`, `reviewer-clean`, `reviewer-annotated`, `studio-queue`.

### Files

- `scripts.data.ts` — **generated** source of truth for the 12 scripts
  (regenerate via `.scratch/build-scripts-data.mjs`, or edit by hand — it's plain data).
- `profiles.ts` — types, the `resolveTourExample(project?, variant?)` resolver,
  per-subject voices (`PROJECT_VOICES`), and asset-path helpers.
- `story.ts` / `narration.ts` / `beats.ts` — caption + segment timing.
- `GuidedTourVideo.tsx` — the Remotion composition (monitor frame, tactical HUD,
  vignette, ducked music bed, narration + caption layers).

## Voices

One low-key narrator per subject so the set isn't all one voice:

| Subject  | Voice  | ElevenLabs id          |
|----------|--------|------------------------|
| scout    | River  | `SAz9YHcvj6GT2YYXdXww`  |
| talkie   | Sarah  | `EXAVITQu4vr4xnSDxMaL`  |
| lattices | Roger  | `CwhRBWXzGAHq8TQ4Fs17`  |

Override per-run with `NARRATION_VOICE`. Judge-recommended default take for every
subject is `diary`.

## Spacing

Tunable "room to breathe" knobs:

- `NARRATION_MIN_PAUSE_SEC` (`narration.ts`) — silence floor between VO lines.
- `TOUR_MARKER_BREATH` / `TOUR_WARMUP_SEC` (`story.ts`) — marker spread + intro hold.
- `tailSec` (`beats.ts`) — outro hold.

Segment duration is the **real** probed audio length — never clamped to a caption
window — so a VO line always finishes (no clipped/early-faded tails).

## Pipeline

```bash
# 1. capture footage for a subject (Playwright + Action native recorder)
bun run capture:tour:scout            # or :talkie / :lattices

# 2. voice the narration (ElevenLabs) — one take, or all 12
TOUR_EXAMPLE=scout TOUR_SCRIPT=diary secret run ELEVENLABS_API_KEY -- bun run gen:narration
secret run ELEVENLABS_API_KEY -- bun run gen:narration:all     # every take

# 3. render the narrated video (Remotion)
TOUR_EXAMPLE=scout TOUR_SCRIPT=diary bun run render:guided-tour
```

### Asset layout

`scout/diary` is the canonical take and keeps the legacy **flat** paths
(`docs/media/app/narration-*.mp3`, landing video at `preframe-guided-tour.mp4`).
Every other take is **namespaced**: `docs/media/app/<subject>-<variant>/…` and
`public/guided-tour/<subject>-<variant>/…`, so voicing/rendering them never clobbers.

## Effects / music

`GuidedTourVideo` layers a `TacticalFrame` corner-HUD, a soft vignette grade, and a
ducked synth bed (`public/tracks/futuristic-synthwave.mp3`, `musicVolume` prop). Pass
`musicSrc=""` to drop the music.
