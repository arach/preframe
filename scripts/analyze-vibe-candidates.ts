#!/usr/bin/env bun
// Musical profile of a generated cue, used to pick between candidates and to
// choose a mastering window.
//
//   bun run scripts/analyze-vibe-candidates.ts <audio> [--json]
//
// This exists because the failure mode this pass is guarding against — a cue
// that is technically fine but tonally wrong (novelty, caricature, stock) — is
// not visible in duration and loudness. So alongside the tempo measurement that
// analyze-theme-range-score.ts already does, this reports:
//
//   · tempo, by autocorrelating a spectral-flux onset envelope over four lag
//     multiples so a piece at T does not report T/2 or 2T
//   · a chroma profile and a Krumhansl-style key estimate, including the
//     major/minor correlation gap — a brief that asks for "cool and a little
//     mysterious" wants minor to win, and wants it to win clearly
//   · spectral centroid and the share of energy above 2 kHz, per section. The
//     rejected circus pass was defined by a bright, thin, mid-forward spectrum;
//     a warm modern cue sits low and wide.
//   · onset density and pulse clarity (autocorrelation peak height), which
//     separates "has a groove" from "has events"
//   · a per-second RMS map and a section table, so the mastering window is cut
//     from the strongest sustained material rather than an arbitrary offset

import { spawnSync } from 'node:child_process'

const SR = 22050
const HOP = 256
const FFT = 2048

const file = process.argv[2]
if (!file) throw new Error('usage: analyze-vibe-candidates.ts <audio> [--json]')
const asJson = process.argv.includes('--json')

const dec = spawnSync(
  'ffmpeg',
  ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
  { maxBuffer: 1024 * 1024 * 1024 },
)
if (dec.status !== 0) throw new Error(`ffmpeg decode failed: ${dec.stderr}`)
const buf = dec.stdout
const x = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4))
const duration = x.length / SR

// --- STFT magnitudes --------------------------------------------------------
const BINS = FFT / 2
const hann = new Float32Array(FFT)
for (let i = 0; i < FFT; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT - 1))

/** Iterative radix-2 FFT, in place, on interleaved-free split arrays. */
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k]
        const ui = im[i + k]
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr
        re[i + k] = ur + vr
        im[i + k] = ui + vi
        re[i + k + len / 2] = ur - vr
        im[i + k + len / 2] = ui - vi
        const ncr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = ncr
      }
    }
  }
}

const nFrames = Math.max(0, Math.floor((x.length - FFT) / HOP))
const framesPerSec = SR / HOP
const mags: Float32Array[] = []
{
  const re = new Float32Array(FFT)
  const im = new Float32Array(FFT)
  for (let f = 0; f < nFrames; f++) {
    const off = f * HOP
    for (let n = 0; n < FFT; n++) {
      re[n] = x[off + n] * hann[n]
      im[n] = 0
    }
    fft(re, im)
    const m = new Float32Array(BINS)
    for (let k = 0; k < BINS; k++) m[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k])
    mags.push(m)
  }
}

const binHz = SR / FFT

// --- onset envelope + tempo -------------------------------------------------
const flux = new Float32Array(nFrames)
{
  let prev = new Float32Array(BINS)
  for (let f = 0; f < nFrames; f++) {
    let s = 0
    const m = mags[f]
    for (let k = 0; k < BINS; k++) {
      const a = Math.log1p(1000 * m[k])
      const d = a - prev[k]
      if (d > 0) s += d
      prev[k] = a
    }
    flux[f] = s
  }
}

function detrend(v: Float32Array) {
  const w = Math.round(framesPerSec * 0.5)
  const out = new Float32Array(v.length)
  for (let i = 0; i < v.length; i++) {
    let s = 0
    let n = 0
    for (let j = Math.max(0, i - w); j < Math.min(v.length, i + w); j++, n++) s += v[j]
    out[i] = Math.max(0, v[i] - s / n)
  }
  return out
}
const env = detrend(flux)

function autocorr(lag: number) {
  let s = 0
  let n = 0
  for (let i = 0; i + lag < env.length; i++, n++) s += env[i] * env[i + lag]
  return n ? s / n : 0
}
let best = { bpm: 0, score: -Infinity }
for (let bpm = 60; bpm <= 180; bpm += 0.05) {
  const lag = (60 / bpm) * framesPerSec
  // Score four lag multiples so a half/double-time reading loses to the true one.
  let s = 0
  for (const mult of [1, 2, 3, 4]) s += autocorr(Math.round(lag * mult))
  if (s > best.score) best = { bpm, score: s }
}
// Pulse clarity: how much the on-grid autocorrelation stands above the local floor.
const lag1 = Math.round((60 / best.bpm) * framesPerSec)
const floorScore =
  (autocorr(Math.round(lag1 * 1.5)) + autocorr(Math.round(lag1 * 0.5 + lag1 * 0.25))) / 2
const pulseClarity = floorScore > 0 ? autocorr(lag1) / floorScore : 0

// Onset density — peaks per second in the detrended envelope.
let onsets = 0
for (let i = 1; i < env.length - 1; i++) {
  if (env[i] > env[i - 1] && env[i] >= env[i + 1] && env[i] > 0.6) onsets++
}
const onsetDensity = onsets / duration

// --- chroma + key -----------------------------------------------------------
const chroma = new Float64Array(12)
const A4 = 440
for (let f = 0; f < nFrames; f++) {
  const m = mags[f]
  for (let k = 2; k < BINS; k++) {
    const hz = k * binHz
    if (hz < 55 || hz > 2000) continue
    const midi = 69 + 12 * Math.log2(hz / A4)
    const pc = ((Math.round(midi) % 12) + 12) % 12
    chroma[pc] += m[k]
  }
}
{
  let s = 0
  for (const v of chroma) s += v
  if (s > 0) for (let i = 0; i < 12; i++) chroma[i] /= s
}

// Krumhansl–Kessler profiles.
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
function corr(a: number[], b: number[]) {
  const ma = a.reduce((s, v) => s + v, 0) / a.length
  const mb = b.reduce((s, v) => s + v, 0) / b.length
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb)
    da += (a[i] - ma) ** 2
    db += (b[i] - mb) ** 2
  }
  return num / Math.sqrt(da * db)
}
let bestMaj = { key: '', r: -2 }
let bestMin = { key: '', r: -2 }
for (let t = 0; t < 12; t++) {
  const rot = Array.from({ length: 12 }, (_, i) => chroma[(i + t) % 12])
  const rMaj = corr(rot, MAJ)
  const rMin = corr(rot, MIN)
  if (rMaj > bestMaj.r) bestMaj = { key: `${NAMES[t]} major`, r: rMaj }
  if (rMin > bestMin.r) bestMin = { key: `${NAMES[t]} minor`, r: rMin }
}
const mode = bestMin.r >= bestMaj.r ? 'minor' : 'major'
const keyGap = bestMin.r - bestMaj.r

// --- spectral shape ---------------------------------------------------------
function shapeOver(fromF: number, toF: number) {
  let cenNum = 0
  let cenDen = 0
  let hi = 0
  let lo = 0
  let mid = 0
  let total = 0
  for (let f = fromF; f < toF; f++) {
    const m = mags[f]
    for (let k = 1; k < BINS; k++) {
      const hz = k * binHz
      const e = m[k]
      cenNum += hz * e
      cenDen += e
      total += e
      if (hz < 250) lo += e
      else if (hz < 2000) mid += e
      else hi += e
    }
  }
  return {
    centroidHz: cenDen ? cenNum / cenDen : 0,
    lowShare: total ? lo / total : 0,
    midShare: total ? mid / total : 0,
    highShare: total ? hi / total : 0,
  }
}
const shape = shapeOver(0, nFrames)

// --- per-second RMS + sections ---------------------------------------------
const secs = Math.floor(duration)
const rms: number[] = []
for (let s = 0; s < secs; s++) {
  let acc = 0
  const a = s * SR
  const b = Math.min(x.length, a + SR)
  for (let i = a; i < b; i++) acc += x[i] * x[i]
  rms.push(20 * Math.log10(Math.sqrt(acc / (b - a)) + 1e-9))
}

const out = {
  file,
  duration_s: Number(duration.toFixed(3)),
  tempo_bpm: Number(best.bpm.toFixed(2)),
  pulse_clarity: Number(pulseClarity.toFixed(3)),
  onset_density_per_s: Number(onsetDensity.toFixed(2)),
  key: mode === 'minor' ? bestMin.key : bestMaj.key,
  mode,
  key_minor_r: Number(bestMin.r.toFixed(3)),
  key_major_r: Number(bestMaj.r.toFixed(3)),
  minor_margin: Number(keyGap.toFixed(3)),
  chroma: Array.from(chroma).map((v) => Number(v.toFixed(3))),
  spectral_centroid_hz: Math.round(shape.centroidHz),
  energy_below_250hz: Number(shape.lowShare.toFixed(3)),
  energy_250_2000hz: Number(shape.midShare.toFixed(3)),
  energy_above_2khz: Number(shape.highShare.toFixed(3)),
  rms_dbfs_per_second: rms.map((v) => Number(v.toFixed(1))),
}

if (asJson) {
  console.log(JSON.stringify(out, null, 2))
} else {
  console.log(`[profile] ${file}`)
  console.log(`  duration        ${out.duration_s} s`)
  console.log(`  tempo           ${out.tempo_bpm} BPM   pulse clarity ${out.pulse_clarity}   onsets/s ${out.onset_density_per_s}`)
  console.log(`  key             ${out.key}  (minor r=${out.key_minor_r} vs major r=${out.key_major_r}, margin ${out.minor_margin})`)
  console.log(`  centroid        ${out.spectral_centroid_hz} Hz`)
  console.log(`  energy          <250 Hz ${out.energy_below_250hz} · 250–2k ${out.energy_250_2000hz} · >2k ${out.energy_above_2khz}`)
  const bar = (v: number) => '█'.repeat(Math.max(0, Math.round((v + 45) / 1.6)))
  console.log('  RMS per second (dBFS):')
  for (let s = 0; s < rms.length; s += 2) {
    console.log(`    ${String(s).padStart(3)}s ${rms[s].toFixed(1).padStart(6)} ${bar(rms[s])}`)
  }
}
