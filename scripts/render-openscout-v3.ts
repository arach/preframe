#!/usr/bin/env bun
// Renders and finishes the OpenScout V3 deliverables.
//
//   bun run scripts/render-openscout-v3.ts            # the four required MP4s
//   bun run scripts/render-openscout-v3.ts --squares  # + the optional 1:1 pair
//   bun run scripts/render-openscout-v3.ts DarkHero-Landscape
//
// Two stages per target, matching the convention the first montage established:
//
//  1. `remotion render` writes to out/openscout-v3/_raw/. Remotion's
//     --color-space=bt709 writes the matrix but leaves primaries and transfer
//     unset, and it does not move the moov atom.
//  2. A lossless `-c copy` remux completes the BT.709 signalling in both the
//     SPS VUI and the container and puts moov before mdat, so the files start
//     playing before they finish downloading.

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const ENTRY = 'src/projects/openscout-montage/openscout-montage-entry.tsx'
const OUT_DIR = join('out', 'openscout-v3')
const RAW_DIR = join(OUT_DIR, '_raw')

type Target = { composition: string; name: string; crf: number }

const REQUIRED: Target[] = [
  { composition: 'Hype-Landscape', name: 'openscout-v3-hype-1920x1080', crf: 16 },
  { composition: 'Hype-Vertical', name: 'openscout-v3-hype-1080x1920', crf: 17 },
  { composition: 'Hype-Square', name: 'openscout-v3-hype-1080x1080', crf: 17 },
  { composition: 'Explainer-Landscape', name: 'openscout-v3-explainer-1920x1080', crf: 16 },
  { composition: 'Explainer-Vertical', name: 'openscout-v3-explainer-1080x1920', crf: 17 },
  { composition: 'Explainer-Square', name: 'openscout-v3-explainer-1080x1080', crf: 17 },
]

const SQUARES: Target[] = []

const args = process.argv.slice(2)
const wantSquares = args.includes('--squares')
const explicit = args.filter((a) => !a.startsWith('--'))

let targets = wantSquares ? [...REQUIRED, ...SQUARES] : REQUIRED
if (explicit.length) targets = [...REQUIRED, ...SQUARES].filter((t) => explicit.includes(t.composition))
if (!targets.length) throw new Error(`No matching composition for: ${explicit.join(', ')}`)

const run = (cmd: string, argv: string[]) => {
  const res = spawnSync(cmd, argv, { stdio: 'inherit' })
  if (res.status !== 0) throw new Error(`${cmd} failed (${res.status}) for: ${argv.join(' ')}`)
}

mkdirSync(RAW_DIR, { recursive: true })

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
    '--concurrency=4',
    // A minimal, hardlinked public dir when one is provided: the project's real
    // public/ is ~400 MB and Remotion copies all of it into every bundle, which
    // was enough to exhaust the disk mid-render. These compositions only need the
    // three captures, two scores and the wire mark.
    ...(process.env.OPENSCOUT_PUBLIC_DIR ? [`--public-dir=${process.env.OPENSCOUT_PUBLIC_DIR}`] : []),
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
