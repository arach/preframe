#!/usr/bin/env bun
// Masters the two generated scores into the durable film assets.
//
//   bun run scripts/master-theme-range-scores.ts
//
// Both are cut to EXACTLY the film's runtime — 1872 frames at 60 fps =
// 31.200000 s — so the A/B differs in sound and in nothing else.
//
// BEAT is the one that has to agree with the picture. It was generated at a
// measured 105.08 BPM against a requested 100 (MiniMax does not honour tempo
// requests). Rather than rebuild the film around an
// awkward number, BEAT is nudged by atempo to exactly 100.000 BPM, which makes a
// 4/4 bar 2.400 s and, at 60 fps, exactly 144 frames — the film's `BAR`.
//
// The window is then SNAPPED TO A REAL DOWNBEAT rather than cut at a round
// number of seconds. The beat phase is measured from the onset envelope, and the
// bar phase is taken as the beat position carrying the most onset energy — the
// kick. Cutting a bar-locked film at an arbitrary offset would put every chapter
// boundary a fraction of a beat off for the whole runtime, which is exactly the
// error this film cannot afford.
//
// DRIFT has no pulse to align, so it is cut for shape instead: it opens in the
// quietest part of the sustained section, blooms through the reveal, and is
// taken from a window that decays naturally rather than one that ends on a rise.
//
// Chain for both: window → (atempo, BEAT only) → loudnorm → fades → 48 kHz
// 24-bit stereo WAV. Provenance is written next to each asset.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const FPS = 60
const FRAMES = 1872
const RUNTIME = FRAMES / FPS // 31.200000 s
const OUT_DIR = join('public', 'tracks', 'openscout')

const sh = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { encoding: 'utf-8', maxBuffer: 512 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr?.slice(0, 4000)}`)
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}

const sha256 = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

const probeDuration = (p: string) =>
  Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).trim())

// ---------------------------------------------------------------------------
// Beat-phase measurement — where the downbeats actually are.
// ---------------------------------------------------------------------------

const SR = 8000
const HOP = 64
const FFT = 512

function onsetEnvelope(file: string) {
  const dec = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
    { maxBuffer: 1024 * 1024 * 1024 },
  )
  if (dec.status !== 0) throw new Error('decode failed')
  const buf = dec.stdout
  const a = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4))

  const hann = new Float32Array(FFT)
  for (let i = 0; i < FFT; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT - 1))
  const BINS = FFT / 2
  const cosT: Float32Array[] = []
  const sinT: Float32Array[] = []
  for (let k = 0; k < BINS; k++) {
    const c = new Float32Array(FFT)
    const s = new Float32Array(FFT)
    for (let n = 0; n < FFT; n++) {
      const ang = (2 * Math.PI * k * n) / FFT
      c[n] = Math.cos(ang)
      s[n] = Math.sin(ang)
    }
    cosT.push(c)
    sinT.push(s)
  }

  const nFrames = Math.max(0, Math.floor((a.length - FFT) / HOP))
  const flux = new Float32Array(nFrames)
  let prev = new Float32Array(BINS)
  for (let f = 0; f < nFrames; f++) {
    const off = f * HOP
    const mag = new Float32Array(BINS)
    for (let k = 0; k < BINS; k++) {
      let re = 0
      let im = 0
      const c = cosT[k]
      const s = sinT[k]
      for (let n = 0; n < FFT; n++) {
        const v = a[off + n] * hann[n]
        re += v * c[n]
        im -= v * s[n]
      }
      mag[k] = Math.log1p(1000 * Math.sqrt(re * re + im * im))
    }
    let sum = 0
    for (let k = 0; k < BINS; k++) {
      const d = mag[k] - prev[k]
      if (d > 0) sum += d
    }
    flux[f] = sum
    prev = mag
  }
  return { env: flux, framesPerSec: SR / HOP }
}

/**
 * Given a known tempo, find the phase (in seconds) of the beat grid and of the
 * bar grid, measured over `[from, to]`.
 */
function measurePhase(file: string, bpm: number, from: number, to: number) {
  const { env, framesPerSec } = onsetEnvelope(file)
  const beatS = 60 / bpm
  const beatF = beatS * framesPerSec
  const lo = Math.round(from * framesPerSec)
  const hi = Math.min(env.length, Math.round(to * framesPerSec))

  // Beat phase: try every offset within one beat, score the summed onset energy
  // landing on the grid.
  let bestBeat = { phase: 0, score: -Infinity }
  for (let p = 0; p < beatF; p += 0.25) {
    let s = 0
    for (let t = lo + p; t < hi; t += beatF) {
      const i = Math.round(t)
      if (i >= 0 && i < env.length) s += env[i]
    }
    if (s > bestBeat.score) bestBeat = { phase: p, score: s }
  }

  // Bar phase: of the four beats in a bar, which carries the most energy.
  const barScores = [0, 0, 0, 0]
  let n = 0
  for (let t = lo + bestBeat.phase; t < hi; t += beatF) {
    const i = Math.round(t)
    if (i >= 0 && i < env.length) barScores[n % 4] += env[i]
    n++
  }
  const downbeatIndex = barScores.indexOf(Math.max(...barScores))

  const firstBeatS = (lo + bestBeat.phase) / framesPerSec
  const firstDownbeatS = firstBeatS + downbeatIndex * beatS
  return { firstDownbeatS, beatS, barScores, downbeatIndex }
}

/** The downbeat at or after `target`. */
const snapToDownbeat = (firstDownbeatS: number, barS: number, target: number) => {
  const k = Math.ceil((target - firstDownbeatS) / barS - 1e-9)
  return firstDownbeatS + k * barS
}

// ---------------------------------------------------------------------------
// Master
// ---------------------------------------------------------------------------

type Spec = {
  variant: 'beat' | 'drift'
  raw: string
  out: string
  /** Where the window wants to start; BEAT snaps this to a downbeat. */
  wantStart: number
  /** atempo factor, 1 for no change. */
  atempo: number
  fadeIn: number
  fadeOut: number
  /** loudnorm target — DRIFT sits lower and wider, it is not competing with a beat. */
  I: number
  LRA: number
  why: string
}

const RAW_BEAT = 'public/tracks/generated/openscout-theme-range-beat-mstrn9f1.mp3'
const RAW_DRIFT = 'public/tracks/generated/openscout-theme-range-drift-mstrqlig.mp3'

const MEASURED_BEAT_BPM = 105.08
const TARGET_BPM = 100.0

const SPECS: Spec[] = [
  {
    variant: 'beat',
    raw: RAW_BEAT,
    out: join(OUT_DIR, 'openscout-theme-range-beat.wav'),
    // The replacement generation settles into its strongest sustained section
    // after ~42 s. Start there, with ample material on either side, so the film
    // gets the dry pulse rather than the exploratory opening.
    wantStart: 48.0,
    atempo: TARGET_BPM / MEASURED_BEAT_BPM,
    fadeIn: 0.25,
    fadeOut: 2.4,
    I: -16.5,
    LRA: 7,
    why: 'Beat-forward cut: window inside the locked groove, snapped to a measured downbeat so the film’s 144-frame bar grid and the music’s bars are the same grid.',
  },
  {
    variant: 'drift',
    raw: RAW_DRIFT,
    out: join(OUT_DIR, 'openscout-theme-range-drift.wav'),
    // Cut for shape, not for grid. The replacement's mature spatial section
    // begins around 84 s: granular events emerge from negative space without
    // introducing a melodic lead, then leave room for the final mark.
    wantStart: 84.0,
    atempo: 1,
    fadeIn: 1.2,
    fadeOut: 4.0,
    I: -19.0,
    LRA: 11,
    why: 'Ambient cut: no pulse to align, so the window is chosen for arc — quiet open, bloom under the reveal, natural decay into the tail.',
  },
]

mkdirSync(OUT_DIR, { recursive: true })

const report: any[] = []

for (const spec of SPECS) {
  if (!existsSync(spec.raw)) throw new Error(`Missing raw generation: ${spec.raw}`)
  console.log(`\n[master:${spec.variant}] ${spec.raw}`)

  let start = spec.wantStart
  let phase: ReturnType<typeof measurePhase> | null = null

  if (spec.variant === 'beat') {
    // Phase is measured on the RAW file, then mapped through atempo: a time t in
    // the raw lands at t / atempo in the stretched file.
    phase = measurePhase(spec.raw, MEASURED_BEAT_BPM, 42, 110)
    const barSraw = phase.beatS * 4
    const wantRaw = spec.wantStart * spec.atempo
    const snappedRaw = snapToDownbeat(phase.firstDownbeatS, barSraw, wantRaw)
    start = snappedRaw
    console.log(
      `[master:beat] first downbeat ${phase.firstDownbeatS.toFixed(4)} s, bar ${barSraw.toFixed(4)} s ` +
        `(beat energy by position: ${phase.barScores.map((s) => s.toFixed(0)).join(' / ')})`,
    )
    console.log(`[master:beat] window snapped ${wantRaw.toFixed(4)} → ${snappedRaw.toFixed(4)} s (raw timebase)`)
  }

  // Take enough raw material that the post-atempo window is complete.
  const rawLen = RUNTIME * spec.atempo + 1.0

  // Two-pass loudnorm. Pass one measures the window that will actually be used;
  // pass two is given those measurements and runs in `linear` mode, which applies
  // a single static gain instead of riding the level. That distinction matters
  // here: single-pass loudnorm flattened BEAT to 1.1 LU of range, which is the
  // opposite of "elegant rather than generic", and would have hollowed out DRIFT's
  // whole reason for existing. The film wants the music's own dynamics, placed —
  // not compressed.
  const headFilters = [
    spec.atempo !== 1 ? `atempo=${spec.atempo.toFixed(9)}` : null,
    `atrim=0:${RUNTIME.toFixed(6)}`,
  ]
    .filter(Boolean)
    .join(',')

  const measureOut = sh('ffmpeg', [
    '-v', 'info',
    '-ss', start.toFixed(6),
    '-t', rawLen.toFixed(6),
    '-i', spec.raw,
    '-af', `${headFilters},loudnorm=I=${spec.I}:TP=-1.5:LRA=${spec.LRA}:print_format=json`,
    '-f', 'null', '-',
  ])
  const jsonText = measureOut.slice(measureOut.lastIndexOf('{'), measureOut.lastIndexOf('}') + 1)
  const m = JSON.parse(jsonText) as Record<string, string>
  console.log(
    `[master:${spec.variant}] measured in ${m.input_i} LUFS, LRA ${m.input_lra}, TP ${m.input_tp}, thresh ${m.input_thresh}`,
  )

  const filters = [
    headFilters,
    `loudnorm=I=${spec.I}:TP=-1.5:LRA=${spec.LRA}:linear=true` +
      `:measured_I=${m.input_i}:measured_LRA=${m.input_lra}` +
      `:measured_TP=${m.input_tp}:measured_thresh=${m.input_thresh}`,
    `afade=t=in:st=0:d=${spec.fadeIn}`,
    `afade=t=out:st=${(RUNTIME - spec.fadeOut).toFixed(6)}:d=${spec.fadeOut}`,
    // loudnorm flushes a few hundred samples short of the trim point; apad
    // refills them and the output `-t` caps the result at exactly RUNTIME.
    'apad',
  ].join(',')

  sh('ffmpeg', [
    '-y',
    '-v', 'error',
    '-ss', start.toFixed(6),
    '-t', rawLen.toFixed(6),
    '-i', spec.raw,
    '-af', filters,
    '-t', RUNTIME.toFixed(6),
    '-ar', '48000',
    '-ac', '2',
    '-c:a', 'pcm_s24le',
    spec.out,
  ])

  const dur = probeDuration(spec.out)
  const eb = sh('ffmpeg', ['-nostats', '-i', spec.out, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
  const grab = (label: string) => {
    const m = eb.match(new RegExp(`${label}:\\s*(-?[\\d.]+)`, 'g'))
    return m ? m[m.length - 1].split(':')[1].trim() : '?'
  }

  console.log(`[master:${spec.variant}] ${spec.out}`)
  console.log(
    `[master:${spec.variant}] ${dur.toFixed(6)} s · ${grab('I')} LUFS · LRA ${grab('LRA')} LU · peak ${grab('Peak')} dBFS`,
  )
  if (Math.abs(dur - RUNTIME) > 0.002) {
    throw new Error(`${spec.variant} mastered to ${dur} s, expected ${RUNTIME}`)
  }

  report.push({
    variant: spec.variant,
    asset: spec.out,
    why: spec.why,
    generator: {
      script: 'scripts/generate-theme-range-scores.ts',
      path: 'Preframe’s configured MiniMax Music path (readMusicModelConfig + getMiniMaxApiKey)',
      endpoint: 'https://api.minimax.io/v1/music_generation',
      model: 'music-2.6',
      instrumental: true,
      credential: 'Resolved from MINIMAX_API_KEY in the environment. Never written to disk or logged.',
      prompt_note:
        'BEAT and DRIFT are separate generations from separate prompts with no shared instrumentation, no shared rhythmic layer and different harmonic rates. Neither is an EQ or tempo variant of the other.',
    },
    raw_generation: {
      file: spec.raw,
      sha256: sha256(spec.raw),
      duration_s: probeDuration(spec.raw),
    },
    tempo:
      spec.variant === 'beat'
        ? {
            requested_bpm: 120,
            measured_bpm: MEASURED_BEAT_BPM,
            note: 'MiniMax did not honour the requested tempo. The film was built on the delivered tempo, nudged to a round value.',
            mastered_bpm: TARGET_BPM,
            atempo: spec.atempo,
            consequence:
              'At 100 BPM one 4/4 bar is exactly 2.400 s = 144 frames at 60 fps, so every chapter boundary in the edit lands on a downbeat.',
            first_downbeat_raw_s: phase?.firstDownbeatS,
            downbeat_beat_index: phase?.downbeatIndex,
          }
        : { note: 'Ambient, no pulse. No tempo alignment applied or needed.' },
    mastering: {
      window_start_s: start,
      window_snapped_to_downbeat: spec.variant === 'beat',
      runtime_s: RUNTIME,
      chain: filters,
      format: '48 kHz, stereo, 24-bit PCM WAV',
      sha256: sha256(spec.out),
    },
    measured: {
      duration_s: dur,
      integrated_lufs: grab('I'),
      lra_lu: grab('LRA'),
      peak_dbfs: grab('Peak'),
    },
  })
}

writeFileSync(
  join(OUT_DIR, 'openscout-theme-range-scores.provenance.json'),
  JSON.stringify(
    {
      film: 'OpenScout — theme range',
      runtime_frames: FRAMES,
      runtime_s: RUNTIME,
      fps: FPS,
      note: 'One locked picture, two scores. These are the only two assets that differ between deliverable A and deliverable B.',
      scores: report,
    },
    null,
    2,
  ),
)
console.log(`\n[done] ${OUT_DIR}/openscout-theme-range-scores.provenance.json`)
