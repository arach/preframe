#!/usr/bin/env bun
/**
 * Registers the OpenScout — daylight deliverables:
 *
 *   1. Three Treatments in the catalog editor — one per delivered format — so
 *      each is available for review, annotation, compare and the revise flow.
 *   2. One Run, `openscout-daylight`, that organises the finals, the unchanged
 *      score, both source captures, the composition sources, the validation
 *      artefacts and the production notes — with the refined and reimagined
 *      cuts kept as members so the A/B comparison lives in one place.
 *
 *   bun run scripts/register-openscout-daylight.ts
 *   bun run scripts/register-openscout-daylight.ts --base http://localhost:3100
 *   bun run scripts/register-openscout-daylight.ts --offline     # run only
 *   bun run scripts/register-openscout-daylight.ts --run-only
 *   bun run scripts/register-openscout-daylight.ts --treatments-only
 *
 * Idempotent: treatments carry a stable idempotencyKey and the run upserts on
 * its slug with every member keyed, so a re-run after a re-render upgrades
 * members in place rather than duplicating them. Nothing is moved or renamed —
 * the treatment intake only ever copyFile()s, and the run points at canonical
 * paths. The earlier films' own treatments and runs are not touched.
 */

import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import type {Run} from '@/lib/runs'
import {formatRunHandoff, submitAgentRun, type RunLinks} from '@/services/runs/intake'
import type {RunItemInput} from '@/services/runs/store'

const argv = process.argv.slice(2)
const OFFLINE = argv.includes('--offline')
const RUN_ONLY = argv.includes('--run-only')
const TREATMENTS_ONLY = argv.includes('--treatments-only')
const baseArg = argv.indexOf('--base')
const BASE = baseArg !== -1 ? argv[baseArg + 1] : 'http://localhost:3100'

const SLUG = 'openscout-daylight'
const OUT = 'out/openscout-daylight'
const REFINED_OUT = 'out/openscout-refined'
const REIMAGINED_OUT = 'out/openscout-reimagined'
const FRAMES = 1650
const DURATION = 55.0

type Format = {
  format: '16:9' | '9:16' | '1:1'
  suffix: string
  label: string
  use: string
}

const FORMATS: Format[] = [
  {
    format: '16:9',
    suffix: '1920x1080',
    label: '16:9 landscape master',
    use: 'site hero, YouTube, decks, press',
  },
  {format: '9:16', suffix: '1080x1920', label: '9:16 vertical', use: 'Stories, Reels, Shorts, TikTok'},
  {format: '1:1', suffix: '1080x1080', label: '1:1 square', use: 'in-feed social, LinkedIn, X'},
]

const SYNOPSIS = [
  'The film now meets the product in daylight and turns dark on purpose. Two bars of authored',
  'opening — mark, wordmark, a rule that draws, and "A local-first control plane for coding',
  'agents." typed rather than faded — hand over to four light-mode beats: CONNECT (the airy',
  'For You overview, "Your Macs, discovered and online.") → PERSONALIZE (the real Appearance',
  'panel, "Make it yours — light or dark.") → CONVERSE (an agent returns a diagnosis and its',
  'root cause) → DISPATCH (HOST · Arachs Mac mini, 68 projects, the composer).',
  '',
  'Then the hinge. TRANSFORM returns to the same Appearance panel and cashes the promise the',
  'film made in chapter II: the dark surface is revealed out of the Mode row itself, and the',
  'stage turns with it on the same frames. From there the dark half runs CHOOSE (the picker',
  'moving from Claude · Opus 5 to Codex · Sonnet 4.6, effort on MEDIUM) → OBSERVE (five',
  'unbroken seconds of the live Tail) → PRESENT (the real Presentation control cycling Scout,',
  'Messages, WhatsApp, Original) → RETURN (back to the thread) → the off-white #F7F4EA mark',
  'and the established payoff hierarchy.',
  '',
  'The spatial composition is the refined cut’s, kept because it works: a full fixed phone, a',
  'stable title-and-explanation column, and a preallocated detail-lens slot, all top-anchored,',
  'with no camera and no layout states to travel between. What is new is a transition',
  'framework — typed titles, eased lens arrivals and departures, chapters that hand over',
  'rather than cross-fade, and one authored mode reveal.',
  '',
  'The score is UNCHANGED: same asset, same gain, same 55.000 s. The film is still 33 bars at',
  '144 BPM and every boundary still lands on a 50-frame downbeat.',
].join(' ')

// ---------------------------------------------------------------------------
// 1. Treatments — one per delivered format
// ---------------------------------------------------------------------------

async function registerTreatments() {
  for (const fmt of FORMATS) {
    const filename = `openscout-daylight-${fmt.suffix}.mp4`
    const path = resolve(OUT, filename)
    if (!existsSync(path)) throw new Error(`Missing deliverable: ${path}`)

    const payload = {
      mode: 'treatment',
      compositionId: `openscout-daylight-${fmt.suffix}`,
      name: `OpenScout · daylight — ${fmt.label} (55s, ${fmt.suffix.replace('x', '×')})`,
      prompt: `${SYNOPSIS}\n\nDelivered ${fmt.format} at ${fmt.suffix.replace(
        'x',
        '×',
      )} for ${fmt.use}. Recomposed rather than cropped: device placement, type column and lens slot are each defined per aspect ratio in normalised stage units, as one locked layout rather than a pair of states to travel between.`,
      outputs: [{path, filename}],
      params: {
        aspectRatio: fmt.format,
        durationSec: DURATION,
        fps: 30,
        frames: FRAMES,
        resolution: fmt.suffix.replace('x', '×'),
      },
      idempotencyKey: `openscout-daylight-${fmt.suffix}-2026-08-13`,
    }

    const res = await fetch(`${BASE}/api/agents/jobs`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
    console.log(`\n=== treatment ${payload.compositionId} → HTTP ${res.status} ===`)
    console.log(typeof parsed === 'string' ? parsed.slice(0, 900) : JSON.stringify(parsed, null, 2))
    if (!res.ok) process.exitCode = 1
  }
}

// ---------------------------------------------------------------------------
// 2. Run membership
// ---------------------------------------------------------------------------

const items: RunItemInput[] = []
let order = 0
const add = (item: RunItemInput) => items.push({...item, order: order++})

for (const fmt of FORMATS) {
  const isHero = fmt.format === '16:9'
  add({
    key: `final:${fmt.suffix}`,
    role: isHero ? 'final' : 'variant',
    label: `Daylight — ${fmt.label}`,
    description: isHero
      ? 'The landscape master. Authored opening, four light beats, the mode hinge, four dark beats, the branded payoff.'
      : `Recomposed for ${fmt.use}.`,
    group: 'Film · three formats',
    preferred: isHero,
    path: `${OUT}/openscout-daylight-${fmt.suffix}.mp4`,
    meta: {
      format: fmt.format,
      resolution: fmt.suffix.replace('x', '×'),
      durationSec: DURATION,
      fps: 30,
      frames: FRAMES,
    },
  })
}

// -- The two cuts this one is reviewed against -------------------------------
for (const fmt of FORMATS) {
  add({
    key: `compare:refined:${fmt.suffix}`,
    role: 'reference',
    label: `Refined (previous cut) — ${fmt.label}`,
    description:
      fmt.format === '16:9'
        ? 'The cut this iteration continues. Kept intact and still renderable: dark from the first product frame, nine dark chapters, opacity as the only transition verb.'
        : undefined,
    group: 'Comparison · preserved cuts',
    preferred: fmt.format === '16:9',
    path: `${REFINED_OUT}/openscout-refined-${fmt.suffix}.mp4`,
    meta: {format: fmt.format, durationSec: DURATION, frames: FRAMES},
  })
}
add({
  key: 'compare:reimagined:1920x1080',
  role: 'reference',
  label: 'Reimagined — 16:9 landscape',
  description: 'The cut the refined pass was made from. Kept for the full lineage.',
  group: 'Comparison · preserved cuts',
  path: `${REIMAGINED_OUT}/openscout-reimagined-1920x1080.mp4`,
  meta: {format: '16:9', durationSec: DURATION, frames: FRAMES},
})

// -- Score -------------------------------------------------------------------
add({
  key: 'score:master',
  role: 'asset',
  label: 'openscout-reimagined-score.wav — unchanged',
  description:
    '144 BPM, 55.000000 s, 48 kHz stereo 24-bit PCM. Not re-cut, not re-mastered, not regenerated for this pass. Checked against the refined edit at source level by the validation script — same asset, same 0.92 gain, same runtime.',
  group: 'Score',
  path: 'public/tracks/openscout/openscout-reimagined-score.wav',
})

// -- Source captures ---------------------------------------------------------
add({
  key: 'source:light',
  role: 'asset',
  label: 'openscout-nav-light-v3-cfr30.mp4 — the light half',
  description:
    '1178×2556, 105.967 s, constant 30 fps, BT.709. Supplies chapters I–V: the For You overview, the Appearance panel, the thread and the composer, all in light mode.',
  group: 'Source captures',
  path: 'public/demos/openscout/openscout-nav-light-v3-cfr30.mp4',
})
add({
  key: 'source:reimagined',
  role: 'asset',
  label: 'openscout-reimagined-dark-device-master-cfr30.mp4 — the dark half',
  description:
    '1178×2556, 109.533 s, constant 30 fps, BT.709. Supplies chapters V–IX: the dark Appearance panel the hinge lands on, the picker, the Tail, the Presentation control and the closing thread.',
  group: 'Source captures',
  path: 'public/demos/openscout/openscout-reimagined-dark-device-master-cfr30.mp4',
})

// -- Composition & scripts ---------------------------------------------------
add({
  key: 'src:edit',
  role: 'document',
  label: 'edit-daylight.ts — the EDL, the grid and the formats',
  description:
    'Nine chapters, every source window audited on contact sheets before it was used, every lens rectangle measured on a gridded full-resolution frame. Carries the redaction and the mode reveal.',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/edit-daylight.ts',
})
add({
  key: 'src:composition',
  role: 'document',
  label: 'OpenScoutDaylight.tsx — the composition and the transition framework',
  description:
    'Typed titles, eased lens arrivals and departures, scheduled chapter hand-overs, and the radial mode reveal. A sibling of OpenScoutRefined.tsx, which is untouched.',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/OpenScoutDaylight.tsx',
})
add({
  key: 'src:render',
  role: 'document',
  label: 'render-openscout-daylight.ts',
  group: 'Composition & scripts',
  path: 'scripts/render-openscout-daylight.ts',
})
add({
  key: 'src:validate',
  role: 'document',
  label: 'validate-openscout-daylight.ts',
  group: 'Composition & scripts',
  path: 'scripts/validate-openscout-daylight.ts',
})

// -- Brand -------------------------------------------------------------------
add({
  key: 'brand:wire-mark',
  role: 'asset',
  label: 'openscout-wire-mark.svg — canonical off-white mark',
  description:
    'Inlined at #F7F4EA in the header, the opening and the ending. Verified on decoded pixels by the validation script; there is no green or mint mark in the film.',
  group: 'Brand',
  path: 'public/brand/openscout-wire-mark.svg',
})

// -- Validation --------------------------------------------------------------
add({
  key: 'validation:report',
  role: 'document',
  label: 'VALIDATION.md — media checks',
  description:
    'Resolution, duration, frame count, BT.709 signalling, faststart, AAC, blackdetect, loudness, mark colour, the unchanged score, the redaction guard, and the measured light→dark turn.',
  group: 'Validation',
  path: `${OUT}/VALIDATION.md`,
})
add({
  key: 'validation:stills',
  role: 'asset',
  label: 'validation-stills/ — representative frames',
  description:
    'The opening and its handover, one frame inside every chapter, both sides of the hinge and its midpoint, and the branded ending.',
  group: 'Validation',
  path: `${OUT}/validation-stills`,
})

// -- Notes -------------------------------------------------------------------
add({
  key: 'doc:production-notes',
  role: 'document',
  label: 'PRODUCTION_NOTES_DAYLIGHT.md — this pass',
  description:
    'The story change, the source audit behind the light half, the hinge, the transition framework, the redaction, and every check.',
  group: 'Notes',
  path: 'src/projects/openscout-montage/PRODUCTION_NOTES_DAYLIGHT.md',
})
add({
  key: 'doc:production-notes-refined',
  role: 'document',
  label: 'PRODUCTION_NOTES_REFINED.md — the previous cut',
  group: 'Notes',
  path: 'src/projects/openscout-montage/PRODUCTION_NOTES_REFINED.md',
})
add({
  key: 'doc:production-notes-reimagined',
  role: 'document',
  label: 'PRODUCTION_NOTES_REIMAGINED.md — source map and score provenance',
  description:
    'Still the reference for the dark capture’s source map and the two frame-accurate source findings; this pass did not re-open them.',
  group: 'Notes',
  path: 'src/projects/openscout-montage/PRODUCTION_NOTES_REIMAGINED.md',
})

const payload = {
  slug: SLUG,
  title: 'OpenScout — daylight',
  description:
    'The next preserved iteration: the product met in daylight first, then turned dark on purpose. Four light beats, an authored mode hinge, four dark beats, and a transition framework of typed titles, eased lens arrivals and scheduled chapter hand-overs. Score unchanged, spatial composition unchanged, three delivered formats.',
  brief: [
    'A new iteration, not a patch. The refined cut is untouched, still registered and still',
    'renderable; this film is additive and is reviewed against it.',
    '',
    SYNOPSIS,
    '',
    'WHAT THIS PASS CHANGED:',
    '',
    '1. THE STORY OPENS IN DAYLIGHT. The refined cut began cold, already inside the product and',
    '   already dark. The first product frames are now the airy For You overview and the real',
    '   Appearance panel, both in light mode, from footage that already existed in the earlier',
    '   explainer treatment. No UI was fabricated and no new capture was taken.',
    '',
    '2. DARK IS A TRANSFORMATION, NOT A DEFAULT. Chapter II states "light or dark" on the product’s',
    '   own Mode row and does not cash it. Chapter V returns to that exact row and does: the dark',
    '   surface is REVEALED out of the Mode value chip on a growing circle, and the stage tone turns',
    '   on the same frames. A cross-dissolve was tried first and rejected on a rendered still — a',
    '   white panel cross-fading to a black one spends its midpoint as a flat grey slab with both',
    '   sets of rows ghosted through each other.',
    '',
    '3. A TRANSITION FRAMEWORK, NOT ONE VERB. The refined cut applied opacity uniformly to every',
    '   element at every boundary. Here: chapter titles are TYPED character by character (each glyph',
    '   fades up in place — nothing moves, nothing reflows); the detail lens ARRIVES behind a soft',
    '   top-down wipe with a 1.4% settle and LEAVES on a different, gentler curve; and chapters HAND',
    '   OVER rather than cross-fade — the type and the lens are taken away before the picture',
    '   changes, and the next title starts after it has settled.',
    '',
    '4. THE SPATIAL COMPOSITION IS UNCHANGED, deliberately. The phone is full and fixed, the',
    '   title-and-explanation column is stable, the lens slot is preallocated and top-anchored, and',
    '   there is no camera. No phone motion, no title travel, no recentering, no drift. Motion comes',
    '   from opacity, timing, masks, the type reveal and the lens.',
    '',
    '5. A ROUTING FAILURE IS REDACTED. The light For You capture carries a System row reporting an',
    '   internal routing failure ("Talkie failed to respond. Codex app-server cwd does not exist…").',
    '   Operator direction is that routing conditions are not user-facing product narrative. The feed',
    '   is pixel-static across both of its passes in the capture, so there is no clean alternative',
    '   window; the row is therefore removed and the rows beneath it closed up by exactly its height,',
    '   with the tab bar and status footer left where the capture put them. The strip this frees at',
    '   the bottom of the scroll region was already empty surface, so nothing is invented. Verified',
    '   on a rendered frame, and guarded at source level by the validation script.',
    '',
    '   No literal "active writer" contention text appears anywhere in either capture or in any copy',
    '   in this film — checked against the OpenScout source tree and against both masters.',
    '',
    '6. THE SCORE IS UNCHANGED — and this constrained the grid. Same asset, same 0.92 gain, same',
    '   55.000 s. The film is 33 bars at 144 BPM: 2 preamble + 27 content + 4 outro, and every',
    '   boundary lands on a 50-frame downbeat. The validation script checks all four of those',
    '   against the refined edit rather than taking them on trust.',
    '',
    'SOURCES. Two captures, a day apart, of the same architecture — not two product eras. Both carry',
    'the same All hosts header, the same For You · WORKING NOW feed, the same SCOUT · SETTINGS',
    'inspector, the same composer and the same tab bar; verified on contact sheets before the edit',
    'was written. The hinge depends on it: the light and dark Appearance panels register to the',
    'pixel, so the reveal reads as one panel inverting rather than as two different screens. Two',
    'honest differences across it, both outside the lens rectangle: the inspector rail is ordered',
    'differently between the captures, and the last row reads "v3 navigation" in light against',
    '"Fleet navigation" in dark.',
    '',
    'The refined and reimagined cuts are members of this run, in their own group, so the lineage can',
    'be compared without leaving the dossier. Both remain registered as their own treatments and',
    'render unchanged from their own edit modules.',
  ].join('\n'),
  status: 'review' as const,
  tags: ['openscout', 'daylight', 'montage', 'light-to-dark', 'flagship'],
  groups: [
    {label: 'Film · three formats', description: '55.000 s · 1650 frames · 30 fps', order: 0},
    {
      label: 'Comparison · preserved cuts',
      description: 'The earlier films, kept for A/B review',
      order: 1,
    },
    {label: 'Score', description: '144 BPM, 55.000 s — carried over unchanged', order: 2},
    {label: 'Source captures', description: 'The light and dark masters', order: 3},
    {label: 'Composition & scripts', description: 'The system that produced the film', order: 4},
    {label: 'Brand', order: 5},
    {label: 'Validation', description: 'Media checks and representative frames', order: 6},
    {label: 'Notes', order: 7},
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
