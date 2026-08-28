#!/usr/bin/env bun
// Renders and finishes the OpenScout theme-range A/B.
//
//   bun run scripts/render-openscout-theme-range.ts            # both
//   bun run scripts/render-openscout-theme-range.ts beat
//   bun run scripts/render-openscout-theme-range.ts --stills    # layout check only
//
// Same two-stage pipeline as the refined and daylight renders, for the same
// reasons:
//
//  1. `remotion render` writes to out/openscout-theme-range/_raw/. Remotion's
//     --color-space=bt709 writes the matrix but leaves primaries and transfer
//     unset, and it does not move the moov atom.
//  2. A lossless `-c copy` remux completes the BT.709 signalling in both the SPS
//     VUI and the container and puts moov before mdat, so the files start playing
//     before they finish downloading.
//
// The bundle's public dir is a minimal hardlinked tree rather than the project's
// real public/, which is ~400 MB and gets copied into every Remotion bundle —
// enough to exhaust the disk mid-render. This film needs exactly three assets.
//
// ---------------------------------------------------------------------------
// WHY BOTH FILMS USE IDENTICAL ENCODER SETTINGS
// ---------------------------------------------------------------------------
//
// The deliverable is an A/B in which the picture must be frame-identical. That
// is guaranteed upstream by construction — the two edits differ only in their
// score, and the composition cannot route a score to a pixel — but it can still
// be broken downstream by giving the two renders different CRFs, presets or
// concurrency. So the encoder settings below are shared, not per-target, and
// `validate-openscout-theme-range.ts` hashes every decoded video frame of both
// files to prove the guarantee actually held.

import {mkdirSync, rmSync, linkSync, existsSync, copyFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {spawnSync} from 'node:child_process'

const ENTRY = 'src/projects/openscout-montage/openscout-montage-entry.tsx'
const OUT_DIR = join('out', 'openscout-theme-range')
const RAW_DIR = join(OUT_DIR, '_raw')
const STILL_DIR = join(OUT_DIR, 'layout-stills')
const PUBLIC_DIR = join('.scratch', 'openscout-theme-range-public')

const ASSETS = [
  'demos/openscout/openscout-theme-range-cfr60.mp4',
  'tracks/openscout/openscout-theme-range-vibe-original.wav',
  'tracks/openscout/openscout-theme-range-vibe-refined.wav',
  'tracks/openscout/openscout-theme-range-glasshouse.wav',
]

/** Shared by both targets. See the note above — this must not vary A vs B. */
const CRF = 15

type Target = {key: string; composition: string; name: string}

const TARGETS: Target[] = [
  {key: 'beat', composition: 'ThemeRangeBeat-Landscape', name: 'openscout-theme-range-a-beat'},
  {key: 'drift', composition: 'ThemeRangeDrift-Landscape', name: 'openscout-theme-range-b-drift'},
  {
    key: 'glasshouse',
    composition: 'ThemeRangeGlasshouse-Landscape',
    name: 'openscout-theme-range-c-glasshouse',
  },
]

const args = process.argv.slice(2)
const stillsOnly = args.includes('--stills')
const explicit = args.filter((a) => !a.startsWith('--'))
const targets = explicit.length
  ? TARGETS.filter((t) => explicit.includes(t.key) || explicit.includes(t.composition))
  : TARGETS
if (!targets.length) throw new Error(`No matching target for: ${explicit.join(', ')}`)

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
// Layout stills — cheap check that the frame, the type band and the two pushes
// compose before committing to a full render. Sampled at the opening hold, each
// chapter's settled pose, both ends of each push, the reveal, and the outro.
// ---------------------------------------------------------------------------

if (stillsOnly) {
  mkdirSync(STILL_DIR, {recursive: true})
  const frames = [
    20, 140, 300, 330, 420, 560, 600, 660, 780, 850, 900, 1000, 1040, 1100, 1160, 1250, 1320, 1450,
    1560, 1600, 1700, 1820,
  ]
  const target = targets[0]
  for (const frame of frames) {
    const out = join(STILL_DIR, `f${String(frame).padStart(4, '0')}.png`)
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
    `--crf=${CRF}`,
    '--x264-preset=slow',
    '--pixel-format=yuv420p',
    '--color-space=bt709',
    '--audio-codec=aac',
    '--audio-bitrate=256k',
    '--concurrency=4',
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
