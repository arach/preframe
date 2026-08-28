#!/usr/bin/env bun
/**
 * Registers the OpenScout theme-range score test:
 *
 *   1. One Treatment per score in the catalog editor — A · ORIGINAL VIBE,
 *      B · REFINED VIBE and C · GLASSHOUSE — so all three are playable,
 *      reviewable and comparable side by side.
 *   2. One Run, `openscout-theme-range`, organising the finals, the mastered
 *      scores and their provenance, the raw generations, the source master, the
 *      composition sources and the validation artefacts.
 *
 *   bun run scripts/register-openscout-theme-range.ts
 *   bun run scripts/register-openscout-theme-range.ts --base http://localhost:3100
 *   bun run scripts/register-openscout-theme-range.ts --offline        # run only
 *   bun run scripts/register-openscout-theme-range.ts --treatments-only
 *   bun run scripts/register-openscout-theme-range.ts --run-only
 *
 * Idempotent: treatments carry a stable idempotencyKey and the run upserts on
 * its slug with every member keyed, so a re-run after a re-render upgrades
 * members in place rather than duplicating them. Nothing is moved or renamed —
 * the treatment intake only ever copyFile()s, and the run points at canonical
 * paths. The earlier films' treatments and runs are not touched.
 */

import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import type {Run} from '@/lib/runs'
import {formatRunHandoff, submitAgentRun, type RunLinks} from '@/services/runs/intake'
import type {RunItemInput} from '@/services/runs/store'
import {
  EDIT_THEME_RANGE_BEAT,
  FPS,
  getPlacedEdit,
} from '../src/projects/openscout-montage/edit-theme-range'

const argv = process.argv.slice(2)
const OFFLINE = argv.includes('--offline')
const RUN_ONLY = argv.includes('--run-only')
const TREATMENTS_ONLY = argv.includes('--treatments-only')
const baseArg = argv.indexOf('--base')
const BASE = baseArg !== -1 ? argv[baseArg + 1] : 'http://localhost:3100'

const SLUG = 'openscout-theme-range'
const OUT = 'out/openscout-theme-range'
const FRAMES = getPlacedEdit(EDIT_THEME_RANGE_BEAT).totalFrames
const DURATION = FRAMES / FPS
const RES = '1920×1080'

const SYNOPSIS = [
  'A theme-range vignette for the redesigned OpenScout web app, cut from a single continuous',
  'capture of the Appearance settings surface. The film opens on the conservative Scout dark',
  'default, moves through Graphite and Polar as held comparisons, then accelerates: Solar,',
  'the whole-frame turn into light mode, and Scout seen in daylight — before returning to',
  'the grounded dark Scout identity it started from.',
  '',
  'Every transition in the film is the product doing its job. Each chapter opens exactly one',
  'beat before a theme switch, so the recolour on screen is the real interface recolouring,',
  'in full, at true speed — there is no artificial wipe, luma ramp or colour flash anywhere',
  'in the cut, and no cut is retimed. The room turns with the product: the stage lifts from',
  'near-black to warm graphite across the same beat the interface takes to change, so the',
  'reveal reads as a whole-frame event rather than a rectangle changing colour.',
  '',
  'Framing is fixed. The screen never moves, and the only camera in the film is a pair of',
  'settling push-ins in chapters II and III — 1.20× onto the theme cards and live specimen',
  'together, then 1.42× onto the specimen alone — each of which eases in, rests for the',
  'majority of its chapter, and eases out. The last four chapters, which carry the reveal and',
  'the return, are locked absolutely still.',
  '',
  'The capture is never upscaled: 1514 px of source is presented at 1340 px on a 1920 frame,',
  'and the film renders at 60 fps — the capture’s own rate — so no recolour is decimated.',
].join(' ')

const AB_NOTE = [
  'This is one of a matched set. Every treatment here shares ONE locked visual edit: the edit',
  'objects differ only in `score` and `scoreGain`, and the composition has no code path from',
  'either field to a pixel. The validation script proves this twice — by diffing the edit objects',
  'key by key, and by hashing every decoded video frame of all delivered MP4s and comparing',
  'them frame for frame.',
].join(' ')

type Variant = {
  key: 'a' | 'b' | 'c'
  suffix: string
  title: string
  score: string
  scoreLabel: string
  note: string
}

const VARIANTS: Variant[] = [
  {
    key: 'a',
    suffix: 'a-beat',
    title: 'A · ORIGINAL VIBE',
    score: 'public/tracks/openscout/openscout-theme-range-vibe-original.wav',
    scoreLabel: 'ORIGINAL VIBE — kinetic ambient instrumental',
    note:
      'The instrumental from the original OpenScout montage that established the product’s eerie, spacious identity: warm controlled low end, restrained percussion, signal-like tones and a patient build. Recut to the 31.2-second picture with a clean three-second resolution.',
  },
  {
    key: 'b',
    suffix: 'b-drift',
    title: 'B · REFINED VIBE',
    score: 'public/tracks/openscout/openscout-theme-range-vibe-refined.wav',
    scoreLabel: 'REFINED VIBE — eerie electronic instrumental',
    note:
      'The stronger instrumental identity from the approved OpenScout Reimagined film: eerie and spacious with a real but restrained pulse. Recut to the 31.2-second picture with a clean three-second resolution.',
  },
  {
    key: 'c',
    suffix: 'c-glasshouse',
    title: 'C · GLASSHOUSE',
    score: 'public/tracks/openscout/openscout-theme-range-glasshouse.wav',
    scoreLabel: 'GLASSHOUSE — cinematic melodic-techno instrumental',
    note:
      'A fresh cue written for this film rather than inherited from an earlier one: a dark, hypnotic melodic-techno instrumental — tight dry kick, sustained bass pulse, a glassy arpeggiated hook in long reverb, low held strings underneath. Chosen from three original generations on measured pulse clarity, spectral warmth and melodic centredness. Conformed to 125.000 BPM so the film’s open, its POLAR midpoint, its reveal and its outro all land on musical downbeats.',
  },
]

// ---------------------------------------------------------------------------
// 1. Treatments — one per score
// ---------------------------------------------------------------------------

async function registerTreatments() {
  for (const v of VARIANTS) {
    const filename = `openscout-theme-range-${v.suffix}.mp4`
    const path = resolve(OUT, filename)
    if (!existsSync(path)) throw new Error(`Missing deliverable: ${path}`)

    const payload = {
      mode: 'treatment',
      compositionId: `openscout-theme-range-${v.suffix}`,
      name: `OpenScout · theme range — ${v.title} (${DURATION.toFixed(1)}s, ${RES})`,
      prompt: `${SYNOPSIS}\n\nSCORE — ${v.scoreLabel}. ${v.note}\n\n${AB_NOTE}`,
      outputs: [{path, filename}],
      params: {
        aspectRatio: '16:9',
        durationSec: DURATION,
        fps: FPS,
        frames: FRAMES,
        resolution: RES,
        variant: v.title,
        score: v.score,
      },
      // Pinned per variant, and never bumped for an unrelated change: the key is
      // what stops a re-run from minting a second treatment beside the one
      // reviewers are already looking at.
      idempotencyKey: `openscout-theme-range-${v.suffix}-${v.key === 'c' ? '2026-08-15' : '2026-08-14'}`,
    }

    const res = await fetch(`${BASE}/api/agents/jobs`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
    console.log(`\n=== treatment ${payload.compositionId} → HTTP ${res.status} ===`)
    console.log(typeof parsed === 'string' ? parsed.slice(0, 900) : JSON.stringify(parsed, null, 2))
    if (!res.ok) process.exitCode = 1
    else console.log(`Treatment URL: ${BASE}/treatments/openscout-theme-range-${v.suffix}`)
  }
}

// ---------------------------------------------------------------------------
// 2. Run membership
// ---------------------------------------------------------------------------

const items: RunItemInput[] = []
let order = 0
const add = (item: RunItemInput) => items.push({...item, order: order++})

for (const v of VARIANTS) {
  add({
    key: `final:${v.suffix}`,
    role: 'final',
    label: `Theme range — ${v.title}`,
    description: `${v.scoreLabel}. ${v.note}`,
    group: 'Film · one picture, two scores',
    preferred: v.key === 'c',
    path: `${OUT}/openscout-theme-range-${v.suffix}.mp4`,
    meta: {
      format: '16:9',
      resolution: RES,
      durationSec: DURATION,
      fps: FPS,
      frames: FRAMES,
      variant: v.title,
    },
  })
}

// -- Scores ------------------------------------------------------------------
for (const v of VARIANTS) {
  add({
    key: `score:${v.key}`,
    role: 'asset',
    label: `${v.scoreLabel}`,
    description: `${DURATION.toFixed(6)} s, 48 kHz stereo 24-bit PCM. Generated through Preframe's configured MiniMax Music path (music-2.6, instrumental) from its own prompt — not an EQ or tempo variant of the other. The validator cross-correlates the two onset envelopes over ±2 s of lag to prove they are independent performances.`,
    group: 'Score · the only thing that differs',
    preferred: v.key === 'c',
    path: v.score,
    meta: {variant: v.title},
  })
}
add({
  key: 'score:provenance',
  role: 'asset',
  label: 'Score provenance',
  description:
    'Generation endpoint and model, raw-generation SHA-256s, measured vs requested tempo, the mastering window and why it was chosen, the full filter chain, and measured loudness for both tracks.',
  group: 'Score · the only thing that differs',
  path: 'public/tracks/openscout/openscout-theme-range-scores.provenance.json',
})
add({
  key: 'score:provenance:glasshouse',
  role: 'asset',
  label: 'GLASSHOUSE score provenance',
  description:
    'The fresh pass: the full generation prompt, why the earlier prompts produced novelty music and what changed, all three candidates and the measured grounds for choosing between them, the tempo measurement and why the cue was conformed to 125.000 BPM rather than to the film’s 100, the mastering window and the filter chain, and measured loudness.',
  group: 'Score · the only thing that differs',
  preferred: true,
  path: 'public/tracks/openscout/openscout-theme-range-glasshouse.provenance.json',
})
for (const v of VARIANTS) {
  add({
    key: `score:raw:${v.key}`,
    role: 'asset',
    label: `Raw MiniMax generation — ${v.title}`,
    description: 'The unedited generation the master was cut from, with its request sidecar.',
    group: 'Score · the only thing that differs',
    path: {
      a: 'public/tracks/generated/openscout-theme-range-beat-mstg16fi.mp3',
      b: 'public/tracks/generated/openscout-theme-range-drift-mstg1oxd.mp3',
      c: 'public/tracks/generated/openscout-vibe-glasshouse-mstvwgk6.mp3',
    }[v.key],
  })
}

// -- Source ------------------------------------------------------------------
add({
  key: 'source:master',
  role: 'source',
  label: 'theme-range capture — CFR 60 master',
  description:
    '1514×1072, 34.583 s, constant 60 fps, BT.709, no audio, dense keyframes so every timecode in the EDL lands on the frame it names. Normalised from the supplied editor-ready capture; browser chrome was already removed at capture time.',
  group: 'Source capture',
  preferred: true,
  path: 'public/demos/openscout/openscout-theme-range-cfr60.mp4',
})

// -- Composition & scripts ---------------------------------------------------
for (const [key, path, label, description] of [
  [
    'src:edit',
    'src/projects/openscout-montage/edit-theme-range.ts',
    'edit-theme-range.ts — the locked edit',
    'The measured theme journey, the 100 BPM / 144-frame grid, the one-beat pre-roll rule, all seven chapters, both pushes, and the two variant edits. Also declares AB_VARIABLE_KEYS — the only fields allowed to differ between A and B.',
  ],
  [
    'src:composition',
    'src/projects/openscout-montage/OpenScoutThemeRange.tsx',
    'OpenScoutThemeRange.tsx — the composition',
    'Stage, grain, screen, push, bloom, type band, wire-mark outro. The only place a score is read is the <Audio> element at the bottom, which produces no pixels.',
  ],
  [
    'script:generate',
    'scripts/generate-theme-range-scores.ts',
    'generate-theme-range-scores.ts',
    'Both score prompts and the MiniMax call, through Preframe’s configured music path.',
  ],
  [
    'script:analyze',
    'scripts/analyze-theme-range-score.ts',
    'analyze-theme-range-score.ts',
    'Spectral-flux onset envelope, autocorrelation tempo estimate over four lag multiples, and a per-second RMS map used to choose each mastering window.',
  ],
  [
    'script:master',
    'scripts/master-theme-range-scores.ts',
    'master-theme-range-scores.ts',
    'Beat- and bar-phase measurement, downbeat snapping, two-pass linear loudnorm, and the exact-runtime cut.',
  ],
  [
    'script:render',
    'scripts/render-openscout-theme-range.ts',
    'render-openscout-theme-range.ts',
    'Render and finish. Encoder settings are shared rather than per-target, so the A/B cannot be broken downstream.',
  ],
  [
    'script:validate',
    'scripts/validate-openscout-theme-range.ts',
    'validate-openscout-theme-range.ts',
    'Edit-object diff, per-frame picture identity, score distinctness, the measured theme journey, and the standard media checks.',
  ],
] as const) {
  add({
    key,
    role: 'asset',
    label,
    description,
    group: 'Composition & scripts',
    path,
  })
}

// -- Validation --------------------------------------------------------------
add({
  key: 'validation:report',
  role: 'asset',
  label: 'VALIDATION.md',
  description:
    'Full check output, including the frame-identity proof and the measured per-chapter luma journey.',
  group: 'Validation',
  preferred: true,
  path: `${OUT}/VALIDATION.md`,
})
add({
  key: 'validation:stills',
  role: 'asset',
  label: 'Validation stills',
  description: 'Representative frames from both deliverables, plus the wire-mark check frames.',
  group: 'Validation',
  path: `${OUT}/validation-stills`,
})

const payload = {
  slug: SLUG,
  title: 'OpenScout — theme range (A/B: BEAT vs DRIFT)',
  summary: `One locked ${DURATION.toFixed(1)} s picture, two original scores. ${RES}, ${FPS} fps, ${FRAMES} frames.`,
  description: `${SYNOPSIS}\n\n${AB_NOTE}`,
  groups: [
    {
      label: 'Film · one picture, two scores',
      description: `${DURATION.toFixed(3)} s · ${FRAMES} frames · ${FPS} fps · frame-identical picture`,
      order: 0,
    },
    {
      label: 'Score · the only thing that differs',
      description: 'Two independent MiniMax generations, mastered to the same runtime',
      order: 1,
    },
    {label: 'Source capture', description: 'The single capture the film is cut from', order: 2},
    {label: 'Composition & scripts', description: 'The system that produced the film', order: 3},
    {label: 'Validation', description: 'Media checks, A/B proof and representative frames', order: 4},
  ],
  items,
  itemsMode: 'replace' as const,
}

// ---------------------------------------------------------------------------

function report(created: boolean, run: Run, warnings: string[], links: RunLinks) {
  const pending = run.items.filter((i) => i.state !== 'ready').length
  console.log(`\n${created ? 'Created' : 'Updated'} run "${run.slug}"`)
  console.log(`  ${run.items.length} artifacts · ${pending} pending`)
  if (warnings.length) {
    console.log('\nPending:')
    for (const w of warnings) console.log(`  · ${w}`)
  }
  console.log(`\n${formatRunHandoff(run, OFFLINE ? undefined : BASE)}`)
  console.log(`\nRun URL: ${links.run}`)
}

async function registerRun() {
  if (OFFLINE) {
    const result = await submitAgentRun(payload)
    report(result.created, result.run, result.warnings, result.links)
    return
  }
  const res = await fetch(`${BASE}/api/agents/runs`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`HTTP ${res.status}\n${text.slice(0, 1200)}`)
    process.exit(1)
  }
  const body = JSON.parse(text)
  report(body.created, body.run, body.warnings, body.links)
}

async function main() {
  if (!RUN_ONLY) await registerTreatments()
  if (!TREATMENTS_ONLY) await registerRun()
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
