#!/usr/bin/env bun
// Renders and finishes the OpenScout — daylight deliverables.
//
//   bun run scripts/render-openscout-daylight.ts                  # all three
//   bun run scripts/render-openscout-daylight.ts Daylight-Landscape
//   bun run scripts/render-openscout-daylight.ts --stills         # layout check only
//
// Same two-stage pipeline as the refined render, and the same reasoning:
//
//  1. `remotion render` writes to out/openscout-daylight/_raw/. Remotion's
//     --color-space=bt709 writes the matrix but leaves primaries and transfer
//     unset, and it does not move the moov atom.
//  2. A lossless `-c copy` remux completes the BT.709 signalling in both the
//     SPS VUI and the container and puts moov before mdat, so the files start
//     playing before they finish downloading.
//
// The bundle's public dir is a minimal hardlinked tree built here rather than
// the project's real public/, which is ~400 MB and gets copied into every
// Remotion bundle — enough to exhaust the disk mid-render. This film needs
// exactly three assets: the two captures and the unchanged score.

import {mkdirSync, rmSync, linkSync, existsSync, copyFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {spawnSync} from 'node:child_process'

const ENTRY = 'src/projects/openscout-montage/openscout-montage-entry.tsx'
const OUT_DIR = join('out', 'openscout-daylight')
const RAW_DIR = join(OUT_DIR, '_raw')
const STILL_DIR = join(OUT_DIR, 'layout-stills')
const PUBLIC_DIR = join('.scratch', 'openscout-daylight-public')

const ASSETS = [
  // The light half — chapters I–V.
  'demos/openscout/openscout-nav-light-v3-cfr30.mp4',
  // The dark half — chapters V–IX.
  'demos/openscout/openscout-reimagined-dark-device-master-cfr30.mp4',
  // Unchanged from the reimagined and refined films, by operator direction.
  'tracks/openscout/openscout-reimagined-score.wav',
]

type Target = {composition: string; name: string; crf: number}

const TARGETS: Target[] = [
  {composition: 'Daylight-Landscape', name: 'openscout-daylight-1920x1080', crf: 16},
  {composition: 'Daylight-Vertical', name: 'openscout-daylight-1080x1920', crf: 17},
  {composition: 'Daylight-Square', name: 'openscout-daylight-1080x1080', crf: 17},
]

const args = process.argv.slice(2)
const stillsOnly = args.includes('--stills')
const explicit = args.filter((a) => !a.startsWith('--'))
const targets = explicit.length ? TARGETS.filter((t) => explicit.includes(t.composition)) : TARGETS
if (!targets.length) throw new Error(`No matching composition for: ${explicit.join(', ')}`)

const run = (cmd: string, argv: string[]) => {
  const res = spawnSync(cmd, argv, {stdio: 'inherit'})
  if (res.status !== 0) throw new Error(`${cmd} failed (${res.status}) for: ${argv.join(' ')}`)
}

// ---------------------------------------------------------------------------
// Minimal public dir — hardlinks, so this costs no disk and cannot drift.
// ---------------------------------------------------------------------------

rmSync(PUBLIC_DIR, {recursive: true, force: true})
for (const rel of ASSETS) {
  const src = join('public', rel)
  if (!existsSync(src)) throw new Error(`Missing asset: ${src}`)
  const dst = join(PUBLIC_DIR, rel)
  mkdirSync(dirname(dst), {recursive: true})
  try {
    linkSync(src, dst)
  } catch {
    copyFileSync(src, dst)
  }
}
console.log(`[public] ${ASSETS.length} asset(s) → ${PUBLIC_DIR}`)

// ---------------------------------------------------------------------------
// Layout stills — cheap check that type, lens and device compose in all three
// formats before committing to full renders. Sampled at the places this pass
// changes: the opening lockup and its typed line, the handover, each chapter's
// settled lens, both sides of the hinge and its midpoint, and the ending.
// ---------------------------------------------------------------------------

if (stillsOnly) {
  mkdirSync(STILL_DIR, {recursive: true})
  const frames = [
    50, 72, 96, 108, 130, 200, 330, 480, 630, 740, 762, 775, 788, 830, 930, 1080, 1260, 1400, 1500,
    1560, 1620,
  ]
  for (const target of targets) {
    for (const frame of frames) {
      const out = join(STILL_DIR, `${target.name}-f${String(frame).padStart(4, '0')}.png`)
      console.log(`[still] ${target.composition} @ ${frame} → ${out}`)
      run('bunx', [
        'remotion',
        'still',
        ENTRY,
        target.composition,
        out,
        `--frame=${frame}`,
        `--public-dir=${PUBLIC_DIR}`,
        '--log=error',
      ])
    }
  }
  console.log(`\n[done] stills in ${STILL_DIR}`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

mkdirSync(RAW_DIR, {recursive: true})

for (const target of targets) {
  const raw = join(RAW_DIR, `${target.name}.mp4`)
  const final = join(OUT_DIR, `${target.name}.mp4`)

  console.log(`\n[render] ${target.composition} → ${raw}`)
  run('bunx', [
    'remotion',
    'render',
    ENTRY,
    target.composition,
    raw,
    '--codec=h264',
    `--crf=${target.crf}`,
    '--x264-preset=slow',
    '--pixel-format=yuv420p',
    '--color-space=bt709',
    '--audio-codec=aac',
    '--audio-bitrate=256k',
    // 3, not 4. This film mounts more simultaneous video elements than its
    // predecessors — the phone and the detail lens each play the chapter's cuts,
    // and across a dissolve that is two cuts in both. At 4 the browser was
    // starved and crashed mid-render; 3 leaves headroom without a meaningful
    // wall-clock cost.
    '--concurrency=3',
    `--public-dir=${PUBLIC_DIR}`,
    '--log=info',
  ])

  console.log(`[finish] ${final}`)
  run('ffmpeg', [
    '-y',
    '-i',
    raw,
    '-c',
    'copy',
    '-movflags',
    '+faststart',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-colorspace',
    'bt709',
    '-bsf:v',
    'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
    final,
  ])
}

console.log(`\n[done] ${targets.length} file(s) in ${OUT_DIR}`)
