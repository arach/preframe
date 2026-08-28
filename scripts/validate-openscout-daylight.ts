#!/usr/bin/env bun
// Media validation for the OpenScout — daylight deliverables.
//
//   bun run scripts/validate-openscout-daylight.ts
//
// Checks each delivered MP4 for: exact resolution, duration and frame count,
// codec/pixel format, complete BT.709 signalling, faststart (moov before mdat),
// a real AAC stream, zero black frames across the whole timeline, audio
// loudness, and that the wire mark renders as the canonical off-white #F7F4EA
// rather than any green or mint variant.
//
// Three checks are specific to this pass, and each of them tests a claim the
// brief made rather than an assumption:
//
//   0. THE SCORE IS UNCHANGED. Compared field by field against `EDIT_REFINED`,
//      which was itself checked against the reimagined cut — same asset, same
//      gain, same runtime, every boundary still on a 50-frame downbeat.
//
//   1. THE ROUTING FAILURE IS REDACTED. Every cut that plays the light For You
//      feed must carry the redaction. This is a source-level guard: it is the
//      kind of thing that quietly regresses when a window is retimed.
//
//   2. THE FILM ACTUALLY TURNS. Measured on rendered pixels, not asserted: mean
//      luma is sampled either side of the hinge and the light half must be
//      decisively brighter than the dark half, with the crossing inside the
//      dissolve the edit declares.

import {mkdirSync, readdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import {getPlacedEdit} from '../src/projects/openscout-montage/edit'
import {DAYLIGHT_TURN, EDIT_DAYLIGHT} from '../src/projects/openscout-montage/edit-daylight'
import {EDIT_REFINED} from '../src/projects/openscout-montage/edit-refined'

const OUT_DIR = join('out', 'openscout-daylight')
const STILL_DIR = join(OUT_DIR, 'validation-stills')
const REPORT = join(OUT_DIR, 'VALIDATION.md')

const sh = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, {encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024})
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}

const probe = (file: string, args: string[]) => sh('ffprobe', ['-v', 'error', ...args, file]).trim()

const FPS = 30
const FRAMES = 1650
const SECONDS = FRAMES / FPS

type Expect = {w: number; h: number}
const EXPECT: Record<string, Expect> = {
  'openscout-daylight-1920x1080': {w: 1920, h: 1080},
  'openscout-daylight-1080x1920': {w: 1080, h: 1920},
  'openscout-daylight-1080x1080': {w: 1080, h: 1080},
}

mkdirSync(STILL_DIR, {recursive: true})

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

out('\n### Score — unchanged from the refined cut\n')
out('```')
{
  const a = EDIT_DAYLIGHT
  const b = EDIT_REFINED
  if (a.score !== b.score) fail('score asset', `daylight uses ${a.score}, refined uses ${b.score}`)
  else pass(`same asset: ${a.score}`)

  if (a.scoreGain !== b.scoreGain)
    fail('score gain', `daylight ${a.scoreGain}, refined ${b.scoreGain}`)
  else pass(`same in-composition gain: ${a.scoreGain}`)

  const pa = getPlacedEdit(a)
  const pb = getPlacedEdit(b)
  if (pa.totalFrames !== pb.totalFrames)
    fail(
      'runtime',
      `daylight ${pa.totalFrames} f, refined ${pb.totalFrames} f — the cue would not line up`,
    )
  else pass(`same runtime: ${pa.totalFrames} frames = ${(pa.totalFrames / FPS).toFixed(6)} s`)

  // Every chapter boundary must land on a 50-frame downbeat at 144 BPM, or the
  // re-scripted chapters would drift against a cue that did not move.
  const offGrid = [
    ...pa.chapters.map((c) => c.from),
    ...pa.chapters.map((c) => c.from + c.durationInFrames),
    pa.outroFrom,
    pa.totalFrames,
  ].filter((f) => f % 50 !== 0)
  if (offGrid.length) fail('grid', `boundaries off the 50-frame downbeat: ${offGrid.join(', ')}`)
  else pass(`all ${pa.chapters.length + 1} boundaries land on a 50-frame downbeat (144 BPM)`)

  const wav = sh('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'csv=p=0',
    join('public', a.score),
  ]).trim()
  pass(`score asset on disk measures ${Number(wav).toFixed(6)} s`)
}
out('```')

// ---------------------------------------------------------------------------
// 1. The routing-failure row is redacted wherever the light feed is played
// ---------------------------------------------------------------------------

out('\n### Redaction — the routing failure never reaches the screen\n')
out('```')
{
  const placed = getPlacedEdit(EDIT_DAYLIGHT)
  // The two passes of the For You feed in the light capture. The `System` row
  // is present and pixel-identical across both, so any cut landing inside
  // either one must carry the redaction.
  const FEED_WINDOWS: [number, number][] = [
    [0, 13.5],
    [85, 95],
  ]
  const feedCuts = placed.cuts.filter((cut) => {
    if (cut.source !== 'light') return false
    const t = cut.kind === 'hold' ? cut.holdAt : cut.sourceStart
    return FEED_WINDOWS.some(([lo, hi]) => t >= lo && t < hi)
  })

  if (!feedCuts.length) {
    fail('redaction', 'no light For You cut found — the CONNECT beat is missing')
  } else {
    const bare = feedCuts.filter((cut) => !cut.redact)
    if (bare.length)
      fail(
        'redaction',
        `${bare.length} light-feed cut(s) play unredacted: ${bare.map((c) => c.note).join('; ')}`,
      )
    else
      pass(
        `all ${feedCuts.length} light For You cut(s) redacted (rows ${feedCuts[0].redact!.from}–${
          feedCuts[0].redact!.to
        }, closed up to floor ${feedCuts[0].redact!.floor})`,
      )
  }

  // No cut anywhere else should have picked one up by accident.
  const strays = placed.cuts.filter((cut) => cut.redact && !feedCuts.includes(cut))
  if (strays.length)
    fail('redaction', `redaction applied outside the light feed: ${strays.map((c) => c.note).join('; ')}`)
  else pass('no redaction applied to any other cut')
}
out('```')

// ---------------------------------------------------------------------------
// Per-deliverable checks
// ---------------------------------------------------------------------------

const files = readdirSync(OUT_DIR)
  .filter((f) => f.endsWith('.mp4'))
  .sort()
if (!files.length) throw new Error(`No MP4s in ${OUT_DIR}`)

for (const file of files) {
  const path = join(OUT_DIR, file)
  const stem = file.replace(/\.mp4$/, '')
  out(`\n### ${file}\n`)
  out('```')

  const v = probe(path, [
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_frames,color_primaries,color_transfer,color_space,color_range',
    '-of',
    'default=noprint_wrappers=1',
  ])
  const a = probe(path, [
    '-select_streams',
    'a:0',
    '-show_entries',
    'stream=codec_name,sample_rate,channels,bit_rate,duration',
    '-of',
    'default=noprint_wrappers=1',
  ])
  const dur = parseFloat(
    probe(path, ['-select_streams', 'v:0', '-show_entries', 'stream=duration', '-of', 'csv=p=0']),
  )
  const containerDur = parseFloat(
    probe(path, ['-show_entries', 'format=duration', '-of', 'csv=p=0']),
  )
  const get = (block: string, key: string) =>
    block
      .split('\n')
      .find((l) => l.startsWith(`${key}=`))
      ?.split('=')[1] ?? ''

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
  else
    pass(
      `picture ${dur.toFixed(6)} s (container ${containerDur.toFixed(3)} s incl. AAC padding)`,
    )

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
    '-nostats',
    '-i',
    path,
    '-vf',
    'blackdetect=d=0.05:pix_th=0.05',
    '-f',
    'null',
    '-',
  ])
    .split('\n')
    .filter((l) => l.includes('black_start'))
  if (black.length) fail('blackdetect', `${black.length} hit(s): ${black[0].trim()}`)
  else pass('blackdetect (pix_th=0.05): zero hits over the full timeline')

  // -------------------------------------------------------------------------
  // 2. The film turns — measured, not asserted.
  //
  // Mean luma per frame across the whole timeline. The light half plays a
  // white-surfaced phone on a graphite stage and the dark half a black-surfaced
  // phone on a near-black one, so the hinge is plainly visible in this series.
  // The check is that the light half is decisively brighter, and that the
  // crossing between the two levels happens inside the dissolve the edit
  // declares in `DAYLIGHT_TURN` — a turn that drifted out of its own dissolve
  // would mean the stage and the picture had come apart.
  // -------------------------------------------------------------------------
  const ys = sh('ffmpeg', [
    '-nostats',
    '-i',
    path,
    '-vf',
    'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
    '-f',
    'null',
    '-',
  ])
    .split('\n')
    .filter((l) => l.includes('YAVG'))
    .map((l) => parseFloat(l.split('=').pop() as string))
    .filter((n) => !Number.isNaN(n))

  if (ys.length) {
    const min = Math.min(...ys)
    const argmin = ys.indexOf(min)
    if (min < 16)
      fail('darkest frame', `mean luma ${min.toFixed(1)} at frame ${argmin} — at or below true black`)
    else pass(`darkest frame mean luma ${min.toFixed(1)}/255 at frame ${argmin} (true black ≈ 16)`)

    const mean = (from: number, to: number) => {
      const slice = ys.slice(from, to).filter((n) => !Number.isNaN(n))
      return slice.reduce((s, n) => s + n, 0) / Math.max(1, slice.length)
    }
    // Sampled well inside each half, clear of the preamble, the hinge and the
    // outro. The light half runs 100–760 and the dark half 790–1450.
    const light = mean(120, 740)
    const dark = mean(820, 1440)
    if (!(light > dark + 4))
      fail(
        'light → dark',
        `light half mean luma ${light.toFixed(2)}, dark half ${dark.toFixed(
          2,
        )} — the halves are not distinguishable`,
      )
    else
      pass(
        `light half mean luma ${light.toFixed(2)} vs dark half ${dark.toFixed(2)} (Δ ${(
          light - dark
        ).toFixed(2)})`,
      )

    // Where the series actually crosses the midpoint between the two levels.
    const mid = (light + dark) / 2
    let crossing = -1
    for (let f = 700; f < 850 && f < ys.length; f++) {
      if (ys[f] <= mid) {
        crossing = f
        break
      }
    }
    if (crossing < 0)
      fail('hinge', `luma never crosses the ${mid.toFixed(2)} midpoint inside chapter V (700–850)`)
    else if (crossing < DAYLIGHT_TURN.from - 6 || crossing > DAYLIGHT_TURN.to + 6)
      fail(
        'hinge',
        `turn crosses at frame ${crossing}, outside the declared dissolve ${DAYLIGHT_TURN.from}–${DAYLIGHT_TURN.to}`,
      )
    else
      pass(
        `turn crosses the midpoint at frame ${crossing}, inside the declared dissolve ${DAYLIGHT_TURN.from}–${DAYLIGHT_TURN.to}`,
      )
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
    '-y',
    '-v',
    'error',
    '-i',
    path,
    '-vf',
    `select=eq(n\\,${markFrame})`,
    '-vsync',
    '0',
    '-frames:v',
    '1',
    rawPng,
  ])
  const raw = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', rawPng, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    {maxBuffer: 512 * 1024 * 1024},
  ).stdout
  {
    // The mark is drawn at 58 * u, where u = (min(w,h)/1080) * typeScale.
    const typeScale = w === 1920 ? 1 : h === 1920 ? 1.34 : 1.16
    const markH = 58 * (Math.min(w, h) / 1080) * typeScale

    let top = -1
    for (let y = 0; y < h && top === -1; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3
        if (Math.min(raw[i], raw[i + 1], raw[i + 2]) > 180) {
          top = y
          break
        }
      }
    }
    const bandEnd = top + markH * 0.92
    let sr = 0,
      sg = 0,
      sb = 0,
      n = 0
    for (let y = top; y >= 0 && y < Math.min(h, Math.round(bandEnd)); y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3
        const r = raw[i],
          g = raw[i + 1],
          b = raw[i + 2]
        if (Math.min(r, g, b) > 180) {
          sr += r
          sg += g
          sb += b
          n++
        }
      }
    }
    if (top < 0 || !n) {
      fail('mark colour', `no mark pixels found in the outro frame ${markFrame}`)
    } else {
      const mr = sr / n,
        mg = sg / n,
        mb = sb / n
      if (mg > mr || mb > mr)
        fail(
          'mark colour',
          `mark body rgb(${mr.toFixed(1)},${mg.toFixed(1)},${mb.toFixed(
            1,
          )}) is not warm off-white — a green/mint mark would look like this`,
        )
      else if (mr - mb < 4 || mr - mb > 30)
        fail(
          'mark colour',
          `mark body rgb(${mr.toFixed(1)},${mg.toFixed(1)},${mb.toFixed(1)}), R−B=${(
            mr - mb
          ).toFixed(1)} — expected ≈13 for #F7F4EA`,
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
  // chapter, both sides of the hinge and its midpoint, and the branded ending.
  const sampleAt = [
    2, 40, 70, 96, 110, 180, 330, 480, 630, 740, 762, 775, 788, 830, 930, 1080, 1250, 1400, 1470,
    1520, 1580, 1645,
  ]
  for (const f of sampleAt) {
    sh('ffmpeg', [
      '-y',
      '-v',
      'error',
      '-i',
      path,
      '-vf',
      `select=eq(n\\,${f})`,
      '-vsync',
      '0',
      '-frames:v',
      '1',
      '-q:v',
      '2',
      join(STILL_DIR, `${stem}-f${String(f).padStart(4, '0')}.jpg`),
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
  `# OpenScout — daylight · validation\n\n` +
    `\`bun run scripts/validate-openscout-daylight.ts\`\n\n` +
    `Expected: 1650 frames, 55.000000 s, 30 fps, H.264 yuv420p, BT.709 on all three\n` +
    `signalling fields, faststart, AAC audio, no black frames, canonical #F7F4EA mark,\n` +
    `a score identical to the refined cut's in asset, gain and runtime, the light For You\n` +
    `feed redacted wherever it plays, and a measured light→dark turn landing inside the\n` +
    `dissolve the edit declares.\n` +
    `${lines.join('\n')}\n`,
)
console.log(`\n[report] ${REPORT}`)

if (failures) process.exit(1)
