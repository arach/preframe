#!/usr/bin/env bun
/**
 * fab intro narration via ElevenLabs: one wav per beat in public/fab-intro/vo-N.wav,
 * then rewrites src/projects/fab-intro/timing.ts with the probed lengths.
 *
 * Run:     secret run ELEVENLABS_API_KEY -- bun scripts/gen-fab-intro-voice.mjs
 * Audition: ... gen-fab-intro-voice.mjs --audition   (line 2 in each AUDITION voice)
 * Only:    --only 1,2   (regenerate those lines, keep the rest)
 * Voice:   FAB_VOICE=<voice id>   Model: FAB_VOICE_MODEL (default eleven_multilingual_v2)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { LINES } from '../src/projects/fab-intro/lines.ts';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('ELEVENLABS_API_KEY not set (use: secret run ELEVENLABS_API_KEY -- ...)');
  process.exit(1);
}

const AUDITION = {
  will: 'bIHbv24MWmeRgasZH58o', // young American, relaxed
  liam: 'TX3LPaxmHKxFdv7VOQHJ', // young American, confident
  charlie: 'IKne3meq5aSn9XLyUdCD', // young Australian, energetic
  chris: 'iP95p4xoKVk53GoZ742B', // down-to-earth, casual
  brian: 'nPczCjzI2devNBz1zQrb', // deep, resonant (older reference)
};
const VOICE = process.env.FAB_VOICE || AUDITION.will;
const MODEL = process.env.FAB_VOICE_MODEL || 'eleven_multilingual_v2';
const SETTINGS = { stability: 0.6, similarity_boost: 0.7, style: 0.15, use_speaker_boost: true };
const OUT = path.resolve('public/fab-intro');

async function tts(voice, text, wavPath) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_192`, {
    method: 'POST',
    headers: { Accept: 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': KEY },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const mp3 = wavPath.replace(/\.wav$/, '.mp3');
  fs.writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  // trim leading/trailing silence so the beat timing owns the pauses
  const trim = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse';
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', mp3, '-af', trim, '-ar', '48000', wavPath]);
  fs.rmSync(mp3);
}

const probe = (f) =>
  Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout.trim());

fs.mkdirSync(OUT, { recursive: true });

if (process.argv.includes('--audition')) {
  const dir = path.join(OUT, 'audition');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, id] of Object.entries(AUDITION)) {
    const f = path.join(dir, `${name}.wav`);
    await tts(id, `${LINES[0]} ${LINES[1]}`, f);
    console.log(`${name}\t${probe(f).toFixed(2)}s\t${f}`);
  }
  process.exit(0);
}

const onlyArg = process.argv[process.argv.indexOf('--only') + 1];
const only = process.argv.includes('--only') ? new Set(onlyArg.split(',').map(Number)) : null;
const secs = [];
for (let i = 0; i < LINES.length; i++) {
  const f = path.join(OUT, `vo-${i + 1}.wav`);
  if (!only || only.has(i + 1)) await tts(VOICE, LINES[i], f);
  secs.push(Number(probe(f).toFixed(3)));
  console.log(`vo-${i + 1}\t${secs[i]}s`);
}

fs.writeFileSync(
  path.resolve('src/projects/fab-intro/timing.ts'),
  `/**
 * Narration lengths in seconds, one per beat, probed from public/fab-intro/vo-N.wav.
 * Written by scripts/gen-fab-intro-voice.mjs (ElevenLabs voice ${VOICE}, ${MODEL}).
 */
export const VO_SEC = ${JSON.stringify(secs).replace(/,/g, ', ')};
`,
);
