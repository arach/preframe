#!/usr/bin/env bun
/**
 * Stage guided-tour capture + narration into public/ for Remotion.
 *
 * Footage (the .mov/.mp4 capture) is project-level and stays flat. Narration is
 * per-take and lives in its own folder, selected by TOUR_EXAMPLE + TOUR_SCRIPT.
 *
 *   TOUR_EXAMPLE=scout TOUR_SCRIPT=diary bun scripts/prep-guided-tour-assets.mjs
 */

import { mkdir, copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { resolveTourExample } from '../src/projects/guided-tour/profiles.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'docs/media/app');
const DEST = path.join(ROOT, 'public/guided-tour');

const example = resolveTourExample();
const slug = example.assetSlug;

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function stage(relFrom, relTo) {
  const src = path.join(SRC, relFrom);
  if (!(await exists(src))) {
    throw new Error(`Missing ${src} — run capture:tour, gen:narration, and render:guided-tour first`);
  }
  const dest = path.join(DEST, relTo);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest);
  console.log(`[prep] ${relTo}`);
}

// Shared footage — always flat.
const FOOTAGE = ['preframe-guided-tour.mov', 'preframe-guided-tour.mp4'];
// Per-take narration — flat for scout/diary, else under <slug>/.
const NARRATION = ['narration-segments.json', ...Array.from({ length: 6 }, (_, i) => `narration-${i}.mp3`)];

await mkdir(DEST, { recursive: true });

for (const name of FOOTAGE) {
  await stage(name, name);
}
for (const name of NARRATION) {
  const rel = slug ? path.join(slug, name) : name;
  await stage(rel, rel);
}

console.log(`[prep] → public/guided-tour/${slug ? `${slug}/` : ''} (${example.id}/${example.variantId})`);
