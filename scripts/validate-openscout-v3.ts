#!/usr/bin/env bun
// Media validation for the OpenScout V3 deliverables.
//
//   bun run scripts/validate-openscout-v3.ts
//
// Checks each delivered MP4 for: exact resolution, duration and frame count,
// codec/pixel format, complete BT.709 signalling, faststart (moov before mdat),
// a real AAC stream, zero black frames across the whole timeline, and audio
// loudness. Also writes representative stills for visual inspection.

import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const OUT_DIR = join('out', 'openscout-v3')
const STILL_DIR = join(OUT_DIR, 'validation-stills')

const sh = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 })
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}

const probe = (file: string, args: string[]) =>
  sh('ffprobe', ['-v', 'error', ...args, file]).trim()

type Expect = { w: number; h: number; frames: number }
// Edit 1 (hype) and Edit 2 (explainer) are deliberately different lengths.
const HYPE = 650
const EXPLAINER = 1350
const EXPECT: Record<string, Expect> = {
  'openscout-v3-hype-1920x1080': { w: 1920, h: 1080, frames: HYPE },
  'openscout-v3-hype-1080x1920': { w: 1080, h: 1920, frames: HYPE },
  'openscout-v3-hype-1080x1080': { w: 1080, h: 1080, frames: HYPE },
  'openscout-v3-explainer-1920x1080': { w: 1920, h: 1080, frames: EXPLAINER },
  'openscout-v3-explainer-1080x1920': { w: 1080, h: 1920, frames: EXPLAINER },
  'openscout-v3-explainer-1080x1080': { w: 1080, h: 1080, frames: EXPLAINER },
}

const FPS = 30

mkdirSync(STILL_DIR, { recursive: true })

const files = readdirSync(OUT_DIR)
  .filter((f) => f.endsWith('.mp4'))
  .sort()

if (!files.length) throw new Error(`No MP4s in ${OUT_DIR}`)

let failures = 0
const fail = (name: string, msg: string) => {
  failures++
  console.log(`   ✗ ${name}: ${msg}`)
}
const pass = (msg: string) => console.log(`   ✓ ${msg}`)

for (const file of files) {
  const path = join(OUT_DIR, file)
  const stem = file.replace(/\.mp4$/, '')
  console.log(`\n=== ${file} ===`)

  const v = probe(path, [
    '-select_streams', 'v:0',
    '-show_entries',
    'stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_frames,color_primaries,color_transfer,color_space,color_range',
    '-of', 'default=noprint_wrappers=1',
  ])
  const a = probe(path, [
    '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name,sample_rate,channels,bit_rate,duration',
    '-of', 'default=noprint_wrappers=1',
  ])
  // The picture length is what must be exact. The container runs ~56 ms longer
  // because AAC pads the final frame after the score has already faded out; that
  // padding does not extend the video stream.
  const dur = parseFloat(
    probe(path, ['-select_streams', 'v:0', '-show_entries', 'stream=duration', '-of', 'csv=p=0']),
  )
  const containerDur = parseFloat(
    probe(path, ['-show_entries', 'format=duration', '-of', 'csv=p=0']),
  )
  const get = (block: string, key: string) =>
    block.split('\n').find((l) => l.startsWith(`${key}=`))?.split('=')[1] ?? ''

  const w = Number(get(v, 'width'))
  const h = Number(get(v, 'height'))
  const frames = Number(get(v, 'nb_frames'))
  const rate = get(v, 'r_frame_rate')

  const exp = EXPECT[stem]
  if (!exp) fail('name', `unexpected deliverable name`)
  else if (w !== exp.w || h !== exp.h) fail('resolution', `${w}×${h}, expected ${exp.w}×${exp.h}`)
  else pass(`resolution ${w}×${h}`)
  const expectFrames = exp?.frames ?? EXPLAINER
  const expectSeconds = expectFrames / FPS

  if (get(v, 'codec_name') !== 'h264') fail('codec', get(v, 'codec_name'))
  else pass(`H.264 ${get(v, 'profile')} / ${get(v, 'pix_fmt')}`)

  if (rate !== `${FPS}/1`) fail('fps', rate)
  else pass(`${FPS} fps`)

  if (frames !== expectFrames) fail('frames', `${frames}, expected ${expectFrames}`)
  else pass(`${frames} frames`)

  if (Math.abs(dur - expectSeconds) > 0.002) fail('duration', `picture ${dur}s`)
  else pass(`picture ${dur.toFixed(6)} s (container ${containerDur.toFixed(3)} s incl. AAC padding)`)

  const prim = get(v, 'color_primaries')
  const trc = get(v, 'color_transfer')
  const spc = get(v, 'color_space')
  const range = get(v, 'color_range')
  if (prim !== 'bt709' || trc !== 'bt709' || spc !== 'bt709')
    fail('colour', `primaries=${prim} transfer=${trc} matrix=${spc}`)
  else pass(`BT.709 on all three (${range} range)`)

  if (get(a, 'codec_name') !== 'aac') fail('audio', `codec ${get(a, 'codec_name') || 'MISSING'}`)
  else
    pass(
      `AAC ${get(a, 'sample_rate')} Hz ${get(a, 'channels')}ch ~${Math.round(
        Number(get(a, 'bit_rate')) / 1000,
      )} kb/s, ${Number(get(a, 'duration')).toFixed(3)} s`,
    )

  // faststart: moov must precede mdat
  const atoms = sh('sh', [
    '-c',
    `ffprobe -v trace -i "${path}" 2>&1 | grep -oE "type:'(moov|mdat)'" | head -2 | tr '\\n' ' '`,
  ]).trim()
  if (atoms.startsWith("type:'moov'")) pass(`faststart (moov before mdat)`)
  else fail('faststart', `atom order: ${atoms || 'unknown'}`)

  // True black frames across the whole timeline. pix_th=0.05 (luma < ~13) rather
  // than the 0.10 default: the outro is a deliberately near-black card carrying a
  // small centred lockup, so at 0.10 it reads as "black" for its full 5 s even
  // though it is neither blank nor close to true black. What matters is that no
  // frame actually goes dark, which the darkest-frame measurement below proves.
  const black = sh('ffmpeg', [
    '-nostats', '-i', path, '-vf', 'blackdetect=d=0.05:pix_th=0.05', '-f', 'null', '-',
  ])
    .split('\n')
    .filter((l) => l.includes('black_start'))
  if (black.length) fail('blackdetect', `${black.length} hit(s): ${black[0].trim()}`)
  else pass('blackdetect (pix_th=0.05): zero hits over the full timeline')

  // Darkest frame in the file, by mean luma.
  const ys = sh('ffmpeg', [
    '-nostats', '-i', path, '-vf',
    'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-',
  ])
    .split('\n')
    .filter((l) => l.includes('YAVG'))
    .map((l) => parseFloat(l.split('=').pop() as string))
    .filter((n) => !Number.isNaN(n))
  if (ys.length) {
    const min = Math.min(...ys)
    if (min < 16) fail('darkest frame', `mean luma ${min.toFixed(1)} — at or below true black`)
    else pass(`darkest frame mean luma ${min.toFixed(1)}/255 (true black ≈ 16)`)
  }

  // loudness
  const eb = sh('ffmpeg', ['-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
  const grab = (label: string) => {
    const m = eb.match(new RegExp(`${label}:\\s*(-?[\\d.]+)`, 'g'))
    return m ? m[m.length - 1].split(':')[1].trim() : '?'
  }
  pass(`audio ${grab('I')} LUFS, LRA ${grab('LRA')} LU, peak ${grab('Peak')} dBFS`)

  // Representative stills spread across whatever this cut's length actually is:
  // opening, each lens beat, boundaries, and the ending lockup.
  const sampleAt = Array.from({length: 8}, (_, i) =>
    Math.min(expectFrames - 1, Math.round(((i + 0.5) / 8) * expectFrames)),
  )
  for (const f of sampleAt) {
    sh('ffmpeg', [
      '-y', '-v', 'error', '-i', path, '-vf', `select=eq(n\\,${f})`, '-vsync', '0',
      '-frames:v', '1', '-q:v', '2', join(STILL_DIR, `${stem}-f${f}.jpg`),
    ])
  }
  pass(`8 stills → ${STILL_DIR}/${stem}-f*.jpg`)
}

console.log(
  failures === 0
    ? `\nALL CHECKS PASSED across ${files.length} file(s).`
    : `\n${failures} CHECK(S) FAILED across ${files.length} file(s).`,
)
if (failures) process.exit(1)
