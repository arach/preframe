#!/usr/bin/env bun
// Generates the beat-led score for OpenScout V3 Edit A (dark hero) through
// Preframe's configured MiniMax Music path — same provider resolution and
// endpoint as scripts/generate-montage-score.ts and app/api/music/generate.
//
//   bun run scripts/generate-montage-score-v3-beat.ts
//
// This is the rhythmic counterpart to the existing eerie/spacious montage
// score, which stays the bed for Edit B. The prompt deliberately keeps the same
// sonic world — cold air, wide field, a small repeating signal motif — and adds
// a real 120 BPM pulse so the cut has something to land on. 120 BPM is not
// arbitrary: Edit A's chapter grid is built on 60-frame bars at 30 fps, so one
// bar is exactly 2.000 s and every chapter boundary falls on a downbeat.
//
// Writes the raw response to public/tracks/generated/<id>.mp3 plus a sidecar,
// exactly like the app route does. Mastering into the durable
// public/tracks/openscout/ asset is a separate ffmpeg step.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Buffer } from 'node:buffer'
import { getMiniMaxApiKey, readMusicModelConfig } from '../lib/provider'

const PROMPT = [
  'A 60-second eerie, spacious electronic instrumental at a steady 120 BPM for a precise developer-tool film.',
  'Cold wide air and a deep rounded sub bass underneath. The pulse is real and legible but restrained:',
  'a dry muted kick on the downbeat, a soft rim tick on the offbeat, and a light closed hat — mixed low,',
  'never busy, never dance music. Above it, a small repeating signal motif of short plucked synthetic tones',
  'that hand off between the left and right field like packets finding a route, with clean delay and',
  'generous space around them. Keep the harmony cold, minor and mostly still, moving only twice.',
  'Structure: sparse and airy with pulse only hinted for the first 6 seconds, lock the beat in by 8 seconds,',
  'widen the field around 20 seconds, reach the fullest but still controlled point near 32 seconds,',
  'strip back to almost nothing for two bars around 40 seconds, return for a final restrained statement,',
  'then resolve and thin out from 52 seconds to a clean natural tail.',
  'No vocals, no spoken words, no vocal samples, no corporate uplift, no triumphant or major-key chords,',
  'no supersaw, no EDM drop, no riser, no trailer impact, no orchestral swell, no lo-fi hiss,',
  'no synthwave arpeggio wash, no funk, no swing, no busy percussion fills.',
].join(' ')

async function main() {
  const musicConfig = readMusicModelConfig()
  if (!musicConfig) {
    throw new Error('Music model is not configured (no MiniMax slot and no MINIMAX_API_KEY)')
  }
  const apiKey = getMiniMaxApiKey(musicConfig)
  if (!apiKey) throw new Error('Music model API key is not configured')

  const model = musicConfig.model || 'music-2.6'
  const audioSetting = { sample_rate: 44100, bitrate: 256000, format: 'mp3' }
  const payload = {
    model,
    prompt: PROMPT.slice(0, 2000),
    stream: false,
    output_format: 'hex',
    is_instrumental: true,
    audio_setting: audioSetting,
  }

  console.log(`[score] model=${model} endpoint=${musicConfig.baseUrl}/v1/music_generation`)
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

  const trackId = `openscout-v3-beat-${Date.now().toString(36)}`
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
    JSON.stringify(
      { id: trackId, model, prompt: PROMPT, audioSetting, response: sanitized },
      null,
      2,
    ),
  )

  console.log(`[score] wrote ${audioPath}`)
  console.log(`[score] bytes=${Math.floor(audioHex.length / 2)}`)
}

main().catch((error) => {
  console.error(`[score] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
