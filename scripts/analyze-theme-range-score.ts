#!/usr/bin/env bun
// Measures the delivered tempo of a generated score.
//
//   bun run scripts/analyze-theme-range-score.ts public/tracks/generated/<id>.mp3 [fromSec] [toSec]
//
// Why this exists: MiniMax does not honour a requested BPM. The V3 provenance
// records 143.9 delivered against 120 asked for, and that pass rebuilt the film's
// grid on the delivered tempo rather than fighting it. Same discipline here — the
// theme-range grid is built on what BEAT actually is, so this has to be measured
// rather than assumed.
//
// Method: positive log-domain spectral flux at 8 kHz gives an onset envelope;
// autocorrelating it over the plausible tempo range finds the beat period. The
// envelope is autocorrelated at 4 lag multiples so a piece that is really at T
// does not report T/2 or 2T, which a single-lag search does routinely.
//
// Also reports where the strongest sustained section is, so the mastering window
// can be cut from real material rather than an arbitrary offset.

import { spawnSync } from 'node:child_process'

const SR = 8000
const HOP = 64
const FFT = 512

const file = process.argv[2]
if (!file) throw new Error('usage: analyze-theme-range-score.ts <audio> [fromSec] [toSec]')
const fromSec = Number(process.argv[3] ?? 0)
const toSec = Number(process.argv[4] ?? 0)

// --- decode to mono float at 8 kHz -----------------------------------------
const dec = spawnSync(
  'ffmpeg',
  ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
  { maxBuffer: 1024 * 1024 * 1024 },
)
if (dec.status !== 0) throw new Error(`ffmpeg decode failed: ${dec.stderr}`)
const buf = dec.stdout
const all = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4))
const a = fromSec || toSec ? all.slice(Math.round(fromSec * SR), toSec ? Math.round(toSec * SR) : all.length) : all
const durationS = all.length / SR
console.log(`[analyze] ${file}`)
console.log(`[analyze] duration ${durationS.toFixed(3)} s, analysing ${(a.length / SR).toFixed(3)} s from ${fromSec}`)

// --- spectral flux onset envelope ------------------------------------------
const hann = new Float32Array(FFT)
for (let i = 0; i < FFT; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT - 1))

// Small, explicit DFT magnitude — FFT size is 512 and the hop count is modest,
// so clarity beats cleverness here.
const cosT: Float32Array[] = []
const sinT: Float32Array[] = []
const BINS = FFT / 2
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

// normalise
let mean = 0
for (let i = 0; i < nFrames; i++) mean += flux[i]
mean /= Math.max(1, nFrames)
let sd = 0
for (let i = 0; i < nFrames; i++) sd += (flux[i] - mean) ** 2
sd = Math.sqrt(sd / Math.max(1, nFrames)) || 1
const env = new Float32Array(nFrames)
for (let i = 0; i < nFrames; i++) env[i] = (flux[i] - mean) / sd

const framesPerSec = SR / HOP

// --- autocorrelation over 4 lag multiples ----------------------------------
const acf = (lag: number) => {
  let s = 0
  let n = 0
  for (let i = 0; i + lag < nFrames; i++) {
    s += env[i] * env[i + lag]
    n++
  }
  return n ? s / n : 0
}

let best = { bpm: 0, score: -Infinity }
for (let bpm = 60; bpm <= 190; bpm += 0.02) {
  const period = (60 / bpm) * framesPerSec
  // Sum over 4 beat multiples: a piece at T scores on 1,2,3,4 beats; a half- or
  // double-tempo candidate only lines up on a subset.
  let s = 0
  for (let m = 1; m <= 4; m++) s += acf(Math.round(period * m))
  if (s > best.score) best = { bpm, score: s }
}

console.log(`[analyze] measured tempo ≈ ${best.bpm.toFixed(2)} BPM  (acf score ${best.score.toFixed(4)})`)

// --- where the sustained section is ----------------------------------------
// RMS per second, so the mastering window can open on real material.
const rmsPerSec: number[] = []
for (let t = 0; t + SR <= all.length; t += SR) {
  let s = 0
  for (let i = t; i < t + SR; i++) s += all[i] * all[i]
  rmsPerSec.push(Math.sqrt(s / SR))
}
const peak = Math.max(...rmsPerSec)
console.log('[analyze] RMS per second (bar = relative level):')
rmsPerSec.forEach((r, i) => {
  const n = Math.round((r / peak) * 44)
  console.log(`  ${String(i).padStart(3)}s ${(20 * Math.log10(r || 1e-9)).toFixed(1).padStart(7)} dB ${'█'.repeat(n)}`)
})

// Best sustained 40 s window by mean RMS.
let bestWin = { from: 0, mean: -Infinity }
for (let s = 0; s + 40 <= rmsPerSec.length; s++) {
  const m = rmsPerSec.slice(s, s + 40).reduce((x, y) => x + y, 0) / 40
  if (m > bestWin.mean) bestWin = { from: s, mean: m }
}
console.log(`[analyze] strongest sustained 40 s window starts near ${bestWin.from} s`)
