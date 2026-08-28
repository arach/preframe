#!/usr/bin/env bun
/**
 * Seed the OpenScout V3 montage Run.
 *
 *   bun run scripts/seed-openscout-v3-run.ts
 *   bun run scripts/seed-openscout-v3-run.ts --base http://localhost:3100
 *   bun run scripts/seed-openscout-v3-run.ts --offline   # write the store directly
 *
 * Idempotent by design: the run upserts on its slug and every member upserts on
 * a stable key, so re-running after a render lands upgrades those members from
 * `pending` to `ready` in place — same ids, same deep links.
 *
 * Nothing is copied. The run points at the canonical deliverables in
 * `out/openscout-v3/`, the staged masters in `public/demos/`, the scores in
 * `public/tracks/`, and the composition source in `src/` and `scripts/`.
 */

import type { Run } from '@/lib/runs'
import { formatRunHandoff, submitAgentRun, type RunLinks } from '@/services/runs/intake'
import type { RunItemInput } from '@/services/runs/store'

const argv = process.argv.slice(2)
const OFFLINE = argv.includes('--offline')
const baseArg = argv.indexOf('--base')
const BASE = baseArg !== -1 ? argv[baseArg + 1] : 'http://localhost:3100'

const SLUG = 'openscout-v3-montage'
const OUT = 'out/openscout-v3'

// ---------------------------------------------------------------------------
// The two edits and their three delivered formats each
// ---------------------------------------------------------------------------

type Format = { format: '16:9' | '9:16' | '1:1'; suffix: string; variantLabel: string }

const FORMATS: Format[] = [
  { format: '16:9', suffix: '1920x1080', variantLabel: '16:9' },
  { format: '9:16', suffix: '1080x1920', variantLabel: '9:16' },
  { format: '1:1', suffix: '1080x1080', variantLabel: '1:1' },
]

type Edit = {
  id: string
  short: string
  group: string
  groupLabel: string
  groupDescription: string
  title: string
  note: string
  /** The format that leads for this edit. */
  hero: Format['format']
  editSource: string
  score: string
}

const EDITS: Edit[] = [
  {
    id: 'openscout-v3-dark-hero',
    short: 'Edit A · Dark hero',
    group: 'edit-a-dark-hero',
    groupLabel: 'Edit A · Dark hero (beat-led)',
    groupDescription: 'Nine chapters on a 50-frame bar grid, locked to a 144 BPM bed',
    title: 'Edit A · Dark hero',
    note:
      'Beat-led. Every chapter is a whole number of bars and every boundary lands on a downbeat. 4-frame dissolves, five detail-lens beats, restrained settle-and-rest phone motion.',
    hero: '16:9',
    editSource: 'src/projects/openscout-montage/edit-a.ts',
    score: 'public/tracks/openscout/openscout-v3-beat-score.wav',
  },
  {
    id: 'openscout-v3-light-dark',
    short: 'Edit B · Light ↔ Dark',
    group: 'edit-b-light-dark',
    groupLabel: 'Edit B · Light ↔ Dark (ambient)',
    groupDescription: 'Opens in light mode and turns to dark inside the product’s own Appearance inspector',
    title: 'Edit B · Light ↔ Dark',
    note:
      'Ambient. The turn is the whole point: chapter V dissolves the light Settings pane to the dark one on the same Mode row, with the stage tone travelling with it. 24-frame dissolves, longer holds.',
    hero: '16:9',
    editSource: 'src/projects/openscout-montage/edit-b.ts',
    score: 'public/tracks/openscout/openscout-montage-score.wav',
  },
]

/** Representative validation frames — one chapter arrival per act, not all 48. */
const VALIDATION_FRAMES = [40, 300, 700, 1060, 1280]

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

const items: RunItemInput[] = []
let order = 0
const add = (item: RunItemInput) => items.push({ ...item, order: order++ })

// -- Finals, per edit -------------------------------------------------------
for (const edit of EDITS) {
  for (const fmt of FORMATS) {
    const isHero = fmt.format === edit.hero
    add({
      key: `${edit.id}:${fmt.suffix}`,
      role: isHero ? 'final' : 'variant',
      label: `${edit.short} — ${fmt.variantLabel}`,
      description: isHero ? edit.note : undefined,
      group: edit.groupLabel,
      preferred: isHero,
      path: `${OUT}/${edit.id}-${fmt.suffix}.mp4`,
      meta: {
        format: fmt.format,
        variantLabel: fmt.variantLabel,
        resolution: fmt.suffix.replace('x', '×'),
        durationSec: 45,
        fps: 30,
        frames: 1350,
      },
    })
  }
}

// -- Score ------------------------------------------------------------------
add({
  key: 'score:v3-beat',
  role: 'score',
  label: 'Edit A score — V3 beat bed (144 BPM)',
  description:
    'Fresh MiniMax generation, nudged to exactly 144.000 BPM so one bar is 50 frames at 30 fps.',
  group: 'Score',
  preferred: true,
  path: 'public/tracks/openscout/openscout-v3-beat-score.wav',
  meta: { bpm: 144, usedBy: 'Edit A' },
})
add({
  key: 'score:ambient',
  role: 'score',
  label: 'Edit B score — eerie/spacious bed',
  description: 'The existing montage score, reused unchanged for the ambient edit.',
  group: 'Score',
  path: 'public/tracks/openscout/openscout-montage-score.wav',
  meta: { usedBy: 'Edit B' },
})
add({
  key: 'score:ambient-mp3',
  role: 'reference',
  label: 'Edit B score — mp3 delivery copy',
  group: 'Score',
  path: 'public/tracks/openscout/openscout-montage-score.mp3',
})
add({
  key: 'score:v3-beat-provenance',
  role: 'document',
  label: 'Beat score provenance',
  description: 'Why a new track was generated instead of reusing the ambient bed.',
  group: 'Score',
  path: 'public/tracks/openscout/openscout-v3-beat-score.provenance.json',
})
add({
  key: 'score:ambient-provenance',
  role: 'document',
  label: 'Ambient score provenance',
  group: 'Score',
  path: 'public/tracks/openscout/openscout-montage-score.provenance.json',
})

// -- Source captures --------------------------------------------------------
add({
  key: 'source:dark-cfr30',
  role: 'source',
  label: 'Dark master — CFR 30 fps',
  description: 'Every timecode in both EDLs refers to this file, not the VFR original.',
  group: 'Source captures',
  path: 'public/demos/openscout/openscout-nav-dark-v3-cfr30.mp4',
  meta: { usedBy: 'Edit A, Edit B', durationSec: 122.935 },
})
add({
  key: 'source:light-cfr30',
  role: 'source',
  label: 'Light master — CFR 30 fps',
  group: 'Source captures',
  path: 'public/demos/openscout/openscout-nav-light-v3-cfr30.mp4',
  meta: { usedBy: 'Edit B', durationSec: 105.432 },
})
add({
  key: 'source:picker-capture',
  role: 'source',
  label: 'Original iOS capture — agent/model picker',
  description:
    'Neither V3 master opens the picker sheet; the CHOOSE beat in both films comes from here.',
  group: 'Source captures',
  path: 'public/demos/openscout/openscout-ios-2026-08-12-cfr30.mp4',
  meta: { usedBy: 'Edit A, Edit B' },
})

// -- Composition & scripts --------------------------------------------------
add({
  key: 'composition:montage',
  role: 'composition',
  label: 'OpenScoutMontage.tsx — composition system',
  description: 'Shared stage, phone rig, lens, dissolve and tone machinery for both edits.',
  group: 'Composition & scripts',
  preferred: true,
  path: 'src/projects/openscout-montage/OpenScoutMontage.tsx',
})
for (const edit of EDITS) {
  add({
    key: `composition:${edit.id}-edl`,
    role: 'composition',
    label: `${edit.short} — EDL`,
    group: 'Composition & scripts',
    path: edit.editSource,
  })
}
add({
  key: 'composition:edit-shared',
  role: 'composition',
  label: 'edit.ts — shared edit vocabulary',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/edit.ts',
})
add({
  key: 'composition:entry',
  role: 'composition',
  label: 'Remotion entry — six registered compositions',
  group: 'Composition & scripts',
  path: 'src/projects/openscout-montage/openscout-montage-entry.tsx',
})
add({
  key: 'composition:render-script',
  role: 'composition',
  label: 'render-openscout-v3.ts — render + BT.709 finish',
  description: 'Renders to _raw/, then a lossless remux completes colour signalling and faststart.',
  group: 'Composition & scripts',
  path: 'scripts/render-openscout-v3.ts',
})
add({
  key: 'composition:score-script-beat',
  role: 'composition',
  label: 'generate-montage-score-v3-beat.ts',
  group: 'Composition & scripts',
  path: 'scripts/generate-montage-score-v3-beat.ts',
})
add({
  key: 'composition:score-script',
  role: 'composition',
  label: 'generate-montage-score.ts',
  group: 'Composition & scripts',
  path: 'scripts/generate-montage-score.ts',
})

// -- Brand ------------------------------------------------------------------
add({
  key: 'brand:wire-mark',
  role: 'logo',
  label: 'OpenScout wire mark',
  description: 'The real mark, used in both films’ outro.',
  group: 'Brand',
  preferred: true,
  path: 'public/brand/openscout-wire-mark.svg',
})

// -- Validation -------------------------------------------------------------
add({
  key: 'validation:script',
  role: 'validation',
  label: 'validate-openscout-v3.ts — media checks',
  description:
    'Resolution, duration, frame count, codec, BT.709 signalling, faststart, AAC, black-frame scan, loudness.',
  group: 'Validation',
  preferred: true,
  path: 'scripts/validate-openscout-v3.ts',
})
for (const edit of EDITS) {
  for (const frame of VALIDATION_FRAMES) {
    add({
      key: `validation:${edit.id}-f${frame}`,
      role: 'validation',
      label: `${edit.short} — frame ${frame}`,
      group: 'Validation',
      path: `${OUT}/validation-stills/${edit.id}-1920x1080-f${frame}.jpg`,
      meta: { frame, format: '16:9' },
    })
  }
}

// -- Notes / plan -----------------------------------------------------------
add({
  key: 'doc:edit-plan-v3',
  role: 'document',
  label: 'EDIT_PLAN_V3.md — production note',
  description: 'Content map, both EDLs, the two frame-accurate boundary measurements, revisions.',
  group: 'Notes',
  preferred: true,
  path: 'src/projects/openscout-montage/EDIT_PLAN_V3.md',
})
add({
  key: 'doc:edit-plan-v1',
  role: 'document',
  label: 'EDIT_PLAN.md — first montage record',
  group: 'Notes',
  path: 'src/projects/openscout-montage/EDIT_PLAN.md',
})

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

const payload = {
  slug: SLUG,
  title: 'OpenScout V3 — montage',
  description:
    'Two 45-second films cut from the V3 iOS masters on one composition system: a beat-led dark hero and an ambient light↔dark edit. Three delivered formats each.',
  brief: [
    'Two genuinely different films, not one film regraded. They differ in music, pace,',
    'dissolve length, camera settle, chapter count, stage tone and — most importantly —',
    'editorial idea.',
    '',
    'Edit A is beat-led: 24 bars of content plus 3 bars of outro on a 50-frame bar grid,',
    'so every chapter boundary lands on a downbeat of the 144 BPM bed. Beat-led is',
    'expressed in the cut, not the camera; the phone settles and rests rather than',
    'pulsing.',
    '',
    'Edit B opens in light mode and turns to dark inside the product’s own Appearance',
    'inspector, on the real Mode row, with the stage tone travelling with it. It closes',
    'on visual rhymes of surfaces it already showed.',
    '',
    'Both carry a CHOOSE chapter built on the agent-and-model picker, taken from the',
    'original capture because neither V3 master opens that sheet.',
  ].join('\n'),
  status: 'review' as const,
  tags: ['openscout', 'v3', 'montage'],
  groups: [
    { label: 'Edit A · Dark hero (beat-led)', description: EDITS[0].groupDescription, order: 0 },
    { label: 'Edit B · Light ↔ Dark (ambient)', description: EDITS[1].groupDescription, order: 1 },
    { label: 'Score', description: 'One fresh bed, one reused', order: 2 },
    { label: 'Source captures', description: 'CFR-normalised masters — every EDL timecode refers to these', order: 3 },
    { label: 'Composition & scripts', description: 'The system that produced the films', order: 4 },
    { label: 'Brand', order: 5 },
    { label: 'Validation', description: 'Media checks and representative frames', order: 6 },
    { label: 'Notes', order: 7 },
  ],
  items,
  itemsMode: 'replace' as const,
}

// ---------------------------------------------------------------------------

async function main() {
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

function report(created: boolean, run: Run, warnings: string[], links: RunLinks) {
  const pending = run.items.filter(i => i.state !== 'ready').length
  console.log(`\n${created ? 'Created' : 'Updated'} run "${run.slug}"`)
  console.log(`  ${run.items.length} artifacts · ${pending} pending`)
  if (warnings.length) {
    console.log('\nPending:')
    for (const w of warnings) console.log(`  · ${w}`)
  }
  console.log(`\n${formatRunHandoff(run, OFFLINE ? undefined : BASE)}`)
  console.log(`\nAll links: ${links.run}`)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
