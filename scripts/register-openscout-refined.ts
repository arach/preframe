#!/usr/bin/env bun
/**
 * Registers the OpenScout Reimagined — refined deliverables:
 *
 *   1. Three Treatments in the catalog editor — one per delivered format — so
 *      each is available for review, annotation, compare and the revise flow.
 *   2. One Run, `openscout-reimagined-refined`, that organises the finals, the
 *      unchanged score and its provenance, the source capture, the composition
 *      sources, the validation artefacts, the production notes — and the two
 *      earlier films, kept as members so the A/B comparison the brief asked for
 *      lives in one place rather than across three runs.
 *
 *   bun run scripts/register-openscout-refined.ts
 *   bun run scripts/register-openscout-refined.ts --base http://localhost:3100
 *   bun run scripts/register-openscout-refined.ts --offline   # run only, write the store directly
 *   bun run scripts/register-openscout-refined.ts --run-only
 *   bun run scripts/register-openscout-refined.ts --treatments-only
 *
 * Idempotent: treatments carry a stable idempotencyKey and the run upserts on
 * its slug with every member keyed, so a re-run after a re-render upgrades
 * members in place rather than duplicating them. Nothing is moved or renamed —
 * the treatment intake only ever copyFile()s, and the run points at canonical
 * paths. The earlier films' own treatments and runs are not touched.
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Run } from '@/lib/runs'
import { formatRunHandoff, submitAgentRun, type RunLinks } from '@/services/runs/intake'
import type { RunItemInput } from '@/services/runs/store'

const argv = process.argv.slice(2)
const OFFLINE = argv.includes('--offline')
const RUN_ONLY = argv.includes('--run-only')
const TREATMENTS_ONLY = argv.includes('--treatments-only')
const baseArg = argv.indexOf('--base')
const BASE = baseArg !== -1 ? argv[baseArg + 1] : 'http://localhost:3100'

const SLUG = 'openscout-reimagined-refined'
const OUT = 'out/openscout-refined'
const PRIOR_OUT = 'out/openscout-reimagined'
const FIRST_OUT = 'out/openscout'
const FRAMES = 1650
const DURATION = 55.0

type Format = {
  format: '16:9' | '9:16' | '1:1'
  suffix: string
  label: string
  use: string
}

const FORMATS: Format[] = [
  { format: '16:9', suffix: '1920x1080', label: '16:9 landscape master', use: 'site hero, YouTube, decks, press' },
  { format: '9:16', suffix: '1080x1920', label: '9:16 vertical', use: 'Stories, Reels, Shorts, TikTok' },
  { format: '1:1', suffix: '1080x1080', label: '1:1 square', use: 'in-feed social, LinkedIn, X' },
]

const SYNOPSIS = [
  'The reimagined film, refined: the first montage’s ceremony and presentation applied to the',
  'redesigned era’s footage, locked phone and improved assets. Two bars of authored opening —',
  'mark, wordmark, rule, and "A local-first control plane for coding agents." — hand over to',
  'nine product beats: COMMAND (an agent has answered) → INDEX (the Scout broker conversation',
  'index) → SEE (For You · WORKING NOW) → START (a session from HOST · Arachs Mac mini) →',
  'CHOOSE (the picker moving from Claude · Opus 5 to Codex · Sonnet 4.6, effort on MEDIUM) →',
  'OBSERVE (five unbroken seconds of the live Tail) → BROWSE (Projects · Workspaces) →',
  'PRESENT (the real Presentation control cycling Scout, Messages, WhatsApp, Original) →',
  'RETURN (back to the thread) → the off-white #F7F4EA mark and the first montage’s payoff',
  'hierarchy.',
  '',
  'Every chapter is now ONE standing composition: the phone, the type column and the detail-lens',
  'slot are all fixed, and elements only fade in and out of them. Nothing recenters, slides',
  'between layout states, or negotiates for position — the title travel of the previous cut is',
  'gone. Typography is quieter: a small mono index line for metadata, a sentence-case title at',
  'regular weight, and a short explanatory line naming what is on screen. Mint carries rules and',
  'ticks only, never a word of the message.',
  '',
  'The score is UNCHANGED from the reimagined cut — same asset, same gain, same 55.000 s. The',
  'opening was paid for out of picture rather than added to runtime: chapters I and IX each give',
  'up one bar, so the film is still 33 bars and every boundary still lands on a downbeat.',
].join(' ')

// ---------------------------------------------------------------------------
// 1. Treatments — one per delivered format
// ---------------------------------------------------------------------------

async function registerTreatments() {
  for (const fmt of FORMATS) {
    const filename = `openscout-refined-${fmt.suffix}.mp4`
    const path = resolve(OUT, filename)
    if (!existsSync(path)) throw new Error(`Missing deliverable: ${path}`)

    const payload = {
      mode: 'treatment',
      compositionId: `openscout-refined-${fmt.suffix}`,
      name: `OpenScout Reimagined · refined — ${fmt.label} (55s, ${fmt.suffix.replace('x', '×')})`,
      prompt: `${SYNOPSIS}\n\nDelivered ${fmt.format} at ${fmt.suffix.replace('x', '×')} for ${fmt.use}. Recomposed rather than cropped: device placement, type column and lens slot are each defined per aspect ratio in normalised stage units, as one locked layout rather than a pair of states to travel between.`,
      outputs: [{ path, filename }],
      params: {
        aspectRatio: fmt.format,
        durationSec: DURATION,
        fps: 30,
        frames: FRAMES,
        resolution: fmt.suffix.replace('x', '×'),
      },
      idempotencyKey: `openscout-refined-${fmt.suffix}-2026-08-13`,
    }

    const res = await fetch(`${BASE}/api/agents/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
const add = (item: RunItemInput) => items.push({ ...item, order: order++ })

for (const fmt of FORMATS) {
  const isHero = fmt.format === '16:9'
  add({
    key: `final:${fmt.suffix}`,
    role: isHero ? 'final' : 'variant',
    label: `Refined — ${fmt.label}`,
    description: isHero
      ? 'The landscape master. Authored opening, nine chapters on one locked layout, eight detail-lens beats, the first montage’s branded payoff.'
      : `Recomposed for ${fmt.use}.`,
    group: 'Film · three formats',
    preferred: isHero,
    path: `${OUT}/openscout-refined-${fmt.suffix}.mp4`,
    meta: {
      format: fmt.format,
      resolution: fmt.suffix.replace('x', '×'),
      durationSec: DURATION,
      fps: 30,
      frames: FRAMES,
    },
  })
}

// -- The two films this one is reviewed against ------------------------------
for (const fmt of FORMATS) {
  add({
    key: `compare:reimagined:${fmt.suffix}`,
    role: 'reference',
    label: `Reimagined (previous cut) — ${fmt.label}`,
    description:
      fmt.format === '16:9'
        ? 'The cut this pass refines. Kept intact and still renderable: no preamble, centred titles that travel into position as the lens arrives, and the "command surface" outro line.'
        : undefined,
    group: 'Comparison · preserved cuts',
    preferred: fmt.format === '16:9',
    path: `${PRIOR_OUT}/openscout-reimagined-${fmt.suffix}.mp4`,
    meta: { format: fmt.format, durationSec: DURATION, frames: FRAMES },
  })
}
for (const fmt of FORMATS) {
  add({
    key: `compare:montage:${fmt.suffix}`,
    role: 'reference',
    label: `First montage — ${fmt.label}`,
    description:
      fmt.format === '16:9'
        ? 'The original film, and the source of the ceremony, presentation and outro hierarchy this pass restores.'
        : undefined,
    group: 'Comparison · preserved cuts',
    path: `${FIRST_OUT}/openscout-montage-${fmt.suffix}.mp4`,
    meta: { format: fmt.format },
  })
}

add({
  key: 'score:reimagined',
  role: 'score',
  label: 'Reimagined score — 55.000 s, 144 BPM — UNCHANGED',
  description:
    'Carried over from the reimagined cut exactly as it stands, on operator direction: same asset, same 0.92 gain, same 55.000 s. Not re-cut, not re-mastered, not regenerated. The refined picture was built around it — the authored opening is paid for out of chapters I and IX rather than added to runtime, so the film is still 33 bars at 144 BPM.',
  group: 'Score',
  preferred: true,
  path: 'public/tracks/openscout/openscout-reimagined-score.wav',
  meta: { bpm: 144, durationSec: DURATION, lufs: -18.0, truePeakDbfs: -1.5, changed: false },
})
add({
  key: 'score:reimagined-provenance',
  role: 'document',
  label: 'Score provenance',
  description:
    'Window, tempo handling, mastering chain, measured loudness, and the stated ~82% material overlap with the V3 Edit A master.',
  group: 'Score',
  path: 'public/tracks/openscout/openscout-reimagined-score.provenance.json',
})

add({
  key: 'source:reimagined-cfr30',
  role: 'source',
  label: 'Reimagined capture — CFR 30 fps',
  description:
    'The only picture source in the film. 1178×2556, 3286 frames, 109.533 s. Every EDL timecode was mapped on this file.',
  group: 'Source capture',
  preferred: true,
  path: 'public/demos/openscout/openscout-reimagined-dark-device-master-cfr30.mp4',
  meta: { durationSec: 109.533333, frames: 3286, resolution: '1178×2556' },
})

add({
  key: 'composition:edl',
  role: 'composition',
  label: 'edit-refined.ts — the EDL and the locked formats',
  description:
    'The retimed grid, the preamble, the title-plus-explanation copy, the restored outro hierarchy, and REFINED_FORMATS — one standing layout per aspect ratio, with no base/lensed pair to travel between.',
  group: 'Composition & scripts',
  preferred: true,
  path: 'src/projects/openscout-montage/edit-refined.ts',
})
add({
  key: 'composition:refined-component',
  role: 'composition',
  label: 'OpenScoutRefined.tsx — the refined composition',
  description:
    'Opening lockup, fixed type column, top-anchored lens slot, quieter typography, and the four-step branded ending. Opacity is the whole reveal vocabulary.',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/OpenScoutRefined.tsx',
})
add({
  key: 'composition:montage',
  role: 'composition',
  label: 'OpenScoutMontage.tsx — the earlier films’ composition',
  description:
    'Unchanged in behaviour; the shared primitives (stage, phone shell, capture stack, wire mark) are now exported so the refined film reuses rather than reimplements them.',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/OpenScoutMontage.tsx',
})
add({
  key: 'composition:edit-shared',
  role: 'composition',
  label: 'edit.ts — shared vocabulary, sources and placement',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/edit.ts',
})
add({
  key: 'composition:edit-reimagined',
  role: 'composition',
  label: 'edit-reimagined.ts — the previous cut’s EDL, preserved',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/edit-reimagined.ts',
})
add({
  key: 'composition:entry',
  role: 'composition',
  label: 'Remotion entry — twelve registered compositions',
  description: 'Nine for the three preserved films, three for the refined one.',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/openscout-montage-entry.tsx',
})
add({
  key: 'composition:render-script',
  role: 'composition',
  label: 'render-openscout-refined.ts — render + BT.709 finish',
  group: 'Composition & scripts',
  path: 'scripts/render-openscout-refined.ts',
})

add({
  key: 'brand:wire-mark',
  role: 'logo',
  label: 'OpenScout wire mark — canonical #F7F4EA',
  description: 'Inlined in the composition; the film never renders a green or mint mark.',
  group: 'Brand',
  preferred: true,
  path: 'public/brand/openscout-wire-mark.svg',
})

add({
  key: 'validation:script',
  role: 'validation',
  label: 'validate-openscout-refined.ts — media checks',
  description:
    'Resolution, duration, frame count, codec, BT.709 signalling, faststart, AAC, black-frame scan, loudness, a geometric check that the mark is off-white, and a source-level check that the score asset, gain, runtime and downbeat grid are unchanged from the reimagined cut.',
  group: 'Validation',
  preferred: true,
  path: 'scripts/validate-openscout-refined.ts',
})
add({
  key: 'validation:report',
  role: 'validation',
  label: 'VALIDATION.md — check results',
  group: 'Validation',
  path: `${OUT}/VALIDATION.md`,
})
// Representative frames from the landscape master: the opening, the handover,
// each act, and the branded ending as it builds.
for (const frame of [2, 40, 70, 96, 110, 150, 275, 425, 575, 750, 925, 1075, 1250, 1400, 1470, 1500, 1540, 1600, 1645]) {
  add({
    key: `validation:f${frame}`,
    role: 'validation',
    label: `Frame ${frame}`,
    group: 'Validation',
    path: `${OUT}/validation-stills/openscout-refined-1920x1080-f${String(frame).padStart(4, '0')}.jpg`,
    meta: { frame, format: '16:9' },
  })
}

add({
  key: 'doc:production-notes',
  role: 'document',
  label: 'PRODUCTION_NOTES_REFINED.md',
  description:
    'The revised structure, the retimed grid, the layout lock, the typography pass, and the explicit statement that the score was retained unchanged.',
  group: 'Notes',
  preferred: true,
  path: 'src/projects/openscout-montage/PRODUCTION_NOTES_REFINED.md',
})
add({
  key: 'doc:production-notes-reimagined',
  role: 'document',
  label: 'PRODUCTION_NOTES_REIMAGINED.md — the previous cut',
  description: 'Source map, the two frame-accurate source findings, and the score provenance. Still the reference for all of those; this pass did not re-open them.',
  group: 'Notes',
  path: 'src/projects/openscout-montage/PRODUCTION_NOTES_REIMAGINED.md',
})
add({
  key: 'doc:capture-notes',
  role: 'document',
  label: 'CAPTURE_NOTES.md — the capture record',
  group: 'Notes',
  path: 'docs/openscout-reimagined/CAPTURE_NOTES.md',
})
add({
  key: 'doc:brief',
  role: 'document',
  label: 'PREFRAME_REFINEMENT_BRIEF.md — the brief this pass answers',
  group: 'Notes',
  path: '/Users/art/dev/openscout/docs/artifacts/ios-reimagined-capture-2026-08-13/PREFRAME_REFINEMENT_BRIEF.md',
})

const payload = {
  slug: SLUG,
  title: 'OpenScout Reimagined — refined',
  description:
    'The reimagined film refined: an authored opening, one locked layout per format, quieter editorial typography, and the first montage’s branded payoff. Score unchanged. Three delivered formats, with the two earlier cuts kept alongside for A/B review.',
  brief: [
    'A refinement pass over the reimagined cut, not a new film. The footage, the source map, the',
    'locked device framing and the score are all carried over; what changed is how the film opens,',
    'how it composes each chapter, how it sets type, and how it ends.',
    '',
    SYNOPSIS,
    '',
    'THE FIVE THINGS THIS PASS CHANGED:',
    '',
    '1. AN AUTHORED OPENING. The previous cut started cold, already inside the product. Two bars',
    '   now carry a brand breath — mark, wordmark, a rule that draws, and the positioning line —',
    '   which crossfades into the phone. No orbit, no logo animation, no camera move.',
    '',
    '2. THE LAYOUT IS LOCKED. The previous cut interpolated between a `base` and a `lensed` layout',
    '   state, so titles began centred and travelled upward as the detail lens faded in. Its own',
    '   production notes flagged this (§4.1) as a known characteristic of the shared composition.',
    '   The refined film has ONE standing layout per format: phone, type column and lens slot are',
    '   fixed, and opacity is the entire reveal vocabulary. Both the type column and the lens are',
    '   anchored by their top edge, so chapters with different title lengths and different lens',
    '   aspect ratios still put every element in exactly the same place.',
    '',
    '3. QUIETER TYPOGRAPHY. The mint all-caps chapter eyebrow is now a small faint mono index line;',
    '   the headline is sentence-case at regular weight with tight tracking; and each chapter gained',
    '   a short explanatory line naming what is literally on screen. Mint appears on rules and ticks',
    '   only. Type sizes are tuned per format so the headline stays legible in landscape, vertical',
    '   and square without shouting in any of them.',
    '',
    '4. THE ESTABLISHED POSITIONING. The vague "A command surface for the agents already working."',
    '   is gone. The ending follows the first montage’s hierarchy exactly: off-white #F7F4EA mark',
    '   and OPENSCOUT, then "A local-first control plane for coding agents.", then',
    '   "CLAUDE · CODEX · GROK · KIMI — ON YOUR OWN MACS", then "EARLY · LOCAL DEVELOPER PILOTS".',
    '',
    '5. THE SCORE IS UNCHANGED — and this constrained everything else. The operator’s correction is',
    '   binding: the latest reimagined cue is the better one and stays exactly as it is. Because the',
    '   cue is fixed at 55.000 s, the opening could not extend the film; its two bars were taken out',
    '   of picture instead. Chapters I and IX each give up one bar — I because the preamble now does',
    '   its arrival work, IX because three bars of a lens-free bookend was the loosest passage in the',
    '   cut. Every other chapter keeps its exact source window, the film is still 33 bars, and every',
    '   boundary still lands on a downbeat. The validation script checks this at source level rather',
    '   than taking it on trust.',
    '',
    'WHAT WAS DELIBERATELY NOT TOUCHED: the redesigned-era footage and its mapped source windows, the',
    'essentially stationary device framing, the purposeful detail lenses, and the factual limits on',
    'what the film claims. The two findings from the original source audit still hold and still shape',
    'the edit — there is no "Split" presentation in this build, and the two conversation passages are',
    'pixel-identical, so the bookend claims nothing more than being the same thread.',
    '',
    'The previous reimagined cut and the first montage are members of this run, in their own group,',
    'so the three can be compared without leaving the dossier. Both remain registered as their own',
    'treatments and render unchanged from their own edit modules.',
  ].join('\n'),
  status: 'review' as const,
  tags: ['openscout', 'reimagined', 'refined', 'montage', 'flagship'],
  groups: [
    { label: 'Film · three formats', description: '55.000 s · 1650 frames · 30 fps', order: 0 },
    { label: 'Comparison · preserved cuts', description: 'The two earlier films, kept for A/B review', order: 1 },
    { label: 'Score', description: '144 BPM, 55.000 s — carried over unchanged', order: 2 },
    { label: 'Source capture', description: 'The single 2026-08-13 reimagined master', order: 3 },
    { label: 'Composition & scripts', description: 'The system that produced the film', order: 4 },
    { label: 'Brand', order: 5 },
    { label: 'Validation', description: 'Media checks and representative frames', order: 6 },
    { label: 'Notes', order: 7 },
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
    headers: { 'Content-Type': 'application/json' },
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
