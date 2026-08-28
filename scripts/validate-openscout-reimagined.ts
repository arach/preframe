#!/usr/bin/env bun
// Media validation for the OpenScout Reimagined deliverables.
//
//   bun run scripts/validate-openscout-reimagined.ts
//
// Checks each delivered MP4 for: exact resolution, duration and frame count,
// codec/pixel format, complete BT.709 signalling, faststart (moov before mdat),
// a real AAC stream, zero black frames across the whole timeline, audio
// loudness, and — specific to this film — that the wire mark renders as the
// canonical off-white #F7F4EA rather than any green or mint variant.
//
// Also writes representative stills spread across the whole cut for visual
// inspection.

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const OUT_DIR = join('out', 'openscout-reimagined')
const STILL_DIR = join(OUT_DIR, 'validation-stills')
const REPORT = join(OUT_DIR, 'VALIDATION.md')

const sh = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { encoding: 'utf-8', maxBuffer: 128 * 1024 * 1024 })
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}

const probe = (file: string, args: string[]) => sh('ffprobe', ['-v', 'error', ...args, file]).trim()

const FPS = 30
const FRAMES = 1650
const SECONDS = FRAMES / FPS

type Expect = { w: number; h: number }
const EXPECT: Record<string, Expect> = {
  'openscout-reimagined-1920x1080': { w: 1920, h: 1080 },
  'openscout-reimagined-1080x1920': { w: 1080, h: 1920 },
  'openscout-reimagined-1080x1080': { w: 1080, h: 1080 },
}

mkdirSync(STILL_DIR, { recursive: true })

const files = readdirSync(OUT_DIR).filter((f) => f.endsWith('.mp4')).sort()
if (!files.length) throw new Error(`No MP4s in ${OUT_DIR}`)

let failures = 0
const lines: string[] = []
const out = (s: string) => {
  console.log(s)
  lines.push(s)
}
const fail = (name: string, msg: string) => {
  failures++
  out(`   ✗ ${name}: ${msg}`)
}
const pass = (msg: string) => out(`   ✓ ${msg}`)

for (const file of files) {
  const path = join(OUT_DIR, file)
  const stem = file.replace(/\.mp4$/, '')
  out(`\n### ${file}\n`)
  out('```')

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
  const dur = parseFloat(
    probe(path, ['-select_streams', 'v:0', '-show_entries', 'stream=duration', '-of', 'csv=p=0']),
  )
  const containerDur = parseFloat(probe(path, ['-show_entries', 'format=duration', '-of', 'csv=p=0']))
  const get = (block: string, key: string) =>
    block.split('\n').find((l) => l.startsWith(`${key}=`))?.split('=')[1] ?? ''

  const w = Number(get(v, 'width'))
  const h = Number(get(v, 'height'))
  const frames = Number(get(v, 'nb_frames'))

  const exp = EXPECT[stem]
  if (!exp) fail('name', 'unexpected deliverable name')
  else if (w !== exp.w || h !== exp.h) fail('resolution', `${w}×${h}, expected ${exp.w}×${exp.h}`)
  else pass(`resolution ${w}×${h}`)

  if (get(v, 'codec_name') !== 'h264') fail('codec', get(v, 'codec_name'))
  else pass(`H.264 ${get(v, 'profile')} / ${get(v, 'pix_fmt')}`)

  if (get(v, 'r_frame_rate') !== `${FPS}/1`) fail('fps', get(v, 'r_frame_rate'))
  else pass(`${FPS} fps`)

  if (frames !== FRAMES) fail('frames', `${frames}, expected ${FRAMES}`)
  else pass(`${frames} frames (33 bars × 50)`)

  if (Math.abs(dur - SECONDS) > 0.002) fail('duration', `picture ${dur}s, expected ${SECONDS}`)
  else pass(`picture ${dur.toFixed(6)} s (container ${containerDur.toFixed(3)} s incl. AAC padding)`)

  const prim = get(v, 'color_primaries')
  const trc = get(v, 'color_transfer')
  const spc = get(v, 'color_space')
  if (prim !== 'bt709' || trc !== 'bt709' || spc !== 'bt709')
    fail('colour', `primaries=${prim} transfer=${trc} matrix=${spc}`)
  else pass(`BT.709 on all three (${get(v, 'color_range')} range)`)

  if (get(a, 'codec_name') !== 'aac') fail('audio', `codec ${get(a, 'codec_name') || 'MISSING'}`)
  else
    pass(
      `AAC ${get(a, 'sample_rate')} Hz ${get(a, 'channels')}ch ~${Math.round(
        Number(get(a, 'bit_rate')) / 1000,
      )} kb/s, ${Number(get(a, 'duration')).toFixed(3)} s`,
    )

  const atoms = sh('sh', [
    '-c',
    `ffprobe -v trace -i "${path}" 2>&1 | grep -oE "type:'(moov|mdat)'" | head -2 | tr '\\n' ' '`,
  ]).trim()
  if (atoms.startsWith("type:'moov'")) pass('faststart (moov before mdat)')
  else fail('faststart', `atom order: ${atoms || 'unknown'}`)

  const black = sh('ffmpeg', [
    '-nostats', '-i', path, '-vf', 'blackdetect=d=0.05:pix_th=0.05', '-f', 'null', '-',
  ])
    .split('\n')
    .filter((l) => l.includes('black_start'))
  if (black.length) fail('blackdetect', `${black.length} hit(s): ${black[0].trim()}`)
  else pass('blackdetect (pix_th=0.05): zero hits over the full timeline')

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

  const eb = sh('ffmpeg', ['-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
  const grab = (label: string) => {
    const m = eb.match(new RegExp(`${label}:\\s*(-?[\\d.]+)`, 'g'))
    return m ? m[m.length - 1].split(':')[1].trim() : '?'
  }
  pass(`audio ${grab('I')} LUFS, LRA ${grab('LRA')} LU, peak ${grab('Peak')} dBFS`)

  // -------------------------------------------------------------------------
  // Brand check: the outro wire mark must be the canonical off-white #F7F4EA
  // (247,244,234), never a green or mint variant.
  //
  // Measured on real decoded pixels, not on metadata: `signalstats` works in
  // YUV and exposes no R/G/B keys at all, so an RMAX/GMAX/BMAX probe silently
  // yields nothing. Instead the mark is cropped out of the outro lockup — where
  // it is the only bright object in frame — decoded to raw rgb24, and every
  // pixel whose darkest channel clears 180 is averaged. That is the mark's body
  // colour. #F7F4EA has R>G>B with R−B = 13; after H.264 and the BT.709
  // round-trip it lands near R−B = 11. A mint mark would invert this to G>R.
  // -------------------------------------------------------------------------
  const markFrame = FRAMES - 60
  const crop = `${Math.round(w * 0.06)}:${Math.round(h * 0.06)}:${Math.round(w * 0.47)}:${Math.round(
    h * 0.355,
  )}`
  const markPng = join(STILL_DIR, `${stem}-markcrop.png`)
  sh('ffmpeg', [
    '-y', '-v', 'error', '-i', path, '-vf',
    `select=eq(n\\,${markFrame}),crop=${crop}`,
    '-vsync', '0', '-frames:v', '1', markPng,
  ])
  const sampled = sh('sh', [
    '-c',
    `ffmpeg -v error -i "${markPng}" -f rawvideo -pix_fmt rgb24 - 2>/dev/null ` +
      `| od -An -tu1 -v | tr -s ' ' '\\n' | grep -v '^$' ` +
      `| awk '{a[NR%3]=$1; if(NR%3==0){r=a[1];g=a[2];b=a[0]; m=(r<g?r:g); m=(m<b?m:b); ` +
      `if(m>180){sr+=r;sg+=g;sb+=b;n++}}} END{if(n>0) printf "%d %.1f %.1f %.1f", n, sr/n, sg/n, sb/n}'`,
  ]).trim()
  const [nPx, mr, mg, mb] = sampled.split(/\s+/).map(Number)
  if (!nPx || [mr, mg, mb].some(Number.isNaN))
    fail('mark colour', `no mark pixels found in the outro crop (frame ${markFrame})`)
  else if (mg > mr || mb > mr)
    fail(
      'mark colour',
      `mark body rgb(${mr},${mg},${mb}) is not warm off-white — a green/mint mark would look like this`,
    )
  else if (mr - mb < 4 || mr - mb > 30)
    fail('mark colour', `mark body rgb(${mr},${mg},${mb}), R−B=${(mr - mb).toFixed(1)} — expected ≈13 for #F7F4EA`)
  else
    pass(
      `wire mark body rgb(${mr}, ${mg}, ${mb}) over ${nPx} px — off-white, R>G>B, R−B=${(mr - mb).toFixed(1)} (#F7F4EA is 247,244,234, R−B=13)`,
    )

  // Representative stills: one inside every chapter plus the outro lockup.
  const sampleAt = [75, 145, 225, 375, 525, 700, 870, 1020, 1200, 1290, 1380, 1440, 1560, 1640]
  for (const f of sampleAt) {
    sh('ffmpeg', [
      '-y', '-v', 'error', '-i', path, '-vf', `select=eq(n\\,${f})`, '-vsync', '0',
      '-frames:v', '1', '-q:v', '2', join(STILL_DIR, `${stem}-f${String(f).padStart(4, '0')}.jpg`),
    ])
  }
  pass(`${sampleAt.length} stills → ${STILL_DIR}/${stem}-f*.jpg`)
  out('```')
}

const verdict =
  failures === 0
    ? `\n**ALL CHECKS PASSED across ${files.length} file(s).**`
    : `\n**${failures} CHECK(S) FAILED across ${files.length} file(s).**`
out(verdict)

writeFileSync(
  REPORT,
  `# OpenScout Reimagined — validation\n\n` +
    `\`bun run scripts/validate-openscout-reimagined.ts\`\n\n` +
    `Expected: 1650 frames, 55.000000 s, 30 fps, H.264 yuv420p, BT.709 on all three\n` +
    `signalling fields, faststart, AAC audio, no black frames, canonical #F7F4EA mark.\n` +
    `${lines.join('\n')}\n`,
)
console.log(`\n[report] ${REPORT}`)

if (failures) process.exit(1)
