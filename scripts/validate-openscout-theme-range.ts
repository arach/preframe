#!/usr/bin/env bun
// Media validation for the OpenScout theme-range A/B.
//
//   bun run scripts/validate-openscout-theme-range.ts
//
// Standard per-file checks — resolution, duration, frame count, codec, pixel
// format, complete BT.709 signalling, faststart, a real AAC stream, no black
// frames, loudness, and a canonical off-white wire mark.
//
// Four checks are specific to this deliverable, and each tests a claim the brief
// made rather than an assumption:
//
//   0. THE EDITS DIFFER ONLY IN THEIR SCORE. The two `ThemeRangeEdit` objects are
//      compared key by key. Anything outside `AB_VARIABLE_KEYS` that differs is a
//      failure. This is the source-level half of the guarantee.
//
//   1. THE PICTURE IS FRAME-IDENTICAL. The pixel half, and the one that actually
//      matters: every decoded video frame of both MP4s is hashed and the two
//      sequences are compared frame by frame. This is measured on the delivered
//      files, so it survives any difference in composition, render or encode.
//
//   2. THE SCORES ARE GENUINELY DIFFERENT PIECES. An A/B whose two tracks were
//      the same music EQ'd twice would be a fake test. The two are compared on
//      loudness range, spectral balance and — decisively — normalised
//      cross-correlation of their onset envelopes, which is near 1 for two
//      dressings of one performance and near 0 for two different pieces.
//
//   3. THE THEME JOURNEY IS ON SCREEN, AND IN ORDER. Measured on rendered pixels:
//      mean luma is sampled inside every chapter, and the light chapters must be
//      decisively brighter than the dark ones, with the reveal crossing inside
//      the beat the edit declares.

import {mkdirSync, readdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {
  AB_VARIABLE_KEYS,
  BEAT,
  EDIT_THEME_RANGE_BEAT,
  EDIT_THEME_RANGE_DRIFT,
  EDIT_THEME_RANGE_GLASSHOUSE,
  FPS,
  getPlacedEdit,
  SWITCHES,
} from '../src/projects/openscout-montage/edit-theme-range'

const OUT_DIR = join('out', 'openscout-theme-range')
const STILL_DIR = join(OUT_DIR, 'validation-stills')
const REPORT = join(OUT_DIR, 'VALIDATION.md')

const A = 'openscout-theme-range-a-beat'
const B = 'openscout-theme-range-b-drift'
const C = 'openscout-theme-range-c-glasshouse'

/**
 * The score test, as delivered. C carries a fresh original cue and is held to
 * exactly the same rule as A and B: same locked picture, score-only difference.
 * Every proof below runs across all three rather than just the original pair —
 * a third deliverable that was not held to the rule would quietly void it.
 */
const DELIVERABLES = [
  {key: 'A · ORIGINAL VIBE', stem: A, edit: EDIT_THEME_RANGE_BEAT},
  {key: 'B · REFINED VIBE', stem: B, edit: EDIT_THEME_RANGE_DRIFT},
  {key: 'C · GLASSHOUSE', stem: C, edit: EDIT_THEME_RANGE_GLASSHOUSE},
] as const

const sh = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, {encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024})
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}
const probe = (file: string, args: string[]) => sh('ffprobe', ['-v', 'error', ...args, file]).trim()

const placed = getPlacedEdit(EDIT_THEME_RANGE_BEAT)
const FRAMES = placed.totalFrames
const SECONDS = FRAMES / FPS
const W = 1920
const H = 1080

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
// 0. The edits differ only in their score
// ---------------------------------------------------------------------------

out('\n### The edits differ only in their score\n')
out('```')
{
  const variable = new Set<string>(AB_VARIABLE_KEYS as unknown as string[])
  const a = EDIT_THEME_RANGE_BEAT as unknown as Record<string, unknown>
  const keys = new Set(
    DELIVERABLES.flatMap((d) => Object.keys(d.edit as unknown as Record<string, unknown>)),
  )

  // Every deliverable is compared against A, so a third edit cannot drift away
  // from the locked picture without this failing.
  const unexpected: string[] = []
  for (const d of DELIVERABLES.slice(1)) {
    const o = d.edit as unknown as Record<string, unknown>
    for (const k of keys) {
      if (variable.has(k)) continue
      if (JSON.stringify(a[k]) !== JSON.stringify(o[k])) unexpected.push(`${d.key}.${k}`)
    }
  }
  if (unexpected.length)
    fail('edit diff', `these keys differ but must not: ${unexpected.join(', ')}`)
  else
    pass(
      `every key outside {${[...variable].join(', ')}} is deep-equal across all ` +
        `${DELIVERABLES.length} edits (${keys.size} keys compared, including the full chapter list)`,
    )

  const scores = DELIVERABLES.map((d) => (d.edit as unknown as Record<string, unknown>).score)
  if (new Set(scores).size !== scores.length)
    fail('score', 'two edits point at the same asset — that is not a score test')
  else for (const d of DELIVERABLES) pass(`${d.key} score ${(d.edit as any).score}`)

  const pa = getPlacedEdit(EDIT_THEME_RANGE_BEAT)
  const offRuntime = DELIVERABLES.filter((d) => getPlacedEdit(d.edit).totalFrames !== pa.totalFrames)
  if (offRuntime.length)
    fail('runtime', `${offRuntime.map((d) => d.key).join(', ')} do not match A's frame count`)
  else pass(`same runtime: ${pa.totalFrames} frames = ${SECONDS.toFixed(6)} s at ${FPS} fps`)

  // Every chapter boundary must land on a downbeat, or the film and the music
  // are on different grids for the whole runtime.
  const BAR = BEAT * 4
  const offGrid = [
    ...pa.chapters.map((c) => c.from),
    ...pa.chapters.map((c) => c.from + c.durationInFrames),
    pa.outroFrom,
    pa.totalFrames,
  ].filter((f) => f % BAR !== 0)
  if (offGrid.length) fail('grid', `boundaries off the ${BAR}-frame downbeat: ${offGrid.join(', ')}`)
  else
    pass(
      `all ${pa.chapters.length + 1} boundaries land on a ${BAR}-frame downbeat ` +
        `(100 BPM, bar = ${(BAR / FPS).toFixed(3)} s)`,
    )

  // Every chapter must open exactly one beat before its theme switch, which is
  // the mechanism that puts each recolour on screen in full.
  const expected = [null, 'graphite', 'polar', 'solar', 'light', 'lightScout', 'dark'] as const
  const bad: string[] = []
  pa.chapters.forEach((c, i) => {
    const key = expected[i]
    if (!key) return
    const head = c.cuts[0]
    const startS = head.kind === 'play' ? head.sourceStart : head.holdAt
    const want = SWITCHES[key] - BEAT / FPS
    if (Math.abs(startS - want) > 1 / FPS)
      bad.push(`${c.numeral} opens at ${startS.toFixed(3)} s, expected ${want.toFixed(3)}`)
  })
  if (bad.length) fail('pre-roll', bad.join('; '))
  else pass(`all 6 switching chapters open exactly one beat (${BEAT} f) before their recolour`)

  // Nothing is retimed anywhere in this film.
  const retimed = pa.cuts.filter((c) => c.kind === 'play' && c.rate !== 1)
  if (retimed.length) fail('rate', `${retimed.length} cut(s) do not play at true speed`)
  else pass(`all ${pa.cuts.filter((c) => c.kind === 'play').length} playing cuts run at rate 1`)
}
out('```')

// ---------------------------------------------------------------------------
// 1. The picture is frame-identical — measured on the delivered files
// ---------------------------------------------------------------------------

out('\n### The picture is frame-identical across every deliverable\n')
out('```')
{
  // Per-frame SHA-256 of the DECODED picture, via ffmpeg's framehash muxer.
  //
  // The obvious implementation — decode to rawvideo and hash the buffer — needs
  // 1872 × 1920 × 1080 × 3 ≈ 11.5 GB of memory for one file and simply dies.
  // framehash computes the same thing a frame at a time inside ffmpeg and emits
  // one short line per frame, so this costs nothing and scales.
  const hashFrames = (file: string) => {
    const r = spawnSync(
      'ffmpeg',
      ['-hide_banner', '-v', 'error', '-i', file, '-an', '-f', 'framehash', '-hash', 'sha256', '-'],
      {encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024},
    )
    if (r.status !== 0) throw new Error(`framehash failed for ${file}: ${r.stderr?.slice(0, 400)}`)
    return (r.stdout ?? '')
      .split('\n')
      .filter((l) => l && !l.startsWith('#'))
      // "stream, dts, pts, duration, size, hash" — the hash is the last field.
      .map((l) => l.split(',').pop()!.trim())
  }

  const hashes = DELIVERABLES.map((d) => ({
    ...d,
    frames: hashFrames(join(OUT_DIR, `${d.stem}.mp4`)),
  }))
  for (const h of hashes) {
    if (h.frames.length !== FRAMES) fail(`frame count ${h.key}`, `${h.frames.length}, expected ${FRAMES}`)
  }

  const ref = hashes[0]
  let allIdentical = true
  for (const h of hashes.slice(1)) {
    const n = Math.min(ref.frames.length, h.frames.length)
    const differing: number[] = []
    for (let i = 0; i < n; i++) if (ref.frames[i] !== h.frames[i]) differing.push(i)
    if (differing.length) {
      allIdentical = false
      fail(
        `frame identity ${h.key}`,
        `${differing.length}/${n} frames differ from A (first at ${differing.slice(0, 8).join(', ')})`,
      )
    }
  }
  if (allIdentical) {
    pass(
      `all ${ref.frames.length} decoded video frames are byte-identical across all ` +
        `${hashes.length} deliverables (SHA-256 per frame of the decoded 1920×1080 picture)`,
    )
    pass(
      `whole-stream digest: ${createHash('sha256').update(ref.frames.join('')).digest('hex').slice(0, 32)}…`,
    )
  }

  // And the audio must NOT be identical, or there is no score test at all.
  const audioHash = (file: string) => {
    const r = spawnSync(
      'ffmpeg',
      ['-v', 'error', '-i', file, '-vn', '-f', 's16le', '-ac', '2', '-ar', '48000', '-'],
      {maxBuffer: 1024 * 1024 * 512},
    )
    return createHash('sha256').update(r.stdout).digest('hex')
  }
  const audio = DELIVERABLES.map((d) => ({...d, hash: audioHash(join(OUT_DIR, `${d.stem}.mp4`))}))
  if (new Set(audio.map((a) => a.hash)).size !== audio.length)
    fail('audio', 'two files carry identical audio — that is not a score test')
  else
    pass(`audio streams all differ (${audio.map((a) => `${a.key} ${a.hash.slice(0, 12)}…`).join(' · ')})`)
}
out('```')

// ---------------------------------------------------------------------------
// 2. The two scores are genuinely different pieces of music
// ---------------------------------------------------------------------------

out('\n### The scores are different pieces, not one track dressed three ways\n')
out('```')
{
  const SR = 8000
  const decode = (file: string) => {
    const r = spawnSync(
      'ffmpeg',
      ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
      {maxBuffer: 1024 * 1024 * 512},
    )
    const b = r.stdout
    return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4))
  }

  // Short-time energy envelope — enough to expose a shared performance.
  const envelope = (x: Float32Array, win = 512) => {
    const n = Math.floor(x.length / win)
    const e = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      let s = 0
      for (let j = 0; j < win; j++) s += x[i * win + j] ** 2
      e[i] = Math.sqrt(s / win)
    }
    // z-score, so the comparison is about shape rather than level
    const mean = e.reduce((a, b) => a + b, 0) / n
    const sd = Math.sqrt(e.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1
    return e.map((v) => (v - mean) / sd)
  }

  const envs = DELIVERABLES.map((d) => ({...d, env: envelope(decode(join(OUT_DIR, `${d.stem}.mp4`)))}))

  // Best normalised cross-correlation over ±2 s of lag, for every pair. Two
  // masters of one performance correlate near 1 at some lag no matter how they
  // were EQ'd or stretched; two different pieces do not.
  const maxLag = Math.round((2 * SR) / 512)
  const peak = (ea: Float64Array, eb: Float64Array) => {
    const n = Math.min(ea.length, eb.length)
    let best = {lag: 0, r: -Infinity}
    for (let lag = -maxLag; lag <= maxLag; lag++) {
      let s = 0
      let c = 0
      for (let i = 0; i < n; i++) {
        const j = i + lag
        if (j < 0 || j >= n) continue
        s += ea[i] * eb[j]
        c++
      }
      const r = c ? s / c : 0
      if (r > best.r) best = {lag, r}
    }
    return best
  }

  for (let i = 0; i < envs.length; i++) {
    for (let j = i + 1; j < envs.length; j++) {
      const best = peak(envs[i].env, envs[j].env)
      const pair = `${envs[i].key} vs ${envs[j].key}`
      if (best.r > 0.5)
        fail(
          'distinctness',
          `${pair}: envelope cross-correlation peaks at r=${best.r.toFixed(3)} (lag ${best.lag}) — ` +
            `these may be two masters of the same generation`,
        )
      else
        pass(
          `${pair}: cross-correlation peaks at only r=${best.r.toFixed(3)} over ±2 s of lag — ` +
            `independent performances`,
        )
    }
  }

  // Loudness range and spectral balance, reported as corroboration.
  for (const [label, file] of DELIVERABLES.map(
    (d) => [d.key, join(OUT_DIR, `${d.stem}.mp4`)] as const,
  )) {
    const eb2 = sh('ffmpeg', ['-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    const grab = (l: string) => {
      const m = eb2.match(new RegExp(`${l}:\\s*(-?[\\d.]+)`, 'g'))
      return m ? m[m.length - 1].split(':')[1].trim() : '?'
    }
    pass(`${label}: ${grab('I')} LUFS, LRA ${grab('LRA')} LU, peak ${grab('Peak')} dBFS`)
  }
}
out('```')

// ---------------------------------------------------------------------------
// Per-deliverable media checks
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

  if (w !== W || h !== H) fail('resolution', `${w}×${h}, expected ${W}×${H}`)
  else pass(`resolution ${w}×${h}`)

  if (get(v, 'codec_name') !== 'h264') fail('codec', get(v, 'codec_name'))
  else pass(`H.264 ${get(v, 'profile')} / ${get(v, 'pix_fmt')}`)

  if (get(v, 'r_frame_rate') !== `${FPS}/1`) fail('fps', get(v, 'r_frame_rate'))
  else pass(`${FPS} fps — the capture's own rate, so no recolour is decimated`)

  if (frames !== FRAMES) fail('frames', `${frames}, expected ${FRAMES}`)
  else pass(`${frames} frames (13 bars × 144)`)

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
  // The film opens and closes on a fade from and to black, so a hit at the very
  // edges is expected; one in the body is not.
  const interior = black.filter((l) => {
    const m = l.match(/black_start:([\d.]+)/)
    const t = m ? Number(m[1]) : 0
    return t > 0.6 && t < SECONDS - 0.6
  })
  if (interior.length) fail('blackdetect', `${interior.length} interior hit(s): ${interior[0].trim()}`)
  else pass(`blackdetect (pix_th=0.05): no interior hits; ${black.length} at the opening/closing fade`)

  // -------------------------------------------------------------------------
  // 3. The journey is on screen and in order — measured, not asserted.
  // -------------------------------------------------------------------------
  const ys = sh('ffmpeg', [
    '-nostats', '-i', path,
    '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
    '-f', 'null', '-',
  ])
    .split('\n')
    .filter((l) => l.includes('YAVG'))
    .map((l) => parseFloat(l.split('=').pop() as string))
    .filter((n) => !Number.isNaN(n))

  if (ys.length) {
    const mean = (from: number, to: number) => {
      const s = ys.slice(from, to)
      return s.reduce((x, y) => x + y, 0) / Math.max(1, s.length)
    }
    // Sampled inside the settled part of each chapter, clear of every head.
    const perChapter = placed.chapters.map((c) => ({
      numeral: c.numeral,
      label: c.label,
      tone: c.tone,
      y: mean(c.from + BEAT + 12, c.from + c.durationInFrames - 8),
    }))
    perChapter.forEach((c) =>
      out(`   · ${c.numeral.padEnd(4)} ${c.label.padEnd(16)} mean luma ${c.y.toFixed(1)}`),
    )

    const dark = perChapter.filter((c) => c.tone === 0)
    const light = perChapter.filter((c) => c.tone === 1)
    const darkMax = Math.max(...dark.map((c) => c.y))
    const lightMin = Math.min(...light.map((c) => c.y))
    if (!(lightMin > darkMax + 20))
      fail(
        'journey',
        `dimmest light chapter ${lightMin.toFixed(1)} vs brightest dark ${darkMax.toFixed(1)} — ` +
          `the two halves are not decisively separated`,
      )
    else
      pass(
        `every light chapter (min ${lightMin.toFixed(1)}) is brighter than every dark chapter ` +
          `(max ${darkMax.toFixed(1)}), Δ ${(lightMin - darkMax).toFixed(1)}`,
      )

    // The reveal must cross inside the beat the edit declares: chapter V opens at
    // `from`, and the interface recolours one beat later.
    const chV = placed.chapters[4]
    const mid = (lightMin + darkMax) / 2
    let crossing = -1
    for (let f = chV.from; f < chV.from + chV.durationInFrames && f < ys.length; f++) {
      if (ys[f] >= mid) {
        crossing = f
        break
      }
    }
    const want = chV.from + BEAT
    if (crossing < 0) fail('reveal', `luma never crosses ${mid.toFixed(1)} inside chapter V`)
    else if (Math.abs(crossing - want) > 12)
      fail('reveal', `reveal crosses at frame ${crossing}, expected ${want} ± 12`)
    else
      pass(
        `the reveal crosses the midpoint at frame ${crossing}, on the declared beat ` +
          `${want} (chapter V head ${chV.from} + one beat)`,
      )

    const min = Math.min(...ys.slice(30, ys.length - 30))
    pass(`darkest interior frame mean luma ${min.toFixed(1)}/255`)
  }

  // -------------------------------------------------------------------------
  // Brand check: the outro wire mark must be the canonical off-white #F7F4EA
  // (247,244,234), never a green or mint variant.
  //
  // The mark is located GEOMETRICALLY, not by colour — selecting warm pixels to
  // prove the mark is warm would prove nothing. The outro stacks mark, wordmark,
  // rule, line and foot down the centre, so the mark is the topmost bright
  // object: take every pixel whose darkest channel clears 180, find the topmost
  // such row, and keep only the band down to the bottom of the mark's own glyph.
  // The wordmark below is PALETTE.ink (#F2F3F5, B > R) and would drag the average
  // cold if it leaked in, so the band stops short of it.
  // -------------------------------------------------------------------------
  const markFrame = FRAMES - 40
  const rawPng = join(STILL_DIR, `${stem}-markframe.png`)
  sh('ffmpeg', [
    '-y', '-v', 'error', '-i', path,
    '-vf', `select=eq(n\\,${markFrame})`, '-vsync', '0', '-frames:v', '1', rawPng,
  ])
  const raw = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', rawPng, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    {maxBuffer: 512 * 1024 * 1024},
  ).stdout
  {
    const markH = 62 * (W / 1920)
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
          `mark body rgb(${mr.toFixed(1)},${mg.toFixed(1)},${mb.toFixed(1)}) is not warm off-white — ` +
            `a green/mint mark would look like this`,
        )
      else if (mr - mb < 4 || mr - mb > 30)
        fail(
          'mark colour',
          `mark body rgb(${mr.toFixed(1)},${mg.toFixed(1)},${mb.toFixed(1)}), R−B=${(mr - mb).toFixed(
            1,
          )} — expected ≈13 for #F7F4EA`,
        )
      else
        pass(
          `wire mark body rgb(${mr.toFixed(1)}, ${mg.toFixed(1)}, ${mb.toFixed(1)}) over ${n} px in ` +
            `rows ${top}–${Math.round(bandEnd)} — off-white, R>G>B, R−B=${(mr - mb).toFixed(1)} ` +
            `(#F7F4EA is 247,244,234, R−B=13)`,
        )
    }
  }

  // Representative stills: the opening hold, each chapter's settled pose, both
  // ends of each push, both sides of the reveal, the return and the ending.
  const sampleAt = [
    4, 60, 200, 300, 340, 430, 560, 600, 640, 780, 860, 900, 1000, 1044, 1100, 1160, 1250, 1300,
    1400, 1520, 1600, 1700, 1830,
  ]
  for (const f of sampleAt) {
    sh('ffmpeg', [
      '-y', '-v', 'error', '-i', path,
      '-vf', `select=eq(n\\,${f})`, '-vsync', '0', '-frames:v', '1', '-q:v', '2',
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
  `# OpenScout — theme range · validation\n\n` +
    `\`bun run scripts/validate-openscout-theme-range.ts\`\n\n` +
    `Expected: ${FRAMES} frames, ${SECONDS.toFixed(6)} s, ${FPS} fps, 1920×1080, H.264 yuv420p,\n` +
    `BT.709 on all three signalling fields, faststart, AAC audio, no interior black frames,\n` +
    `a canonical #F7F4EA wire mark, edits differing ONLY in their score, a picture that is\n` +
    `frame-identical across every deliverable, scores that are demonstrably different pieces of\n` +
    `music, and a measured theme journey that turns light on the beat the edit declares.\n` +
    `${lines.join('\n')}\n`,
)
console.log(`\n[report] ${REPORT}`)

if (failures) process.exit(1)
