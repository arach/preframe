#!/usr/bin/env bun
/**
 * Voice every take (project x variant) via ElevenLabs, each into its own folder.
 *
 *   secret run ELEVENLABS_API_KEY -- bun run gen:narration:all
 *
 * Filter with ONLY_EXAMPLE=scout (one project) and/or ONLY_SCRIPT=diary (one take).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { TOUR_PROJECTS } from '../src/projects/guided-tour/profiles.ts';

const ROOT = path.resolve(import.meta.dirname, '..');

if (!process.env.ELEVENLABS_API_KEY) {
  console.error('ELEVENLABS_API_KEY not set — run via: secret run ELEVENLABS_API_KEY -- bun run gen:narration:all');
  process.exit(1);
}

const onlyExample = process.env.ONLY_EXAMPLE || null;
const onlyScript = process.env.ONLY_SCRIPT || null;

function run(env) {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['scripts/gen-narration.mjs'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`gen-narration exited ${code}`))));
  });
}

const takes = [];
for (const [pid, project] of Object.entries(TOUR_PROJECTS)) {
  if (onlyExample && pid !== onlyExample) continue;
  for (const vid of Object.keys(project.variants)) {
    if (onlyScript && vid !== onlyScript) continue;
    takes.push([pid, vid]);
  }
}

console.log(`[all] voicing ${takes.length} takes: ${takes.map(([p, v]) => `${p}/${v}`).join(', ')}\n`);

let done = 0;
for (const [pid, vid] of takes) {
  console.log(`\n=== ${pid} / ${vid}  (${++done}/${takes.length}) ===`);
  await run({ TOUR_EXAMPLE: pid, TOUR_SCRIPT: vid });
}

console.log(`\n[all] done — ${takes.length} takes voiced`);
