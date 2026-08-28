/**
 * Runs — persistence, idempotent updates, and URL/deep-link resolution.
 *
 *   bun test
 *
 * The store is pointed at a scratch directory so these never touch `.data/runs`.
 */

import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  absoluteUrl,
  bestItemHref,
  deriveItemKey,
  runHero,
  runItemPath,
  runPath,
  slugifyRunId,
  summarizeRun,
} from '@/lib/runs';
import {
  isCatalogPathname,
  parseCatalogRoute,
  pathForRun,
  pathForTrack,
  pathForView,
} from '@/catalog/lib/routes';
import { linksForRun } from '@/services/runs/intake';
import { getRun, listRuns, upsertRun } from '@/services/runs/store';

const scratch = await mkdtemp(join(tmpdir(), 'preframe-runs-'));
process.env.PREFRAME_RUNS_DIR = scratch;

afterAll(async () => {
  await rm(scratch, { recursive: true, force: true });
});

beforeEach(async () => {
  await rm(scratch, { recursive: true, force: true });
});

const SEED = {
  slug: 'openscout-v3-montage',
  title: 'OpenScout V3 — montage',
  description: 'Two edits, three formats each.',
  status: 'review' as const,
  groups: [
    { label: 'Finals', order: 0 },
    { label: 'Score', order: 1 },
  ],
  items: [
    {
      role: 'final' as const,
      label: 'Edit A · Dark hero — 16:9',
      group: 'Finals',
      preferred: true,
      path: 'out/openscout-v3/openscout-v3-dark-hero-1920x1080.mp4',
      meta: { format: '16:9' },
    },
    {
      role: 'variant' as const,
      label: 'Edit A · Dark hero — 9:16',
      group: 'Finals',
      path: 'out/openscout-v3/openscout-v3-dark-hero-1080x1920.mp4',
      meta: { format: '9:16' },
    },
    {
      role: 'score' as const,
      label: 'V3 beat score',
      group: 'Score',
      preferred: true,
      path: 'public/tracks/openscout/openscout-v3-beat-score.wav',
    },
  ],
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

describe('persistence', () => {
  test('a created run reads back with its groups, items and ordering', async () => {
    const { run, created } = await upsertRun(SEED);
    expect(created).toBe(true);

    const readBack = await getRun('openscout-v3-montage');
    expect(readBack).not.toBeNull();
    expect(readBack!.title).toBe('OpenScout V3 — montage');
    expect(readBack!.status).toBe('review');
    expect(readBack!.items).toHaveLength(3);
    expect(readBack!.groups.map(g => g.id)).toEqual(['finals', 'score']);
    expect(readBack!.items.map(i => i.order)).toEqual([0, 1, 2]);
    expect(readBack!.createdAt).toBe(run.createdAt);
  });

  test('items carry a stable, URL-safe id derived from their label', async () => {
    const { run } = await upsertRun(SEED);
    expect(run.items.map(i => i.id)).toEqual([
      'edit-a-dark-hero-16-9',
      'edit-a-dark-hero-9-16',
      'v3-beat-score',
    ]);
    for (const item of run.items) {
      expect(encodeURIComponent(item.id)).toBe(item.id);
    }
  });

  test('the slug is normalized on read as well as write', async () => {
    await upsertRun({ title: 'OpenScout V3 — Montage' });
    expect(await getRun('openscout-v3-montage')).not.toBeNull();
    expect(await getRun('OpenScout V3 — Montage')).not.toBeNull();
  });

  test('listRuns returns most-recently-updated first', async () => {
    await upsertRun({ slug: 'first', title: 'First' });
    await new Promise(r => setTimeout(r, 5));
    await upsertRun({ slug: 'second', title: 'Second' });

    const runs = await listRuns();
    expect(runs.map(r => r.slug)).toEqual(['second', 'first']);
  });

  test('listRuns is empty, not an error, before any run exists', async () => {
    expect(await listRuns()).toEqual([]);
  });

  test('a missing run reads as null', async () => {
    expect(await getRun('nope')).toBeNull();
  });

  test('a run with neither slug nor title is rejected', async () => {
    await expect(upsertRun({})).rejects.toThrow(/slug or a title/);
  });

  test('an item with no identity at all is rejected', async () => {
    await expect(
      upsertRun({
        slug: 'bad',
        title: 'Bad',
        items: [{ role: 'final', label: 'Nowhere' }],
      }),
    ).rejects.toThrow(/catalogId, path, url, nativeHref/);
  });
});

// ---------------------------------------------------------------------------
// Idempotent updates
// ---------------------------------------------------------------------------

describe('idempotent updates', () => {
  test('re-posting the same payload updates in place — no duplicates, ids intact', async () => {
    const first = await upsertRun(SEED);
    await new Promise(r => setTimeout(r, 5));
    const second = await upsertRun(SEED);

    expect(second.created).toBe(false);
    expect(second.createdItemIds).toEqual([]);
    expect(second.updatedItemIds).toHaveLength(3);
    expect(second.run.items).toHaveLength(3);
    expect(second.run.items.map(i => i.id)).toEqual(first.run.items.map(i => i.id));
    expect(second.run.createdAt).toBe(first.run.createdAt);
    expect(second.run.updatedAt >= first.run.updatedAt).toBe(true);
  });

  test('an item keeps its id — and therefore its deep link — when its label changes', async () => {
    const first = await upsertRun(SEED);
    const originalId = first.run.items[0].id;

    const renamed = await upsertRun({
      slug: SEED.slug,
      items: [{ ...SEED.items[0], label: 'Edit A · Dark hero — landscape' }],
    });

    const item = renamed.run.items.find(i => i.id === originalId);
    expect(item).toBeDefined();
    expect(item!.label).toBe('Edit A · Dark hero — landscape');
    expect(renamed.run.items).toHaveLength(3);
  });

  test('a pending item upgrades to ready in place once its file lands', async () => {
    await upsertRun({
      slug: 'render',
      title: 'Render',
      items: [
        { role: 'final', label: 'Hero', path: 'out/hero.mp4', state: 'pending' },
      ],
    });

    const after = await upsertRun({
      slug: 'render',
      items: [
        { role: 'final', label: 'Hero', path: 'out/hero.mp4', state: 'ready', url: '/out/hero.mp4' },
      ],
    });

    expect(after.run.items).toHaveLength(1);
    expect(after.run.items[0].id).toBe('hero');
    expect(after.run.items[0].state).toBe('ready');
    expect(after.run.items[0].ref.url).toBe('/out/hero.mp4');
  });

  test('merge mode leaves untouched items alone', async () => {
    await upsertRun(SEED);
    const merged = await upsertRun({
      slug: SEED.slug,
      items: [
        { role: 'note', label: 'Review note', group: 'Finals', url: '/notes/1' },
      ],
    });
    expect(merged.run.items).toHaveLength(4);
    expect(merged.removedItemIds).toEqual([]);
  });

  test('replace mode drops what is not in the payload, keeping survivor ids', async () => {
    const first = await upsertRun(SEED);
    const survivorId = first.run.items[0].id;

    const replaced = await upsertRun({
      slug: SEED.slug,
      items: [SEED.items[0]],
      itemsMode: 'replace',
    });

    expect(replaced.run.items).toHaveLength(1);
    expect(replaced.run.items[0].id).toBe(survivorId);
    expect(replaced.removedItemIds).toHaveLength(2);
  });

  test('marking a new preferred final demotes the previous one', async () => {
    await upsertRun(SEED);
    const after = await upsertRun({
      slug: SEED.slug,
      items: [{ ...SEED.items[0], preferred: false }, { ...SEED.items[1], role: 'final', preferred: true }],
    });

    const preferred = after.run.items.filter(i => i.role === 'final' && i.preferred);
    expect(preferred).toHaveLength(1);
    expect(preferred[0].label).toBe('Edit A · Dark hero — 9:16');
  });

  test('a preferred score is not demoted by a preferred final — preference is per role', async () => {
    await upsertRun(SEED);
    const after = await upsertRun({ slug: SEED.slug, items: [SEED.items[0]] });
    expect(after.run.items.find(i => i.role === 'score')!.preferred).toBe(true);
    expect(after.run.items.find(i => i.role === 'final')!.preferred).toBe(true);
  });

  test('an explicit key upserts even when the path changes', async () => {
    await upsertRun({
      slug: 'keyed',
      title: 'Keyed',
      items: [{ key: 'hero', role: 'final', label: 'Hero', path: 'out/v1.mp4' }],
    });
    const after = await upsertRun({
      slug: 'keyed',
      items: [{ key: 'hero', role: 'final', label: 'Hero', path: 'out/v2.mp4' }],
    });

    expect(after.run.items).toHaveLength(1);
    expect(after.run.items[0].ref.path).toBe('out/v2.mp4');
  });

  test('deriveItemKey is stable for the same role and identity', () => {
    expect(deriveItemKey('final', { path: 'out/a.mp4' })).toBe(
      deriveItemKey('final', { path: 'out/a.mp4' }),
    );
    expect(deriveItemKey('final', { path: 'out/a.mp4' })).not.toBe(
      deriveItemKey('source', { path: 'out/a.mp4' }),
    );
  });
});

// ---------------------------------------------------------------------------
// URL contract / deep-link resolution
// ---------------------------------------------------------------------------

describe('URL and deep-link resolution', () => {
  test('/runs is the runs collection', () => {
    const r = parseCatalogRoute('/runs');
    expect(r.view).toBe('runs');
    expect(r.runSlug).toBeNull();
    expect(r.runItemId).toBeNull();
    expect(pathForView('runs')).toBe('/runs');
  });

  test('/runs/:slug resolves the canonical run URL', () => {
    const r = parseCatalogRoute('/runs/openscout-v3-montage');
    expect(r.view).toBe('runs');
    expect(r.runSlug).toBe('openscout-v3-montage');
    expect(r.runItemId).toBeNull();
  });

  test('/runs/:slug/items/:itemId resolves the artifact deep link', () => {
    const r = parseCatalogRoute('/runs/openscout-v3-montage/items/edit-a-dark-hero-16-9');
    expect(r.runSlug).toBe('openscout-v3-montage');
    expect(r.runItemId).toBe('edit-a-dark-hero-16-9');
  });

  test('build → parse round-trips, including characters that need encoding', () => {
    const slug = 'run with spaces';
    const itemId = 'item/with/slashes';
    const path = pathForRun(slug, itemId);
    expect(path).toBe('/runs/run%20with%20spaces/items/item%2Fwith%2Fslashes');

    const r = parseCatalogRoute(path);
    expect(r.runSlug).toBe(slug);
    expect(r.runItemId).toBe(itemId);
  });

  test('pathForRun and runPath agree — one URL contract, two callers', () => {
    expect(pathForRun('openscout-v3-montage')).toBe(runPath('openscout-v3-montage'));
    expect(pathForRun('openscout-v3-montage', 'hero')).toBe(
      runItemPath('openscout-v3-montage', 'hero'),
    );
  });

  test('run paths are recognised as catalog shell paths so the editor renders them', () => {
    expect(isCatalogPathname('/runs')).toBe(true);
    expect(isCatalogPathname('/runs/openscout-v3-montage')).toBe(true);
    expect(isCatalogPathname('/runs/openscout-v3-montage/items/hero')).toBe(true);
    expect(isCatalogPathname('/not-a-catalog-surface')).toBe(false);
  });

  test('/music/:trackId is a resource, /music is still the collection', () => {
    expect(parseCatalogRoute('/music').view).toBe('music');
    expect(parseCatalogRoute('/music').musicId).toBeNull();

    const r = parseCatalogRoute(pathForTrack('tracksopenscoutopenscout-v3-beat-score'));
    expect(r.view).toBe('music');
    expect(r.musicId).toBe('tracksopenscoutopenscout-v3-beat-score');
  });

  test('existing treatment and asset routes still parse unchanged', () => {
    const t = parseCatalogRoute('/treatments/foo/review');
    expect(t.videoId).toBe('foo');
    expect(t.review).toBe(true);

    const f = parseCatalogRoute('/treatments/foo/frames/12');
    expect(f.frameIndex).toBe(12);

    const s = parseCatalogRoute('/treatments/proj/sources/src-1/frames/3');
    expect(s.projectId).toBe('proj');
    expect(s.videoId).toBe('src-1');
    expect(s.frameIndex).toBe(3);

    const a = parseCatalogRoute('/assets/bar/frames/4');
    expect(a.view).toBe('assets');
    expect(a.videoId).toBe('bar');
    expect(a.frameIndex).toBe(4);

    const home = parseCatalogRoute('/');
    expect(home.view).toBeNull();
    expect(home.collection).toBe('treatments');
  });

  test('an item resolves to its native view when it has one, else the run deep link', async () => {
    const { run } = await upsertRun({
      slug: 'links',
      title: 'Links',
      items: [
        { role: 'final', label: 'Registered', path: 'out/a.mp4', nativeHref: '/treatments/a' },
        { role: 'composition', label: 'Edit source', path: 'src/projects/x/edit.ts' },
      ],
    });

    const [registered, source] = run.items;
    expect(bestItemHref(run, registered)).toBe('/treatments/a');
    expect(bestItemHref(run, source)).toBe('/runs/links/items/edit-source');
  });

  test('links are host-independent until an origin is supplied', async () => {
    const { run } = await upsertRun({
      slug: 'links',
      title: 'Links',
      items: [{ role: 'final', label: 'Hero', path: 'out/a.mp4', preferred: true }],
    });

    const relative = linksForRun(run);
    expect(relative.run).toBe('/runs/links');
    expect(relative.items.hero.deepLink).toBe('/runs/links/items/hero');

    const deployed = linksForRun(run, 'https://preframe.example.com');
    expect(deployed.run).toBe('https://preframe.example.com/runs/links');
    expect(deployed.items.hero.deepLink).toBe('https://preframe.example.com/runs/links/items/hero');

    // Same persisted document, two hostnames — nothing stored depends on either.
    expect(run.items[0].ref.nativeHref ?? null).toBeNull();
  });

  test('absoluteUrl does not double or drop slashes', () => {
    expect(absoluteUrl('http://localhost:3100/', '/runs/x')).toBe('http://localhost:3100/runs/x');
    expect(absoluteUrl('http://localhost:3100', 'runs/x')).toBe('http://localhost:3100/runs/x');
  });
});

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------

describe('derived views', () => {
  test('the hero is the preferred final, falling back to the first final', async () => {
    const { run } = await upsertRun(SEED);
    expect(runHero(run)!.label).toBe('Edit A · Dark hero — 16:9');

    const { run: noPreference } = await upsertRun({
      slug: 'plain',
      title: 'Plain',
      items: [
        { role: 'source', label: 'Capture', path: 'public/demos/a.mp4' },
        { role: 'final', label: 'Only final', path: 'out/b.mp4' },
      ],
    });
    expect(runHero(noPreference)!.label).toBe('Only final');
  });

  test('summarizeRun counts artifacts and finals without shipping item bodies', async () => {
    const { run } = await upsertRun(SEED);
    const summary = summarizeRun(run);
    expect(summary.itemCount).toBe(3);
    expect(summary.finalCount).toBe(1);
    expect(summary.hero!.id).toBe('edit-a-dark-hero-16-9');
    expect(summary.status).toBe('review');
  });

  test('slugifyRunId collapses punctuation the way composition ids do', () => {
    expect(slugifyRunId('OpenScout V3 — Montage')).toBe('openscout-v3-montage');
    expect(slugifyRunId('  ///  ')).toBe('run');
  });
});
