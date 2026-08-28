#!/usr/bin/env bun
// Finishes the third theme-range deliverable so its picture is BIT-IDENTICAL to
// the already-approved one, not merely equivalent to it.
//
//   bun run scripts/finish-theme-range-glasshouse.ts
//
// ---------------------------------------------------------------------------
// WHY THIS STEP EXISTS
// ---------------------------------------------------------------------------
//
// C renders from the same locked edit as A and B — `EDIT_THEME_RANGE_GLASSHOUSE`
// spreads `THEME_RANGE_EDIT` and changes only `score`, and the composition has
// no code path from a score to a pixel. The direct render proves that: of
// 1872 frames, 1871 came back byte-identical to A.
//
// One did not. Frame 1300 differed in 822 of 2,073,600 pixels, by at most 5/255,
// confined to a 98×66 px box at rows 975–1040 / columns 303–400 — the type band,
// four frames into chapter VII's cross-dissolve. That is encoder and dissolve
// rounding between two render sessions, not a difference in content: PSNR
// between the two frames is 78.5 dB, where 50 dB is already visually lossless.
//
// It is still a difference, and "the picture is frame-identical" is the whole
// premise of this deliverable. So rather than restate the guarantee as "identical
// to within five code values on one frame", the delivered C takes A's ALREADY
// APPROVED video stream verbatim — `-c:v copy`, no re-encode — and carries only
// its own audio. The guarantee then holds by construction rather than by luck,
// and the validator's per-frame hash comparison proves it on the delivered file.
//
// The direct render stays where `render-openscout-theme-range.ts` put it, in
// _raw/, as the evidence that the composition produces this picture from the
// locked edit. This step reads it and never moves it, so re-running is safe:
// there is no state in which the finished file could be folded back into itself.

// ---------------------------------------------------------------------------
// WHY THE AUDIO IS RE-ENCODED FROM THE WAV RATHER THAN COPIED
// ---------------------------------------------------------------------------
//
// The obvious version of this step copies both streams: A's video and the
// render's already-encoded AAC. It is wrong, and measurably so. Copying an AAC
// stream into a fresh container loses the edit list that compensates the
// encoder's priming samples, and the delivered audio came out 344 samples —
// 43 ms — late against the picture, where A measures 0. That is under the
// threshold most people notice as lip-sync error, but it is 9% of a beat at
// 125 BPM, which is precisely the alignment this score was mastered to hold.
//
// So the audio is encoded once, here, straight from the mastered WAV. The
// composition contributes nothing to it that the master does not already have:
// `scoreGain` is 1, and its 8-frame/18-frame safety ramps sit inside the
// master's own 0.5 s and 3.0 s fades. The check at the bottom measures the
// result rather than assuming it.

import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'

const OUT_DIR = join('out', 'openscout-theme-range')
const RAW_DIR = join(OUT_DIR, '_raw')

const APPROVED_PICTURE = join(OUT_DIR, 'openscout-theme-range-a-beat.mp4')
const SCORE = join('public', 'tracks', 'openscout', 'openscout-theme-range-glasshouse.wav')
const DIRECT_RENDER = join(RAW_DIR, 'openscout-theme-range-c-glasshouse.mp4')
const DELIVERABLE = join(OUT_DIR, 'openscout-theme-range-c-glasshouse.mp4')

const run = (cmd: string, argv: string[]) => {
  const res = spawnSync(cmd, argv, {stdio: 'inherit'})
  if (res.status !== 0) throw new Error(`${cmd} failed (${res.status})`)
}

if (!existsSync(APPROVED_PICTURE)) throw new Error(`Missing approved picture: ${APPROVED_PICTURE}`)
if (!existsSync(SCORE)) throw new Error(`Missing score: ${SCORE}`)
if (!existsSync(DIRECT_RENDER))
  throw new Error(`Missing render: ${DIRECT_RENDER} — run render-openscout-theme-range.ts glasshouse first`)

console.log(`[proof]  direct render kept at ${DIRECT_RENDER}`)
console.log(`[finish] ${APPROVED_PICTURE} (video, copied) + ${SCORE} (audio, encoded) → ${DELIVERABLE}`)
run('ffmpeg', [
  '-y',
  '-v', 'error',
  '-i', APPROVED_PICTURE,
  '-i', SCORE,
  '-map', '0:v:0',
  '-map', '1:a:0',
  '-c:v', 'copy',
  '-c:a', 'aac',
  '-b:a', '256k',
  '-ar', '48000',
  '-ac', '2',
  '-shortest',
  '-movflags', '+faststart',
  '-color_primaries', 'bt709',
  '-color_trc', 'bt709',
  '-colorspace', 'bt709',
  '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
  DELIVERABLE,
])

// ---------------------------------------------------------------------------
// Measure the sync rather than trust it.
// ---------------------------------------------------------------------------

const decode = (file: string, extra: string[]) => {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, ...extra, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], {
    maxBuffer: 512 * 1024 * 1024,
  })
  const b = r.stdout
  return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4))
}
const inFile = decode(DELIVERABLE, ['-vn'])
const ref = decode(SCORE, [])
const n = Math.min(inFile.length, ref.length)
let best = {lag: 0, r: -Infinity}
for (let lag = -2000; lag <= 2000; lag++) {
  let s = 0
  let sa = 0
  let sb = 0
  for (let i = Math.max(0, -lag); i < n - Math.max(0, lag); i++) {
    const a = inFile[i + lag]
    const b = ref[i]
    s += a * b
    sa += a * a
    sb += b * b
  }
  const r = s / (Math.sqrt(sa * sb) + 1e-12)
  if (r > best.r) best = {lag, r}
}
const ms = (best.lag / 8).toFixed(1)
console.log(`[sync]   delivered audio vs master: lag ${best.lag} samples (${ms} ms at 8 kHz), r=${best.r.toFixed(4)}`)
if (Math.abs(best.lag) > 8) throw new Error(`audio is ${ms} ms out against the master — expected sample-aligned`)
if (best.r < 0.99) throw new Error(`delivered audio does not match the master (r=${best.r.toFixed(4)})`)

console.log(`\n[done] ${DELIVERABLE}`)
