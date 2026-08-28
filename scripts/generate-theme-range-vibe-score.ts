#!/usr/bin/env bun
// A fresh soundtrack pass for the LOCKED 31.2 s OpenScout theme-range film,
// through Preframe's configured MiniMax Music path — same provider resolution
// and endpoint as scripts/generate-theme-range-scores.ts and app/api/music/generate.
//
//   bun run scripts/generate-theme-range-vibe-score.ts nightfall
//   bun run scripts/generate-theme-range-vibe-score.ts all
//
// ---------------------------------------------------------------------------
// WHAT THE EARLIER PASSES GOT WRONG
// ---------------------------------------------------------------------------
//
// Pass 2 (`generate-theme-range-scores.ts`) asked MiniMax for "contemporary
// editorial sound design", "a precision instrument, not a song", "no melodic
// lead and no memorable hook", and then hung ~30 forbidden nouns off the end.
// It came back as circus/calliope music and was rejected outright.
//
// Two lessons are baked into the prompts below.
//
//  1. ASK FOR MUSIC. A text-to-music model has no useful prior for "abstract
//     texture with no hook". Denied a genre it will invent one, and the one it
//     invents is novelty. Every prompt here names a real contemporary genre in
//     its first clause and asks for an actual motif.
//  2. SHORT EXCLUSION LISTS. Long "no X, no Y, no Z" tails read to the model as
//     a bag of salient nouns, not as negation — the pass that banned marimba
//     hardest is the pass that came back sounding like a fairground. Each prompt
//     carries at most one short negative sentence, and the positive description
//     does the steering.
//
// Three candidates are generated so the pick is a comparison rather than a hope.
// They share the brief — cool, confident, grooving, genuinely melodic — and
// differ in how they get there. Only one is delivered.
//
// Writes the raw response to public/tracks/generated/<id>.mp3 plus a sidecar,
// exactly like the app route does. Mastering into the durable
// public/tracks/openscout/ asset is a separate ffmpeg step.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Buffer } from 'node:buffer'
import { getMiniMaxApiKey, readMusicModelConfig } from '../lib/provider'

type Variant = 'nightfall' | 'glasshouse' | 'signal'

// ---------------------------------------------------------------------------
// A — NIGHTFALL. Organic downtempo house. The safest read of "current product
// promo that is actually good": a real groove you could nod to, a warm analog
// low end, and a short plucked motif that is the piece's identity. Cool rather
// than cold; the mystery comes from the harmony, not from withholding melody.
// ---------------------------------------------------------------------------
const PROMPT_NIGHTFALL = [
  'A modern downtempo organic-house instrumental, around 100 BPM, in a minor key.',
  'Think contemporary electronic producers who score design films: warm, patient, confident and quietly cool.',
  'Foundation: a deep round analog sub bass playing a simple syncopated two-bar figure, a soft dry kick,',
  'a close brushed shaker, a light rim tick on the offbeat, and a filtered noise sweep breathing once a bar.',
  'Lead: a short four-note plucked synth motif with a soft attack and a clean quarter-note delay, panned wide,',
  'repeating with small variations so it becomes the identity of the piece. Under it, sustained analog pads',
  'move through a slow minor-seventh progression, one chord every two bars, warm and slightly unresolved.',
  'Give it real groove and swing-free forward motion, but keep the arrangement uncluttered with space around every element.',
  'Structure: bass and pulse alone for the first eight seconds; the full groove locked by twelve seconds;',
  'the motif enters around sixteen seconds; widest and most emotional between thirty and forty-five seconds;',
  'strip to bass and pad for four bars around fifty seconds; a final full statement, then a clean natural tail.',
  'Instrumental only, no vocals. Keep it tasteful and modern — not retro, not triumphant, not stock corporate.',
].join(' ')

// ---------------------------------------------------------------------------
// B — GLASSHOUSE. Melodic techno / cinematic electronic. More propulsive and a
// touch darker; the mystery is explicit. The motif is arpeggiated rather than
// plucked, so the piece drives the picture instead of floating over it.
// ---------------------------------------------------------------------------
const PROMPT_GLASSHOUSE = [
  'A cinematic melodic-techno instrumental around 100 BPM in a dark minor key — sophisticated, hypnotic and cool.',
  'A tight dry kick with real weight, a deep sustained bass note pulsing underneath, crisp closed hats',
  'with a subtle sixteenth-note pattern, and a single dry clap on the backbeat, all mixed with air around them.',
  'The hook is a hypnotic arpeggiated synth figure — glassy, slightly detuned, drenched in a long dark reverb —',
  'that cycles every two bars and slowly opens its filter across the piece. Beneath it, low bowed strings hold',
  'long minor chords that shift roughly every four bars, giving the groove a serious, slightly mysterious weight.',
  'Elegant and restrained rather than aggressive: this should feel like a beautiful machine running, not a club track.',
  'Structure: bass pulse and air alone for eight seconds; the beat lands by twelve seconds; the arpeggio enters',
  'around eighteen seconds and takes over; fullest and most open between thirty-two and forty-eight seconds;',
  'a two-bar breakdown to strings and reverb near fifty-five seconds; the groove returns once, then decays cleanly.',
  'Instrumental only, no vocals. Modern and understated — no retro synthwave, no big EDM drop, no heroic uplift.',
].join(' ')

// ---------------------------------------------------------------------------
// C — SIGNAL. Contemporary broken-beat / future-soul groove. The loosest and
// most human of the three: a laid-back pocket, real chord voicings, and a
// melodic lead with actual phrasing. The risk is charm tipping into lounge, so
// the prompt keeps the harmony cool and the palette electronic.
// ---------------------------------------------------------------------------
const PROMPT_SIGNAL = [
  'A contemporary electronic instrumental with a relaxed broken-beat groove around 96 BPM, cool and sophisticated.',
  'Modern future-soul production: a laid-back pocket with a soft tight kick slightly behind the beat, a dry snare',
  'with light ghost notes, close hats, and a warm rounded electric bass playing a melodic line rather than root notes.',
  'Harmony is lush but restrained — minor ninth and eleventh voicings on a soft filtered synth keyboard, moving',
  'every two bars, cool and a little mysterious rather than sweet. The lead is a smooth muted synth line with real',
  'phrasing: a memorable six-note idea, stated, answered, then developed, with clean delay and generous space.',
  'Confident and understated, with a groove that feels effortless and human rather than programmed.',
  'Structure: bass and drums establish the pocket in the first ten seconds; the keys enter by fourteen seconds;',
  'the lead states its idea around twenty seconds; the fullest and warmest passage between thirty and forty-eight',
  'seconds; a short stripped-back passage near fifty-five seconds; then a final statement resolving to a clean tail.',
  'Instrumental only, no vocals. Keep it modern and tasteful — not jazzy lounge, not lo-fi, not stock corporate.',
].join(' ')

const PROMPTS: Record<Variant, string> = {
  nightfall: PROMPT_NIGHTFALL,
  glasshouse: PROMPT_GLASSHOUSE,
  signal: PROMPT_SIGNAL,
}

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

  console.log(`[vibe:${variant}] model=${model} endpoint=${musicConfig.baseUrl}/v1/music_generation`)
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

  const trackId = `openscout-vibe-${variant}-${Date.now().toString(36)}`
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

  console.log(`[vibe:${variant}] wrote ${audioPath}`)
  console.log(`[vibe:${variant}] bytes=${Math.floor(audioHex.length / 2)}`)
}

async function main() {
  const arg = (process.argv[2] ?? 'all').toLowerCase()
  const all: Variant[] = ['nightfall', 'glasshouse', 'signal']
  const variants: Variant[] = arg === 'all' ? all : all.includes(arg as Variant) ? [arg as Variant] : []
  if (!variants.length) throw new Error(`Unknown variant: ${arg} (expected ${all.join(' | ')} | all)`)
  for (const v of variants) await generate(v)
}

main().catch((error) => {
  console.error(`[vibe] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
