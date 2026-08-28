#!/usr/bin/env bun
// Generates the two scores for the OpenScout theme-range A/B through Preframe's
// configured MiniMax Music path — same provider resolution and endpoint as
// scripts/generate-montage-score.ts and app/api/music/generate.
//
//   bun run scripts/generate-theme-range-scores.ts beat
//   bun run scripts/generate-theme-range-scores.ts drift
//   bun run scripts/generate-theme-range-scores.ts both
//
// The A/B is a score test: one locked picture, two scores. So these two prompts
// are written to be genuinely different pieces of music rather than two dressings
// of one idea — different instrumentation, different density, different harmonic
// rate, different relationship to the cut. BEAT drives the film; DRIFT lets the
// film drive it.
//
// Tempo is requested but NOT assumed. The V3 provenance records MiniMax
// delivering 143.9 BPM against a requested 120, so the film's grid is built on
// the MEASURED tempo of the delivered BEAT track (see analyze-theme-range-score.ts),
// not on the number asked for here.
//
// Writes the raw response to public/tracks/generated/<id>.mp3 plus a sidecar,
// exactly like the app route does. Mastering into the durable
// public/tracks/openscout/ asset is a separate ffmpeg step.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Buffer } from 'node:buffer'
import { getMiniMaxApiKey, readMusicModelConfig } from '../lib/provider'

type Variant = 'beat' | 'drift'

// ---------------------------------------------------------------------------
// A — BEAT. Beat-forward, tactile, modern, inventive. The accents are meant to
// land on the theme changes, so the pulse has to be legible from early on and
// the phrase has to turn every 8 bars. "Elegant rather than frenetic" is the
// whole constraint: this is a designed object moving, not an ad.
// ---------------------------------------------------------------------------
const PROMPT_BEAT = [
  'A 60-second contemporary editorial sound-design score at a steady 100 BPM for a precise software interface film.',
  'Serious, architectural, restrained, tactile and slightly uncanny. This is a precision instrument, not a song.',
  'Use dry micro-percussion, muted low-frequency pulses, soft sub pressure, tiny mechanical clicks, granular ticks,',
  'controlled asymmetry and generous negative space. The pulse should be legible but understated, with only subtle',
  'density changes every eight bars. Keep the spectrum cool, close and modern. No melodic lead and no memorable hook.',
  'Open almost bare; establish the restrained pulse by eight seconds; add microscopic texture rather than musical',
  'layers; briefly widen the room around thirty seconds; reduce to sub and air near forty-five seconds; finish cleanly.',
  'Hard exclusions: no synthwave, no retro or 1980s timbres, no gated drums, no training-montage rhythm, no heroic',
  'chords, no power arpeggio, no electric piano, no marimba, no brass, no cinematic uplift, no EDM, no corporate-tech',
  'stock cue, no riser, no trailer impact, no orchestral swell, no vocals, no spoken words, no sentimental melody.',
].join(' ')

// ---------------------------------------------------------------------------
// B — DRIFT. Spacious, eerie, intimate, ambient. Deliberately shares no
// instrument family, no rhythmic layer and no harmonic rate with BEAT: where
// BEAT is struck and dry, DRIFT is bowed and wet. "Emotionally confident rather
// than sleepy" is the constraint that keeps it from becoming wallpaper.
// ---------------------------------------------------------------------------
const PROMPT_DRIFT = [
  'A 60-second dark spatial electronic sound-design score for a quiet software interface film.',
  'Serious, cool, intimate, contemporary and emotionally confident. Nearly beatless. Build it from a low suspended',
  'electronic tone, granular air, subtle room pressure, restrained broadband texture and rare short metallic micro-events.',
  'Use depth, silence and very slow spectral movement instead of melody or chord progressions. The atmosphere should feel',
  'designed and architectural, not mystical, decorative, sleepy or wellness-coded. Begin with low air and pressure, widen',
  'slightly through the middle, approach near-silence around forty-five seconds, then return as a close dark texture and decay.',
  'Hard exclusions: no flute or breathy wind instrument, no shakuhachi-like tone, no pentatonic or orientalist gesture,',
  'no spa, garden, meditation or New Age music, no strings, no piano, no vibraphone, no bells, no chimes, no nature sounds,',
  'no synthwave, no arpeggiator, no retro timbre, no sentimental harmony, no cinematic swell, no trailer effect, no vocals.',
].join(' ')

const PROMPTS: Record<Variant, string> = { beat: PROMPT_BEAT, drift: PROMPT_DRIFT }

async function generate(variant: Variant) {
  const musicConfig = readMusicModelConfig()
  if (!musicConfig) {
    throw new Error('Music model is not configured (no MiniMax slot and no MINIMAX_API_KEY)')
  }
  const apiKey = getMiniMaxApiKey(musicConfig)
  if (!apiKey) throw new Error('Music model API key is not configured')

  const prompt = PROMPTS[variant]
  const model = musicConfig.model || 'music-2.6'
  const audioSetting = { sample_rate: 44100, bitrate: 256000, format: 'mp3' }
  const payload = {
    model,
    prompt: prompt.slice(0, 2000),
    stream: false,
    output_format: 'hex',
    is_instrumental: true,
    audio_setting: audioSetting,
  }

  console.log(`[score:${variant}] model=${model} endpoint=${musicConfig.baseUrl}/v1/music_generation`)
  const res = await fetch(`${musicConfig.baseUrl}/v1/music_generation`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await res.json()) as any
  const statusCode = data?.base_resp?.status_code
  if (!res.ok || statusCode !== 0) {
    throw new Error(
      `MiniMax music generation failed: ${data?.base_resp?.status_msg || res.statusText}`,
    )
  }
  const audioHex = data?.data?.audio
  if (!audioHex || typeof audioHex !== 'string') {
    throw new Error('MiniMax music generation returned no audio')
  }

  const trackId = `openscout-theme-range-${variant}-${Date.now().toString(36)}`
  const outputDir = join(process.cwd(), 'public', 'tracks', 'generated')
  mkdirSync(outputDir, { recursive: true })
  const audioPath = join(outputDir, `${trackId}.mp3`)
  writeFileSync(audioPath, Buffer.from(audioHex, 'hex'))

  const sanitized = JSON.parse(
    JSON.stringify({
      ...data,
      data: { ...(data?.data ?? {}), audio: undefined, audioBytes: Math.floor(audioHex.length / 2) },
    }),
  )
  writeFileSync(
    join(outputDir, `${trackId}.json`),
    JSON.stringify({ id: trackId, variant, model, prompt, audioSetting, response: sanitized }, null, 2),
  )

  console.log(`[score:${variant}] wrote ${audioPath}`)
  console.log(`[score:${variant}] bytes=${Math.floor(audioHex.length / 2)}`)
}

async function main() {
  const arg = (process.argv[2] ?? 'both').toLowerCase()
  const variants: Variant[] =
    arg === 'both' ? ['beat', 'drift'] : arg === 'beat' || arg === 'drift' ? [arg] : []
  if (!variants.length) throw new Error(`Unknown variant: ${arg} (expected beat | drift | both)`)
  for (const v of variants) await generate(v)
}

main().catch((error) => {
  console.error(`[score] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
