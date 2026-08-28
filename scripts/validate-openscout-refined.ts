#!/usr/bin/env bun
// Media validation for the OpenScout Reimagined — refined deliverables.
//
//   bun run scripts/validate-openscout-refined.ts
//
// Checks each delivered MP4 for: exact resolution, duration and frame count,
// codec/pixel format, complete BT.709 signalling, faststart (moov before mdat),
// a real AAC stream, zero black frames across the whole timeline, audio
// loudness, and that the wire mark renders as the canonical off-white #F7F4EA
// rather than any green or mint variant.
//
// It also checks the one constraint this pass was built around, at source
// level rather than by assertion: THE SCORE IS UNCHANGED. The refined edit must
// point at the same asset, at the same gain, for the same number of frames as
// the reimagined edit it was refined from. That is a claim about the film, so it
// gets tested like one.
//
// Representative stills are written for visual inspection at the places the
// brief calls out: the opening lockup, the handover into the product, each
// chapter, the lens arrivals, and the branded ending.

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { getPlacedEdit } from '../src/projects/openscout-montage/edit'
import { EDIT_REFINED } from '../src/projects/openscout-montage/edit-refined'
import { EDIT_REIMAGINED } from '../src/projects/openscout-montage/edit-reimagined'

const OUT_DIR = join('out', 'openscout-refined')
const STILL_DIR = join(OUT_DIR, 'validation-stills')
const REPORT = join(OUT_DIR, 'VALIDATION.md')

const sh = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024 })
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}

const probe = (file: string, args: string[]) => sh('ffprobe', ['-v', 'error', ...args, file]).trim()

const FPS = 30
const FRAMES = 1650
const SECONDS = FRAMES / FPS

type Expect = { w: number; h: number }
const EXPECT: Record<string, Expect> = {
  'openscout-refined-1920x1080': { w: 1920, h: 1080 },
  'openscout-refined-1080x1920': { w: 1080, h: 1920 },
  'openscout-refined-1080x1080': { w: 1080, h: 1080 },
}

mkdirSync(STILL_DIR, { recursive: true })

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

// ---------------------------------------------------------------------------
// 0. The score is unchanged — the binding constraint on this pass
// ---------------------------------------------------------------------------

out('\n### Score — unchanged from the reimagined cut\n')
out('```')
{
  const a = EDIT_REFINED
  const b = EDIT_REIMAGINED
  if (a.score !== b.score) fail('score asset', `refined uses ${a.score}, reimagined uses ${b.score}`)
  else pass(`same asset: ${a.score}`)

  if (a.scoreGain !== b.scoreGain)
    fail('score gain', `refined ${a.scoreGain}, reimagined ${b.scoreGain}`)
  else pass(`same in-composition gain: ${a.scoreGain}`)

  const pa = getPlacedEdit(a)
  const pb = getPlacedEdit(b)
  if (pa.totalFrames !== pb.totalFrames)
    fail('runtime', `refined ${pa.totalFrames} f, reimagined ${pb.totalFrames} f — the cue would not line up`)
  else pass(`same runtime: ${pa.totalFrames} frames = ${(pa.totalFrames / FPS).toFixed(6)} s`)

  // Every chapter boundary must still land on a 50-frame downbeat at 144 BPM,
  // or the retimed chapters would drift against a cue that did not move.
  const offGrid = [
    ...pa.chapters.map((c) => c.from),
    ...pa.chapters.map((c) => c.from + c.durationInFrames),
    pa.outroFrom,
    pa.totalFrames,
  ].filter((f) => f % 50 !== 0)
  if (offGrid.length) fail('grid', `boundaries off the 50-frame downbeat: ${offGrid.join(', ')}`)
  else pass(`all ${pa.chapters.length + 1} boundaries land on a 50-frame downbeat (144 BPM)`)

  const wav = sh('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
    join('public', a.score),
  ]).trim()
  pass(`score asset on disk measures ${Number(wav).toFixed(6)} s`)
}
out('```')

// ---------------------------------------------------------------------------
// Per-deliverable checks
// ---------------------------------------------------------------------------

const files = readdirSync(OUT_DIR).filter((f) => f.endsWith('.mp4')).sort()
if (!files.length) throw new Error(`No MP4s in ${OUT_DIR}`)

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

  // The refined cut opens on a brand lockup over a near-black stage rather than
  // on the lit phone, so this check matters more here than it did before.
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
    const argmin = ys.indexOf(min)
    if (min < 16) fail('darkest frame', `mean luma ${min.toFixed(1)} at frame ${argmin} — at or below true black`)
    else pass(`darkest frame mean luma ${min.toFixed(1)}/255 at frame ${argmin} (true black ≈ 16)`)
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
  // The mark is located GEOMETRICALLY, not by colour — selecting warm pixels to
  // prove the mark is warm would prove nothing. The outro lockup stacks mark,
  // wordmark, rule, line, foot and tag down the centre of frame, so the mark is
  // simply the topmost bright object: decode the frame to raw rgb24, take every
  // pixel whose darkest channel clears 180, find the topmost such row, and keep
  // only the band from there down to the bottom of the mark's own glyph. The
  // wordmark below is `PALETTE.ink` (#F2F3F5, B > R) and would drag the average
  // cold if it leaked in, so the band is deliberately cut short of it.
  // -------------------------------------------------------------------------
  const markFrame = FRAMES - 60
  const rawPng = join(STILL_DIR, `${stem}-markframe.png`)
  sh('ffmpeg', [
    '-y', '-v', 'error', '-i', path, '-vf', `select=eq(n\\,${markFrame})`,
    '-vsync', '0', '-frames:v', '1', rawPng,
  ])
  const raw = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', rawPng, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    { maxBuffer: 512 * 1024 * 1024 },
  ).stdout
  {
    // The mark is drawn at 58 * u, where u = (min(w,h)/1080) * typeScale.
    const typeScale = w === 1920 ? 1 : h === 1920 ? 1.34 : 1.16
    const markH = 58 * (Math.min(w, h) / 1080) * typeScale

    let top = -1
    const rowsWithInk: number[] = []
    for (let y = 0; y < h; y++) {
      let n = 0
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3
        const r = raw[i], g = raw[i + 1], b = raw[i + 2]
        if (Math.min(r, g, b) > 180) n++
      }
      if (n > 0) rowsWithInk.push(y)
      if (n > 0 && top === -1) top = y
    }
    // Only the mark's own glyph, stopping well above the wordmark beneath it.
    const bandEnd = top + markH * 0.92
    let sr = 0, sg = 0, sb = 0, n = 0
    for (let y = top; y >= 0 && y < Math.min(h, Math.round(bandEnd)); y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3
        const r = raw[i], g = raw[i + 1], b = raw[i + 2]
        if (Math.min(r, g, b) > 180) {
          sr += r; sg += g; sb += b; n++
        }
      }
    }
    if (top < 0 || !n) {
      fail('mark colour', `no mark pixels found in the outro frame ${markFrame}`)
    } else {
      const mr = sr / n, mg = sg / n, mb = sb / n
      if (mg > mr || mb > mr)
        fail(
          'mark colour',
          `mark body rgb(${mr.toFixed(1)},${mg.toFixed(1)},${mb.toFixed(1)}) is not warm off-white — a green/mint mark would look like this`,
        )
      else if (mr - mb < 4 || mr - mb > 30)
        fail(
          'mark colour',
          `mark body rgb(${mr.toFixed(1)},${mg.toFixed(1)},${mb.toFixed(1)}), R−B=${(mr - mb).toFixed(1)} — expected ≈13 for #F7F4EA`,
        )
      else
        pass(
          `wire mark body rgb(${mr.toFixed(1)}, ${mg.toFixed(1)}, ${mb.toFixed(
            1,
          )}) over ${n} px in rows ${top}–${Math.round(bandEnd)} — off-white, R>G>B, R−B=${(
            mr - mb
          ).toFixed(1)} (#F7F4EA is 247,244,234, R−B=13)`,
        )
    }
  }

  // Representative stills: the opening lockup and its handover, one inside every
  // chapter, and the branded ending as it builds.
  const sampleAt = [
    2, 40, 70, 96, 110, 150, 275, 425, 575, 750, 925, 1075, 1250, 1400, 1470, 1500, 1540, 1600, 1645,
  ]
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
  `# OpenScout Reimagined — refined · validation\n\n` +
    `\`bun run scripts/validate-openscout-refined.ts\`\n\n` +
    `Expected: 1650 frames, 55.000000 s, 30 fps, H.264 yuv420p, BT.709 on all three\n` +
    `signalling fields, faststart, AAC audio, no black frames, canonical #F7F4EA mark,\n` +
    `and a score identical to the reimagined cut's in asset, gain and runtime.\n` +
    `${lines.join('\n')}\n`,
)
console.log(`\n[report] ${REPORT}`)

if (failures) process.exit(1)
