#!/usr/bin/env bun
// Generates the OpenScout montage score through Preframe's configured MiniMax
// Music path (same provider resolution and endpoint as app/api/music/generate).
//
//   bun run scripts/generate-montage-score.ts
//
// Writes the raw response to public/tracks/generated/<id>.mp3 plus a sidecar,
// exactly like the app route does. Mastering into the durable
// public/tracks/openscout/ asset is a separate ffmpeg step (see EDIT_PLAN.md).

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Buffer } from 'node:buffer'
import { getMiniMaxApiKey, readMusicModelConfig } from '../lib/provider'

const PROMPT = [
  'A 50-second modern kinetic ambient electronic instrumental for a precise developer-tool film.',
  'Warm rounded sub bass and a soft analog low end underneath; crisp, restrained percussion — brushed ticks,',
  'muted rim taps and a light closed hat — kept low in the mix and never busy. Above it, a small repeating',
  'signal motif: short plucked synthetic tones that hand off between the left and right field like packets',
  'finding a route, with clean delay and generous space around them. Keep harmony calm and mostly still,',
  'moving only twice. Build naturally: sparse and airy for the first 8 seconds, add the pulse by 12 seconds,',
  'widen the field around 25 seconds, reach the fullest but still controlled point near 35 seconds, then',
  'resolve and thin out from 40 seconds to a clean natural tail.',
  'No vocals, no spoken words, no vocal samples, no corporate uplift, no triumphant chords, no supersaw,',
  'no EDM drop, no riser, no trailer impact, no orchestral swell, no lo-fi hiss, no synthwave arpeggio wash.',
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
    throw new Error(`MiniMax music generation failed: ${data?.base_resp?.status_msg || res.statusText}`)
  }
  const audioHex = data?.data?.audio
  if (!audioHex || typeof audioHex !== 'string') {
    throw new Error('MiniMax music generation returned no audio')
  }

  const trackId = `openscout-montage-${Date.now().toString(36)}`
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
      {
        id: trackId,
        generated: true,
        provider: 'MiniMax',
        model,
        instrumental: true,
        prompt: payload.prompt,
        createdAt: new Date().toISOString(),
        request: { ...payload, authorization: 'Bearer [redacted]' },
        result: sanitized,
      },
      null,
      2,
    ),
  )

  console.log(`[score] wrote ${audioPath}`)
  console.log(`[score] traceId=${data?.trace_id ?? 'n/a'}`)
}

main().catch((err) => {
  console.error(`[score] ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
