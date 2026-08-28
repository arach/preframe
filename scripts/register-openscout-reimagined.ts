#!/usr/bin/env bun
/**
 * Registers the OpenScout Reimagined deliverables:
 *
 *   1. Three Treatments in the catalog editor — one per delivered format — so
 *      each is available for review, annotation, compare and the revise flow.
 *   2. One Run, `openscout-reimagined`, that organises the finals, the score and
 *      its provenance, the source capture, the composition sources, the
 *      validation artefacts and the production notes.
 *
 *   bun run scripts/register-openscout-reimagined.ts
 *   bun run scripts/register-openscout-reimagined.ts --base http://localhost:3100
 *   bun run scripts/register-openscout-reimagined.ts --offline   # run only, write the store directly
 *   bun run scripts/register-openscout-reimagined.ts --run-only
 *   bun run scripts/register-openscout-reimagined.ts --treatments-only
 *
 * Idempotent: treatments carry a stable idempotencyKey and the run upserts on
 * its slug with every member keyed, so a re-run after a re-render upgrades
 * members in place rather than duplicating them. Nothing is moved or renamed —
 * the treatment intake only ever copyFile()s, and the run points at canonical
 * paths.
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

const SLUG = 'openscout-reimagined'
const OUT = 'out/openscout-reimagined'
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
  'OpenScout as the command surface for agent work, in nine beats and 55.000 s.',
  'COMMAND (an agent has answered, on the redesigned thread) → INDEX (the Scout broker',
  'conversation index) → SEE (For You · WORKING NOW, live across hosts and agents) →',
  'START (a new session from HOST · Arachs Mac mini and a project, 68 projects behind it) →',
  'CHOOSE (the real agent/model picker: the selection moves from Claude · Opus 5 to',
  'Codex · Sonnet 4.6 on screen, with the effort scale on MEDIUM) → OBSERVE (five unbroken',
  'seconds of the live Tail — reasoning, tool calls, results, task complete) → BROWSE',
  '(Projects · Workspaces with host, agents and last-active) → PRESENT (the real Presentation',
  'control cycling its four real values: Scout, Messages, WhatsApp, Original) → RETURN (back',
  'to the thread) → off-white #F7F4EA mark.',
  '',
  'Cut entirely from the 2026-08-13 reimagined capture; no V3 or legacy footage. Device',
  'framing is locked — no orbit, drift, pulse or pose change; the detail lens is the only',
  'thing that moves. 33 bars on a 50-frame grid at 144 BPM, so every chapter boundary lands',
  'on a downbeat. Claims stay inside coordination and reachability.',
].join(' ')

// ---------------------------------------------------------------------------
// 1. Treatments — one per delivered format
// ---------------------------------------------------------------------------

async function registerTreatments() {
  for (const fmt of FORMATS) {
    const filename = `openscout-reimagined-${fmt.suffix}.mp4`
    const path = resolve(OUT, filename)
    if (!existsSync(path)) throw new Error(`Missing deliverable: ${path}`)

    const payload = {
      mode: 'treatment',
      compositionId: `openscout-reimagined-${fmt.suffix}`,
      name: `OpenScout Reimagined — ${fmt.label} (55s, ${fmt.suffix.replace('x', '×')})`,
      prompt: `${SYNOPSIS}\n\nDelivered ${fmt.format} at ${fmt.suffix.replace('x', '×')} for ${fmt.use}. Recomposed rather than cropped: device size and position, lens size and position, and type placement are all driven per aspect ratio in normalised stage units.`,
      outputs: [{ path, filename }],
      params: {
        aspectRatio: fmt.format,
        durationSec: DURATION,
        fps: 30,
        frames: FRAMES,
        resolution: fmt.suffix.replace('x', '×'),
      },
      idempotencyKey: `openscout-reimagined-${fmt.suffix}-2026-08-13`,
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
    label: `Reimagined — ${fmt.label}`,
    description: isHero
      ? 'The landscape master. Nine chapters, 33 bars, locked device, eight detail-lens beats.'
      : `Recomposed for ${fmt.use}.`,
    group: 'Film · three formats',
    preferred: isHero,
    path: `${OUT}/openscout-reimagined-${fmt.suffix}.mp4`,
    meta: {
      format: fmt.format,
      resolution: fmt.suffix.replace('x', '×'),
      durationSec: DURATION,
      fps: 30,
      frames: FRAMES,
    },
  })
}

add({
  key: 'score:reimagined',
  role: 'score',
  label: 'Reimagined score — 55.000 s, 144 BPM',
  description:
    'Eerie and spacious with a restrained pulse. Exactly the length of picture, to the sample. A new master of an existing raw MiniMax generation — fresh generation was blocked on a missing MINIMAX_API_KEY.',
  group: 'Score',
  preferred: true,
  path: 'public/tracks/openscout/openscout-reimagined-score.wav',
  meta: { bpm: 144, durationSec: DURATION, lufs: -18.0, truePeakDbfs: -1.5 },
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
  key: 'score:masterer',
  role: 'composition',
  label: 'master-openscout-reimagined-score.ts',
  group: 'Score',
  path: 'scripts/master-openscout-reimagined-score.ts',
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
  label: 'edit-reimagined.ts — the EDL',
  description:
    'Nine chapters, eight lenses, every cut and rectangle with the frame-accurate reasoning behind it.',
  group: 'Composition & scripts',
  preferred: true,
  path: 'src/projects/openscout-montage/edit-reimagined.ts',
})
add({
  key: 'composition:montage',
  role: 'composition',
  label: 'OpenScoutMontage.tsx — composition system',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/OpenScoutMontage.tsx',
})
add({
  key: 'composition:edit-shared',
  role: 'composition',
  label: 'edit.ts — shared vocabulary, sources and formats',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/edit.ts',
})
add({
  key: 'composition:entry',
  role: 'composition',
  label: 'Remotion entry — nine registered compositions',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/openscout-montage-entry.tsx',
})
add({
  key: 'composition:render-script',
  role: 'composition',
  label: 'render-openscout-reimagined.ts — render + BT.709 finish',
  group: 'Composition & scripts',
  path: 'scripts/render-openscout-reimagined.ts',
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
  label: 'validate-openscout-reimagined.ts — media checks',
  description:
    'Resolution, duration, frame count, codec, BT.709 signalling, faststart, AAC, black-frame scan, loudness, and a sampled check that the mark is off-white.',
  group: 'Validation',
  preferred: true,
  path: 'scripts/validate-openscout-reimagined.ts',
})
add({
  key: 'validation:report',
  role: 'validation',
  label: 'VALIDATION.md — check results',
  group: 'Validation',
  path: `${OUT}/VALIDATION.md`,
})
// One representative frame per act, from the landscape master.
for (const frame of [75, 225, 375, 525, 700, 870, 1020, 1200, 1380, 1560]) {
  add({
    key: `validation:f${frame}`,
    role: 'validation',
    label: `Frame ${frame}`,
    group: 'Validation',
    path: `${OUT}/validation-stills/openscout-reimagined-1920x1080-f${String(frame).padStart(4, '0')}.jpg`,
    meta: { frame, format: '16:9' },
  })
}

add({
  key: 'doc:production-notes',
  role: 'document',
  label: 'PRODUCTION_NOTES_REIMAGINED.md',
  description:
    'Source map, script and EDL, direction, score provenance, deliverables, and the two source findings that changed the edit.',
  group: 'Notes',
  preferred: true,
  path: 'src/projects/openscout-montage/PRODUCTION_NOTES_REIMAGINED.md',
})
add({
  key: 'doc:capture-notes',
  role: 'document',
  label: 'CAPTURE_NOTES.md — the capture record',
  group: 'Notes',
  path: 'docs/openscout-reimagined/CAPTURE_NOTES.md',
})

// -- Source-audit evidence --------------------------------------------------
for (const n of ['01', '02', '03', '04', '05']) {
  add({
    key: `audit:contact-sheet-${n}`,
    role: 'reference',
    label: `Source contact sheet ${n}`,
    description: n === '01' ? 'The whole 109.533 s take at 1 fps with burnt-in timestamps.' : undefined,
    group: 'Source audit',
    preferred: n === '01',
    path: `docs/openscout-reimagined/source-contact-sheet-${n}.jpg`,
  })
}
add({
  key: 'audit:presentation-cycle-01',
  role: 'reference',
  label: 'Presentation cycle — 73–77 s at 6 fps',
  description: 'The CHAT inspector arriving on Scout. Cropped to the settings rows.',
  group: 'Source audit',
  path: 'docs/openscout-reimagined/presentation-cycle-01.jpg',
})
add({
  key: 'audit:presentation-cycle-02',
  role: 'reference',
  label: 'Presentation cycle — 77–81 s at 6 fps',
  description:
    'Scout → Messages → WhatsApp → Original, with the exact frame each value changes on. No Split value exists in this build.',
  group: 'Source audit',
  path: 'docs/openscout-reimagined/presentation-cycle-02.jpg',
})
add({
  key: 'audit:bookend-diff',
  role: 'reference',
  label: 'Bookend difference blend — pure black',
  description:
    't=5.000 s differenced against t=100.000 s. The two conversation passages are pixel-identical, so the capture does not re-render the thread in different presentations.',
  group: 'Source audit',
  path: 'docs/openscout-reimagined/bookend-difference-blend.jpg',
})

const payload = {
  slug: SLUG,
  title: 'OpenScout Reimagined — flagship film',
  description:
    'A 55-second flagship film for the redesigned OpenScout era, cut entirely from the 2026-08-13 reimagined capture. Three delivered formats.',
  brief: [
    'A new film, not a continuation of V3: a fresh source map, a fresh narrative, a fresh',
    'grid and a score mastered for this runtime. Every frame comes from one capture.',
    '',
    SYNOPSIS,
    '',
    'TWO FINDINGS FROM THE FRAME-ACCURATE SOURCE AUDIT, both of which changed the edit:',
    '',
    '1. There is no "Split" presentation in this build. The brief and CAPTURE_NOTES.md both',
    '   name Split; read off the source at 6 fps the control actually cycles Scout →',
    '   Messages → WhatsApp → Original. Chapter VIII plays the four values the product',
    '   really offers rather than inventing the fifth.',
    '',
    '2. The thread is not re-rendered in different presentations. A full-frame difference',
    '   blend of t=5.000 s against t=100.000 s returns pure black — the two conversation',
    '   passages are pixel-identical. The capture demonstrates the selector, not the',
    '   re-render, and the film claims only that much. Showing side-by-side presentation',
    '   differences needs a new capture: set each value and record the same thread four',
    '   times. That is the single highest-value addition to this material.',
    '',
    'One further limitation worth knowing: the score is a new master of an existing raw',
    'MiniMax generation, because fresh generation was blocked on a missing MINIMAX_API_KEY.',
    'It shares roughly 82% of its material with the V3 Edit A master. Setting the key and',
    're-running the generator would fix this; swapping the cue is a one-line change plus a',
    're-render, with no impact on picture.',
  ].join('\n'),
  status: 'review' as const,
  tags: ['openscout', 'reimagined', 'montage', 'flagship'],
  groups: [
    { label: 'Film · three formats', description: '55.000 s · 1650 frames · 30 fps', order: 0 },
    { label: 'Score', description: '144 BPM, 55.000 s, sample-locked to picture', order: 1 },
    { label: 'Source capture', description: 'The single 2026-08-13 reimagined master', order: 2 },
    { label: 'Composition & scripts', description: 'The system that produced the film', order: 3 },
    { label: 'Brand', order: 4 },
    { label: 'Validation', description: 'Media checks and representative frames', order: 5 },
    { label: 'Notes', order: 6 },
    { label: 'Source audit', description: 'The frame-accurate evidence behind the EDL', order: 7 },
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
