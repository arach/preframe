#!/usr/bin/env bun
// Masters the 55.000 s score for the OpenScout Reimagined film.
//
//   bun run scripts/master-openscout-reimagined-score.ts
//
// WHY THIS IS A MASTER AND NOT A GENERATION
//
// The brief asked for a newly generated eerie/spacious cue with a controlled
// pulse. Fresh generation was not possible in this environment: MiniMax Music
// resolves through `readMusicModelConfig()`, which needs either a keyed `music`
// slot or `MINIMAX_API_KEY`. `.data/provider.json` carries empty `apiKey`
// strings on both slots and the variable is unset, so
// `scripts/generate-montage-score-v3-beat.ts` cannot run here.
//
// Rather than ship the film without a bed, this masters a NEW 55.000 s window
// out of the operator's own existing raw MiniMax generation
// `public/tracks/generated/openscout-v3-beat-msqxiv1l.mp3` (133.886 s). That
// raw file is the source the V3 Edit A master was also cut from, so the two
// masters share musical material — this window opens 10.007 s earlier and is
// 10.083 s longer, but roughly 82% of it overlaps the V3 window. That is a real
// limitation and it is recorded in the provenance sidecar. Set MINIMAX_API_KEY
// and this cut can be swapped for a fresh generation without touching picture.
//
// THE WINDOW
//
// The raw generation's first ~56 s is a 10-second phrase cycle that decays to
// near silence between phrases (troughs of -42 to -52 dBFS at 6-8, 16-18, 26-28,
// 36-38 and 46-48 s), which would read as dropouts under picture. 56-108 s is
// the sustained, locked section. The window starts at 52.2491 s — six bars
// before the downbeat the V3 master was cut from, in the delivered 143.9 BPM
// timebase — so it opens just inside the lift into that section and still lands
// on a downbeat. It ends at 107.2873 s, the same measured point V3 ended on,
// where the arrangement thins naturally.
//
// THE TEMPO
//
// MiniMax delivered 143.9 BPM against a requested 120. As with V3 the film is
// built on the delivered tempo rather than fighting it: atempo=1.0006949 nudges
// it to exactly 144.000 BPM, where one bar is exactly 50 frames at 30 fps. The
// picture's 33 bars (29 content + 4 outro) then land on downbeats throughout.

import { mkdirSync, writeFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const RAW = 'public/tracks/generated/openscout-v3-beat-msqxiv1l.mp3'
const OUT_DIR = join('public', 'tracks', 'openscout')
const OUT = join(OUT_DIR, 'openscout-reimagined-score.wav')
const PROV = join(OUT_DIR, 'openscout-reimagined-score.provenance.json')

/** 143.9 BPM delivered → 144.000 BPM mastered. */
const ATEMPO = 1.0006949
const BAR_143_9 = (4 * 60) / 143.9
/** The downbeat the V3 master was cut from, in the raw file's own timebase. */
const V3_DOWNBEAT = 62.256
const WINDOW_START = +(V3_DOWNBEAT - 6 * BAR_143_9).toFixed(4)
const TARGET_S = 55.0
const WINDOW_LEN = +(TARGET_S * ATEMPO).toFixed(4)
const WINDOW_END = +(WINDOW_START + WINDOW_LEN).toFixed(4)

const FADE_IN = 0.35
const FADE_OUT = 3.0
const SR = 48000
const TARGET_SAMPLES = Math.round(TARGET_S * SR)

const run = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status}): ${r.stderr?.slice(0, 800)}`)
  return `${r.stdout ?? ''}${r.stderr ?? ''}`
}

const sha256 = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

mkdirSync(OUT_DIR, { recursive: true })

console.log(`[score] raw     ${RAW}`)
console.log(`[score] window  ${WINDOW_START}s → ${WINDOW_END}s (${WINDOW_LEN}s raw)`)
console.log(`[score] atempo  ${ATEMPO} → 144.000 BPM (bar = 50 frames @ 30 fps)`)
console.log(`[score] target  ${TARGET_S.toFixed(3)}s = 33 bars`)

const filter = [
  `atempo=${ATEMPO}`,
  'loudnorm=I=-18:TP=-1.5:LRA=9',
  `aresample=${SR}`,
  `afade=t=in:st=0:d=${FADE_IN}`,
  `afade=t=out:st=${(TARGET_S - FADE_OUT).toFixed(3)}:d=${FADE_OUT}`,
  // loudnorm runs at 192 kHz internally, and the resample back leaves the stream
  // ~140 samples shy of the arithmetic length. Pad a second of silence and cut to
  // an exact sample count so the bed is the same length as picture rather than
  // 0.09 frames under it. The trimmed region is inside the finished fade-out, so
  // nothing audible is added or lost.
  `apad=pad_len=${SR}`,
  `atrim=end_sample=${TARGET_SAMPLES}`,
  'asetpts=N/SR/TB',
].join(',')

run('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-ss', String(WINDOW_START),
  '-t', String(WINDOW_LEN),
  '-i', RAW,
  '-af', filter,
  '-c:a', 'pcm_s24le', '-ar', String(SR), '-ac', '2',
  OUT,
])

// ---------------------------------------------------------------------------
// Measure what was actually written
// ---------------------------------------------------------------------------

const probe = (args: string[]) =>
  run('ffprobe', ['-v', 'error', ...args, OUT]).trim()

const duration = parseFloat(probe(['-show_entries', 'format=duration', '-of', 'csv=p=0']))
const eb = run('ffmpeg', ['-nostats', '-hide_banner', '-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
const grab = (label: string) => {
  const m = eb.match(new RegExp(`${label}:\\s*(-?[\\d.]+)`, 'g'))
  return m ? parseFloat(m[m.length - 1].split(':')[1].trim()) : NaN
}
const lufs = grab('I')
const lra = grab('LRA')
const peak = grab('Peak')

console.log(`[score] wrote   ${OUT}`)
console.log(`[score] measured ${duration.toFixed(6)}s, ${lufs} LUFS, LRA ${lra} LU, peak ${peak} dBFS`)

writeFileSync(
  PROV,
  `${JSON.stringify(
    {
      asset: OUT,
      role:
        'Score for the OpenScout Reimagined flagship film (55.000 s). Eerie and spacious with a restrained, legible pulse, as briefed.',
      provenance_summary:
        'A NEW master of an EXISTING raw MiniMax generation owned by the operator. Not a fresh generation, and not a copy of an existing master.',
      generation_not_attempted: {
        reason:
          'MiniMax Music was not reachable in this environment. readMusicModelConfig() requires a keyed music slot or MINIMAX_API_KEY; .data/provider.json carries empty apiKey strings on both the llm and vlm slots and MINIMAX_API_KEY is unset.',
        consequence:
          'scripts/generate-montage-score-v3-beat.ts cannot run here, so no new cue could be generated for this era.',
        remedy:
          'Set MINIMAX_API_KEY and re-run the generator, then re-run this masterer against the new raw file. Picture is unaffected: only edit-reimagined.ts `score` and a re-render are needed.',
      },
      raw_source: {
        file: RAW,
        sha256: sha256(RAW),
        duration_s: 133.886259,
        sidecar: 'public/tracks/generated/openscout-v3-beat-msqxiv1l.json',
        model: 'music-2.6',
        endpoint: 'https://api.minimax.io/v1/music_generation',
        instrumental: true,
        origin:
          "Generated through the operator's own MiniMax account by scripts/generate-montage-score-v3-beat.ts on 2026-08-12 for the V3 work. Prompt asked for an eerie, spacious electronic instrumental with a real but restrained pulse, no vocals and no EDM gestures.",
      },
      overlap_with_v3_master: {
        v3_window_s: [62.256, 107.28727],
        this_window_s: [WINDOW_START, WINDOW_END],
        note:
          'This window opens 10.007 s earlier and runs 10.083 s longer than the V3 Edit A master, but roughly 82% of its material is shared with it. The two films therefore share a musical identity. Recorded here rather than glossed over.',
      },
      window: {
        start_s: WINDOW_START,
        end_s: WINDOW_END,
        length_s: WINDOW_LEN,
        why_this_window:
          "The raw generation's first ~56 s is a 10-second phrase cycle decaying to near silence between phrases (troughs of -42 to -52 dBFS at 6-8, 16-18, 26-28, 36-38 and 46-48 s), which reads as dropouts under picture. 56-108 s is the sustained locked section. This window opens just inside the lift into it and ends where the arrangement thins naturally.",
        downbeat_alignment: `Six bars before the measured downbeat the V3 master was cut from (${V3_DOWNBEAT} s), in the delivered 143.9 BPM timebase (bar = ${BAR_143_9.toFixed(5)} s).`,
        no_crossfade:
          'A single continuous window. No splice, so the pulse stays phase-continuous for the whole film.',
      },
      tempo: {
        delivered_bpm: 143.9,
        mastered_bpm: 144.0,
        atempo: ATEMPO,
        consequence:
          'One bar is exactly 50 frames at 30 fps. The picture is 33 bars (29 content + 4 outro) = 1650 frames = 55.000 s, so every chapter boundary lands on a downbeat.',
      },
      mastering: {
        chain: `atempo=${ATEMPO} → loudnorm(I=-18:TP=-1.5:LRA=9) → aresample=${SR} → afade in ${FADE_IN}s → afade out ${FADE_OUT}s at ${(TARGET_S - FADE_OUT).toFixed(1)}s → apad → atrim to exactly ${TARGET_SAMPLES} samples (${TARGET_S.toFixed(3)}s)`,
        format: '48 kHz, stereo, 24-bit PCM WAV',
        script: 'scripts/master-openscout-reimagined-score.ts',
        sha256: sha256(OUT),
        bytes: statSync(OUT).size,
      },
      measured: {
        duration_s: duration,
        integrated_lufs: lufs,
        lra_lu: lra,
        true_peak_dbfs: peak,
      },
      in_composition: {
        edit: 'src/projects/openscout-montage/edit-reimagined.ts',
        gain: 0.92,
        safety_ramps_frames: { in: 8, out: 18 },
      },
      rights:
        "Original instrumental generated through the operator's own MiniMax account. No third-party recordings, samples or vocals.",
    },
    null,
    2,
  )}\n`,
)

console.log(`[score] wrote   ${PROV}`)
