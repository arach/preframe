#!/usr/bin/env bun
// Masters the selected fresh cue into the durable film asset.
//
//   bun run scripts/master-theme-range-vibe-score.ts
//
// Cut to EXACTLY the film's runtime — 1872 frames at 60 fps = 31.200000 s.
//
// ---------------------------------------------------------------------------
// TEMPO — WHY 125.000 AND NOT 100.000
// ---------------------------------------------------------------------------
//
// The picture is locked on a 100 BPM grid: a 4/4 bar is 2.400 s, which at 60 fps
// is exactly 144 frames, and every chapter head is a multiple of it. MiniMax
// does not honour a requested tempo — all three candidates in this pass came
// back near 123.8 BPM regardless of whether 96 or 100 was asked for.
//
// Conforming 123.8 to 100.000 would take an atempo of 0.8075: a 19% slowdown.
// That is enough to smear the transients of a groove-led cue and to turn a
// confident 124 BPM piece into a draggy one — the opposite of the brief. So the
// tempo is conformed UP to a round 125.000 BPM instead, an atempo of ~1.009,
// which is inaudible and artefact-free.
//
// 125 BPM is not an arbitrary round number. One bar is 1.920 s, and five music
// bars are exactly four film bars (9.600 s). With the window snapped so that
// music bar 1 lands on frame 0, a musical downbeat therefore coincides with a
// film chapter head at:
//
//    0.000 s   frame    0   chapter I    · the film opens with the music
//    9.600 s   frame  576   chapter III  · POLAR, the midpoint of the range
//   19.200 s   frame 1152   chapter V    · THE REVEAL — the whole-frame turn
//   28.800 s   frame 1728   inside the outro, under the wire mark
//
// The film's three structural events land on downbeats. The chapters between
// them float against the music, which at 124 BPM over a 100 BPM cut is honest:
// this is a score placed against a locked picture, not a picture built to a
// click. Recorded here rather than claimed as full bar lock.
//
// ---------------------------------------------------------------------------
// WINDOW
// ---------------------------------------------------------------------------
//
// Chosen for arc, then snapped to a measured downbeat. The generation's own
// shape does the work: it sits in a breakdown around 94-97 s, the full groove
// returns at ~98 s, holds through ~117 s, and then thins naturally from 118 s
// into a 14-second decay. Laid against the film that reads as — quiet open under
// the opening type, the groove locking in as the theme range begins, full
// through the reveal, and thinning through the outro under the wire mark.
//
// Chain: window -> atempo -> trim -> two-pass linear loudnorm -> fades ->
// 48 kHz 24-bit stereo WAV. Provenance is written next to the asset.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const FPS = 60
const FRAMES = 1872
const RUNTIME = FRAMES / FPS // 31.200000 s
const OUT_DIR = join('public', 'tracks', 'openscout')

const RAW = 'public/tracks/generated/openscout-vibe-glasshouse-mstvwgk6.mp3'
const OUT = join(OUT_DIR, 'openscout-theme-range-glasshouse.wav')
const SIDECAR = 'public/tracks/generated/openscout-vibe-glasshouse-mstvwgk6.json'

const TARGET_BPM = 125.0
/** Where the window wants to start; snapped to the nearest following downbeat. */
const WANT_START = 94.0
const FADE_IN = 0.5
const FADE_OUT = 3.0
const I = -18.0
const LRA = 9

const sh = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { encoding: 'utf-8', maxBuffer: 512 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr?.slice(0, 4000)}`)
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}
const sha256 = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const probeDuration = (p: string) =>
  Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).trim())

// ---------------------------------------------------------------------------
// Onset envelope — shared by the tempo refinement and the phase measurement.
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

const { env, framesPerSec } = onsetEnvelope(RAW)

/**
 * Refine the delivered tempo over the window that will actually be used. A
 * coarse estimate is fine for choosing a candidate; the conform ratio is not,
 * because a 0.1 BPM error accumulates to a quarter of a beat across 31 seconds.
 */
function refineTempo(from: number, to: number) {
  const lo = Math.round(from * framesPerSec)
  const hi = Math.min(env.length, Math.round(to * framesPerSec))
  const slice = env.slice(lo, hi)
  const mean = slice.reduce((s, v) => s + v, 0) / slice.length
  for (let i = 0; i < slice.length; i++) slice[i] = Math.max(0, slice[i] - mean)

  const ac = (lag: number) => {
    let s = 0
    let n = 0
    for (let i = 0; i + lag < slice.length; i++, n++) s += slice[i] * slice[i + lag]
    return n ? s / n : 0
  }
  let best = { bpm: 0, score: -Infinity }
  for (let bpm = 118; bpm <= 130; bpm += 0.005) {
    const lag = (60 / bpm) * framesPerSec
    let s = 0
    for (const m of [1, 2, 4, 8]) s += ac(Math.round(lag * m))
    if (s > best.score) best = { bpm, score: s }
  }
  return best.bpm
}

/** Phase of the beat grid and of the bar grid, measured over [from, to]. */
function measurePhase(bpm: number, from: number, to: number) {
  const beatS = 60 / bpm
  const beatF = beatS * framesPerSec
  const lo = Math.round(from * framesPerSec)
  const hi = Math.min(env.length, Math.round(to * framesPerSec))

  let bestBeat = { phase: 0, score: -Infinity }
  for (let p = 0; p < beatF; p += 0.25) {
    let s = 0
    for (let t = lo + p; t < hi; t += beatF) {
      const i = Math.round(t)
      if (i >= 0 && i < env.length) s += env[i]
    }
    if (s > bestBeat.score) bestBeat = { phase: p, score: s }
  }

  const barScores = [0, 0, 0, 0]
  let n = 0
  for (let t = lo + bestBeat.phase; t < hi; t += beatF) {
    const i = Math.round(t)
    if (i >= 0 && i < env.length) barScores[n % 4] += env[i]
    n++
  }
  const downbeatIndex = barScores.indexOf(Math.max(...barScores))
  const firstBeatS = (lo + bestBeat.phase) / framesPerSec
  return { firstDownbeatS: firstBeatS + downbeatIndex * beatS, beatS, barScores, downbeatIndex }
}

const snapToDownbeat = (firstDownbeatS: number, barS: number, target: number) => {
  const k = Math.ceil((target - firstDownbeatS) / barS - 1e-9)
  return firstDownbeatS + k * barS
}

// ---------------------------------------------------------------------------

if (!existsSync(RAW)) throw new Error(`Missing raw generation: ${RAW}`)
mkdirSync(OUT_DIR, { recursive: true })

const ANALYSIS_FROM = 96
const ANALYSIS_TO = 126
const measuredBpm = refineTempo(ANALYSIS_FROM, ANALYSIS_TO)
const atempo = TARGET_BPM / measuredBpm
console.log(`[master] measured ${measuredBpm.toFixed(3)} BPM over ${ANALYSIS_FROM}-${ANALYSIS_TO} s`)
console.log(`[master] conform to ${TARGET_BPM.toFixed(3)} BPM · atempo ${atempo.toFixed(9)}`)

const phase = measurePhase(measuredBpm, ANALYSIS_FROM, ANALYSIS_TO)
const barSraw = phase.beatS * 4
const start = snapToDownbeat(phase.firstDownbeatS, barSraw, WANT_START)
console.log(
  `[master] first downbeat ${phase.firstDownbeatS.toFixed(4)} s, bar ${barSraw.toFixed(4)} s ` +
    `(beat energy by position: ${phase.barScores.map((s) => s.toFixed(0)).join(' / ')})`,
)
console.log(`[master] window snapped ${WANT_START.toFixed(4)} → ${start.toFixed(4)} s (raw timebase)`)

// Enough raw material that the post-atempo window is complete.
const rawLen = RUNTIME * atempo + 1.0
const headFilters = [`atempo=${atempo.toFixed(9)}`, `atrim=0:${RUNTIME.toFixed(6)}`].join(',')

// Two-pass loudnorm. Pass two runs in `linear` mode so a single static gain is
// applied rather than the level being ridden — this cue's dynamics are the point.
const measureOut = sh('ffmpeg', [
  '-v', 'info',
  '-ss', start.toFixed(6),
  '-t', rawLen.toFixed(6),
  '-i', RAW,
  '-af', `${headFilters},loudnorm=I=${I}:TP=-1.5:LRA=${LRA}:print_format=json`,
  '-f', 'null', '-',
])
const m = JSON.parse(
  measureOut.slice(measureOut.lastIndexOf('{'), measureOut.lastIndexOf('}') + 1),
) as Record<string, string>
console.log(
  `[master] measured in ${m.input_i} LUFS, LRA ${m.input_lra}, TP ${m.input_tp}, thresh ${m.input_thresh}`,
)

const filters = [
  headFilters,
  `loudnorm=I=${I}:TP=-1.5:LRA=${LRA}:linear=true` +
    `:measured_I=${m.input_i}:measured_LRA=${m.input_lra}` +
    `:measured_TP=${m.input_tp}:measured_thresh=${m.input_thresh}`,
  `afade=t=in:st=0:d=${FADE_IN}`,
  `afade=t=out:st=${(RUNTIME - FADE_OUT).toFixed(6)}:d=${FADE_OUT}`,
  // loudnorm flushes a few hundred samples short of the trim point; apad refills
  // them and the output -t caps the result at exactly RUNTIME.
  'apad',
].join(',')

sh('ffmpeg', [
  '-y',
  '-v', 'error',
  '-ss', start.toFixed(6),
  '-t', rawLen.toFixed(6),
  '-i', RAW,
  '-af', filters,
  '-t', RUNTIME.toFixed(6),
  '-ar', '48000',
  '-ac', '2',
  '-c:a', 'pcm_s24le',
  OUT,
])

const dur = probeDuration(OUT)
const eb = sh('ffmpeg', ['-nostats', '-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
const grab = (label: string) => {
  const hits = eb.match(new RegExp(`${label}:\\s*(-?[\\d.]+)`, 'g'))
  return hits ? hits[hits.length - 1].split(':')[1].trim() : '?'
}

console.log(`\n[master] ${OUT}`)
console.log(`[master] ${dur.toFixed(6)} s · ${grab('I')} LUFS · LRA ${grab('LRA')} LU · peak ${grab('Peak')} dBFS`)
if (Math.abs(dur - RUNTIME) > 0.002) throw new Error(`mastered to ${dur} s, expected ${RUNTIME}`)

const sidecar = JSON.parse(readFileSync(SIDECAR, 'utf-8'))
const barS = 60 / TARGET_BPM * 4
const coincidences: Array<Record<string, unknown>> = []
for (let f = 0; f <= FRAMES; f += 144) {
  const t = f / FPS
  const bars = t / barS
  if (Math.abs(bars - Math.round(bars)) < 1e-9) {
    coincidences.push({ frame: f, second: Number(t.toFixed(3)), music_bar: Math.round(bars) + 1 })
  }
}

writeFileSync(
  join(OUT_DIR, 'openscout-theme-range-glasshouse.provenance.json'),
  JSON.stringify(
    {
      asset: OUT,
      film: 'OpenScout — theme range (locked 31.2 s picture)',
      role: 'A fresh, contemporary instrumental score. Picture and outro unchanged.',
      runtime_frames: FRAMES,
      runtime_s: RUNTIME,
      fps: FPS,
      generator: {
        script: 'scripts/generate-theme-range-vibe-score.ts',
        path: 'Preframe’s configured MiniMax Music path (readMusicModelConfig + getMiniMaxApiKey)',
        endpoint: 'https://api.minimax.io/v1/music_generation',
        model: sidecar.model,
        instrumental: true,
        audio_setting: sidecar.audioSetting,
        credential: 'Resolved from MINIMAX_API_KEY in the environment. Never written to disk or logged.',
        variant: sidecar.variant,
        prompt: sidecar.prompt,
      },
      selection: {
        candidates_generated: 3,
        candidates: ['nightfall (organic downtempo house)', 'glasshouse (cinematic melodic techno)', 'signal (broken-beat future soul)'],
        selected: 'glasshouse',
        why:
          'Measured against the brief with scripts/analyze-vibe-candidates.ts and scripts/transcribe-vibe-candidate.ts. ' +
          'Glasshouse has the strongest pulse (autocorrelation clarity 2.13-2.28 vs 1.27 and 1.14), the warmest and widest ' +
          'spectrum (centroid 2592 Hz and 30.5% of energy below 250 Hz, against 3.2-3.7 kHz and 22-26% for the others — the ' +
          'rejected circus pass was defined by a bright, thin, mid-forward spectrum, and this is the furthest from it), a ' +
          'lead that is genuinely centred and repeating rather than wandering (8 distinct pitches around a clear F#4 axis ' +
          'over a B minor bass movement, vs 10 scattered pitches with no centre), and an intact arrangement with no model ' +
          'dropouts — the signal candidate glitched to below -44 dBFS at seven points, which no window can hide.',
      },
      raw_generation: {
        file: RAW,
        sha256: sha256(RAW),
        duration_s: probeDuration(RAW),
        sidecar: SIDECAR,
      },
      tempo: {
        requested_bpm: 100,
        measured_bpm: Number(measuredBpm.toFixed(3)),
        measurement:
          'Positive log-domain spectral-flux onset envelope at 8 kHz / 64-sample hop, autocorrelated over 4 lag multiples ' +
          `across the ${ANALYSIS_FROM}-${ANALYSIS_TO} s window at 0.005 BPM resolution.`,
        note: 'MiniMax did not honour the requested tempo — all three candidates in this pass landed near 124 BPM.',
        mastered_bpm: TARGET_BPM,
        atempo,
        why_not_100:
          'Conforming to the film’s 100 BPM grid would need an atempo of 0.8075, a 19% slowdown that smears transients and ' +
          'makes a confident groove draggy. 125.000 is a ~0.9% nudge, inaudible and artefact-free.',
        consequence:
          'At 125 BPM one 4/4 bar is 1.920 s, and five music bars are exactly four film bars (9.600 s). With the window ' +
          'snapped so music bar 1 lands on frame 0, a musical downbeat coincides with a film chapter head at the open, at ' +
          'POLAR, at the REVEAL, and inside the outro. The chapters between those float against the music.',
        downbeat_coincidences: coincidences,
        first_downbeat_raw_s: phase.firstDownbeatS,
        downbeat_beat_index: phase.downbeatIndex,
      },
      mastering: {
        window_start_s: start,
        window_end_s: start + rawLen,
        window_snapped_to_downbeat: true,
        why_this_window:
          'Chosen for arc, then snapped. The generation sits in a breakdown around 94-97 s, the full groove returns at ' +
          '~98 s and holds through ~117 s, then thins naturally from 118 s into a 14-second decay. Against the locked ' +
          'picture that reads as a quiet open under the opening type, the groove locking in as the theme range begins, ' +
          'full through the reveal, and thinning through the outro under the wire mark.',
        runtime_s: RUNTIME,
        chain: filters,
        fade_in_s: FADE_IN,
        fade_out_s: FADE_OUT,
        format: '48 kHz, stereo, 24-bit PCM WAV',
        sha256: sha256(OUT),
      },
      measured: {
        duration_s: dur,
        integrated_lufs: grab('I'),
        lra_lu: grab('LRA'),
        peak_dbfs: grab('Peak'),
      },
      rights: 'Original instrumental generated for this project through the operator’s own MiniMax account. No third-party recordings, samples or vocals.',
    },
    null,
    2,
  ),
)
console.log(`[done] ${OUT_DIR}/openscout-theme-range-glasshouse.provenance.json`)
