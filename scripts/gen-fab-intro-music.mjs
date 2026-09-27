#!/usr/bin/env bun
/**
 * fab intro music bed via ElevenLabs Music → public/fab-intro/music.mp3.
 * Run: secret run ELEVENLABS_API_KEY -- bun scripts/gen-fab-intro-music.mjs [seconds] [name]
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('ELEVENLABS_API_KEY not set'); process.exit(1); }
const secs = Number(process.argv[2] || 80);
const name = process.argv[3] || 'music';

const prompt = `Instrumental underscore for a calm, crafted product film about a Mac app. ${secs} seconds, no vocals.
0-20s: sparse and slightly restless: a muted felt piano motif, soft ticking percussion, a low unresolved pad, like too many things open at once.
Around 20s: a clear lift and resolve, a warm plucked string line enters, the harmony opens up into a major key.
20-${secs - 8}s: a gentle, confident groove at about 96 BPM: soft kick and brushed hats, warm Rhodes chords, round bass, light plucked arpeggios. Understated, lets a narrator sit on top.
Last 8s: strip back to piano and pad and land on a clean final chord that rings out.
Mood: warm, modern, precise, human; think tasteful Apple keynote bed, not corporate stock music.`;

const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'xi-api-key': KEY },
  body: JSON.stringify({ prompt, music_length_ms: secs * 1000, model_id: 'music_v1' }),
});
if (!res.ok) { console.error(`ElevenLabs ${res.status}: ${await res.text()}`); process.exit(1); }
const out = path.resolve(`public/fab-intro/${name}.mp3`);
fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log(out);
