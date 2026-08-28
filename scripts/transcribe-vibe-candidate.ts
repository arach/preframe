#!/usr/bin/env bun
// Reads back the musical content of a generated cue, so a candidate can be
// judged on what it plays rather than on how loud it is.
//
//   bun run scripts/transcribe-vibe-candidate.ts <audio> <fromSec> <toSec>
//
// Loudness maps and spectrograms answered "is there material here" but not the
// question this pass actually turns on — is the cue musical, is it in a minor
// mode, and does it have a repeating melodic idea rather than a bag of events.
// The rejected circus pass would have looked perfectly healthy on an RMS map.
//
// Three read-outs, all from one constant-Q-ish log-frequency analysis:
//
//   BASS      strongest pitch class in 40–160 Hz per half-second. A chord root
//             per half-bar; oom-pah caricature shows up here as a root/fifth
//             alternation on every beat.
//   LEAD      strongest pitch in 300–2000 Hz per eighth-note, which is where a
//             plucked or arpeggiated motif lives.
//   MOTIF     self-similarity of the lead sequence at 1/2/4-bar lags. A cue with
//             a real hook repeats itself; one without does not.

import { spawnSync } from 'node:child_process'

const file = process.argv[2]
const fromSec = Number(process.argv[3] ?? 0)
const toSec = Number(process.argv[4] ?? 0)
const bpmArg = Number(process.argv[5] ?? 0)
if (!file) throw new Error('usage: transcribe-vibe-candidate.ts <audio> <from> <to> [bpm]')

const SR = 22050
const dec = spawnSync(
  'ffmpeg',
  ['-v', 'error', '-ss', String(fromSec), '-t', String(toSec - fromSec), '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
  { maxBuffer: 512 * 1024 * 1024 },
)
if (dec.status !== 0) throw new Error(`decode failed: ${dec.stderr}`)
const b = dec.stdout
const x = new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4))

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const noteName = (midi: number) => `${NAMES[((Math.round(midi) % 12) + 12) % 12]}${Math.floor(Math.round(midi) / 12) - 1}`

/** Goertzel magnitude at one frequency over one window — cheap and exact for a sparse note grid. */
function goertzel(sig: Float32Array, from: number, len: number, hz: number) {
  const k = (2 * Math.PI * hz) / SR
  const coeff = 2 * Math.cos(k)
  let s0 = 0
  let s1 = 0
  let s2 = 0
  const end = Math.min(sig.length, from + len)
  for (let i = from; i < end; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i - from)) / (end - from - 1))
    s0 = sig[i] * w + coeff * s1 - s2
    s2 = s1
    s1 = s0
  }
  return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / (end - from)
}

/** Strongest MIDI note in [loMidi, hiMidi] over a window, with a harmonic-sum score. */
function strongestNote(from: number, len: number, loMidi: number, hiMidi: number, harmonics: number) {
  let best = { midi: 0, score: 0 }
  for (let midi = loMidi; midi <= hiMidi; midi++) {
    const f0 = 440 * 2 ** ((midi - 69) / 12)
    let score = 0
    for (let h = 1; h <= harmonics; h++) {
      const hz = f0 * h
      if (hz > SR / 2 - 100) break
      score += goertzel(x, from, len, hz) / h
    }
    if (score > best.score) best = { midi, score }
  }
  return best
}

const bpm = bpmArg || 120
const beatS = 60 / bpm
const eighthS = beatS / 2

console.log(`[transcribe] ${file}  ${fromSec}–${toSec} s   grid at ${bpm} BPM`)

// --- BASS: one reading per half beat ---------------------------------------
const bassWin = Math.round(SR * beatS * 0.5)
const bassSeq: string[] = []
for (let t = 0; t + bassWin < x.length; t += bassWin) {
  const n = strongestNote(t, bassWin, 28, 55, 3) // E1–G3
  bassSeq.push(n.score > 1e-5 ? noteName(n.midi) : '·')
}
console.log(`\nBASS  (every ${(beatS / 2).toFixed(3)} s)`)
for (let i = 0; i < bassSeq.length; i += 16) {
  console.log(`  ${String((i * beatS) / 2 + fromSec).slice(0, 6).padStart(6)}s  ${bassSeq.slice(i, i + 16).map((s) => s.padStart(4)).join('')}`)
}

// --- LEAD: one reading per eighth ------------------------------------------
const leadWin = Math.round(SR * eighthS)
const leadSeq: number[] = []
const leadTxt: string[] = []
for (let t = 0; t + leadWin < x.length; t += leadWin) {
  const n = strongestNote(t, leadWin, 55, 91, 2) // G3–G6
  leadSeq.push(n.score > 1e-5 ? n.midi : -1)
  leadTxt.push(n.score > 1e-5 ? noteName(n.midi) : '·')
}
console.log(`\nLEAD  (every ${eighthS.toFixed(3)} s)`)
for (let i = 0; i < leadTxt.length; i += 16) {
  console.log(`  ${String(i * eighthS + fromSec).slice(0, 6).padStart(6)}s  ${leadTxt.slice(i, i + 16).map((s) => s.padStart(4)).join('')}`)
}

// --- MOTIF: does the lead repeat itself? -----------------------------------
function selfSim(lagEighths: number) {
  let same = 0
  let n = 0
  for (let i = 0; i + lagEighths < leadSeq.length; i++) {
    if (leadSeq[i] < 0 || leadSeq[i + lagEighths] < 0) continue
    n++
    if (Math.abs(leadSeq[i] - leadSeq[i + lagEighths]) <= 0) same++
  }
  return n ? same / n : 0
}
console.log('\nMOTIF  (exact pitch match rate of the lead against itself)')
for (const bars of [1, 2, 4]) {
  console.log(`  ${bars} bar${bars > 1 ? 's' : ''} (${bars * 8} eighths): ${(selfSim(bars * 8) * 100).toFixed(0)}%`)
}
const distinct = new Set(leadSeq.filter((v) => v >= 0)).size
console.log(`  distinct lead pitches: ${distinct}`)
