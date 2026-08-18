#!/usr/bin/env node
/**
 * Guided tour narration via ElevenLabs.
 *
 * Beat clips (narration-0..5.mp3) play at tour markers with silence between —
 * lets the capture breathe. Also writes narration-segments.json for Remotion.
 *
 * Select the take with TOUR_EXAMPLE (scout|talkie|lattices) + TOUR_SCRIPT
 * (diary|problem|terse|craft). Each take writes to its own asset folder.
 *
 * Run:  TOUR_EXAMPLE=scout TOUR_SCRIPT=diary secret run ELEVENLABS_API_KEY -- bun scripts/gen-narration.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveTourExample } from '../src/projects/guided-tour/profiles.ts';
import { buildCaptions } from '../src/projects/guided-tour/story.ts';
import { resolveNarrationSegments, narrationPauses, NARRATION_MIN_PAUSE_SEC } from '../src/projects/guided-tour/narration.ts';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('ELEVENLABS_API_KEY not set (use: secret run ELEVENLABS_API_KEY -- ...)');
  process.exit(1);
}

const example = resolveTourExample();
const captions = buildCaptions(example.captions);

// Per-subject narrator (profiles.ts), overridable with NARRATION_VOICE.
const VOICE = process.env.NARRATION_VOICE || example.voice || 'EXAVITQu4vr4xnSDxMaL';
const MODEL = process.env.NARRATION_MODEL || 'eleven_multilingual_v2';
// Each take (project + variant) gets its own folder so voicing them all never
// clobbers; the canonical scout/diary keeps the legacy flat path.
const OUT = example.assetSlug
  ? path.resolve('docs/media/app', example.assetSlug)
  : path.resolve('docs/media/app');

const LINES = example.landingBeats.map((beat) => beat.narration);

const LINE_VOICE = {
  stability: 0.7,
  similarity_boost: 0.55,
  style: 0.0,
  use_speaker_boost: false,
};

async function gen(text, outPath, voiceSettings, { trailingBreak = false } = {}) {
  const payload = trailingBreak ? `${text} <break time="0.4s" />` : text;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}`, {
    method: 'POST',
    headers: { Accept: 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': KEY },
    body: JSON.stringify({
      text: payload,
      model_id: MODEL,
      voice_settings: voiceSettings,
    }),
  });
  if (!res.ok) {
    console.error(`ElevenLabs ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

function probeDurationSec(filePath) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    filePath,
  ], { encoding: 'utf8' });
  const value = Number(result.stdout.trim());
  return Number.isFinite(value) ? value : null;
}

fs.mkdirSync(OUT, { recursive: true });

const durations = [];
for (let i = 0; i < LINES.length; i++) {
  const out = path.join(OUT, `narration-${i}.mp3`);
  await gen(LINES[i], out, LINE_VOICE, { trailingBreak: false });
  const dur = probeDurationSec(out);
  durations.push(dur ?? 4);
  console.log(`✓ narration-${i}.mp3  (${dur?.toFixed(1) ?? '?'}s)  "${LINES[i].slice(0, 48)}…"`);
}

const segments = resolveNarrationSegments(captions, durations, example.narrationPrefix);
const segmentsMeta = {
  example: example.id,
  variant: example.variantId,
  assetSlug: example.assetSlug,
  sceneLabel: example.sceneLabel,
  voice: VOICE,
  voiceLabel: example.voiceLabel,
  model: MODEL,
  mode: 'beat-segments',
  minPauseSec: NARRATION_MIN_PAUSE_SEC,
  segments,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(OUT, 'narration-segments.json'), `${JSON.stringify(segmentsMeta, null, 2)}\n`);

const pauses = narrationPauses(segments);
console.log(`✓ narration-segments.json  (${segments.length} beats, pauses: ${pauses.map((p) => `${p}s`).join(', ')})`);
console.log('done');