#!/usr/bin/env bun
/**
 * Render the narrated Preframe guided tour (Remotion).
 *
 *   bun run render:guided-tour
 *
 * Prereqs: capture:tour + gen-narration (or existing docs/media/app assets)
 */

import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveTourExample } from '../src/projects/guided-tour/profiles.ts';
import { buildCaptions } from '../src/projects/guided-tour/story.ts';
import { guidedTourDefaultTiming } from '../src/projects/guided-tour/beats.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const MEDIA = path.join(ROOT, 'docs/media/app');
// scout/diary renders to the flat landing path; every other take to its own folder.
const SLUG = resolveTourExample().assetSlug;
const OUT = SLUG
  ? path.join(MEDIA, SLUG, 'preframe-guided-tour.mp4')
  : path.join(MEDIA, 'preframe-guided-tour.mp4');
const SEGMENTS_META = SLUG
  ? path.join(MEDIA, SLUG, 'narration-segments.json')
  : path.join(MEDIA, 'narration-segments.json');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd: ROOT });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

await run(process.execPath, [path.join(ROOT, 'scripts/prep-guided-tour-assets.mjs')]);
await run('bun', ['run', 'gen:compositions']);

let example = resolveTourExample();
let narrationSegments = guidedTourDefaultTiming.narrationSegments;
try {
  const meta = JSON.parse(await readFile(SEGMENTS_META, 'utf8'));
  if (meta.example) example = resolveTourExample(meta.example);
  if (Array.isArray(meta.segments) && meta.segments.length) {
    narrationSegments = meta.segments;
  }
} catch {
  console.warn('[render] narration-segments.json missing — using default segment timings');
}

const renderProps = {
  ...guidedTourDefaultTiming,
  narrationSegments,
  sceneLabel: example.sceneLabel,
  sceneSublabel: example.sceneSublabel,
  exampleId: example.id,
  captions: buildCaptions(example.captions),
};

await mkdir(path.dirname(OUT), { recursive: true });

await run('bunx', [
  'remotion', 'render',
  'src/index.ts',
  'GuidedTour',
  OUT,
  '--concurrency=4',
  '--props', JSON.stringify(renderProps),
]);

console.log(`[done] ${OUT}`);