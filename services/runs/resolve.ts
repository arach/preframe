/**
 * Turn an agent-supplied local path into a run item that knows where its
 * artifact actually lives.
 *
 * Agents hand us absolute paths (`/Users/art/dev/preframe/out/openscout-v3/…`)
 * or repo-relative ones (`src/projects/openscout-montage/edit-a.ts`). A run
 * never copies those files — it records:
 *
 *   path       repo-relative, the canonical location on disk
 *   url        web-servable URL, when the file sits under public/
 *   catalogId  the catalog object, when one already indexes that file
 *   nativeHref the existing Preframe route for that object
 *
 * Files that don't exist yet are not an error: a render still in flight is
 * recorded as `pending`, and re-running the same upsert once it lands upgrades
 * it in place without changing its id or its deep link.
 */

import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type { RunItemRef } from '@/lib/runs';
import type { CatalogData, Video } from '@/lib/types';

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');
const CATALOG_JSON = join(PUBLIC, 'catalog-data.json');

export interface ResolvedArtifact {
  ref: RunItemRef;
  state: 'ready' | 'pending';
  sizeBytes?: number;
}

/** Repo-relative path, or null when the input escapes the project root. */
export function toRepoRelative(input: string): string | null {
  const abs = isAbsolute(input) ? resolve(input) : resolve(ROOT, input);
  const rel = relative(ROOT, abs);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
  return rel;
}

/** `/out/foo.mp4` for `public/out/foo.mp4`; null for anything outside public/. */
export function toPublicUrl(repoRelative: string): string | null {
  const rel = relative(PUBLIC, resolve(ROOT, repoRelative));
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
  return `/${rel.split('\\').join('/')}`;
}

// ---------------------------------------------------------------------------
// Catalog lookup
// ---------------------------------------------------------------------------

let catalogCache: { mtimeMs: number; data: CatalogData } | null = null;

/** Read catalog-data.json, cached on mtime — the API is called in tight loops. */
export async function readCatalog(): Promise<CatalogData | null> {
  try {
    const info = await stat(CATALOG_JSON);
    if (catalogCache && catalogCache.mtimeMs === info.mtimeMs) return catalogCache.data;
    const data = JSON.parse(await readFile(CATALOG_JSON, 'utf-8')) as CatalogData;
    catalogCache = { mtimeMs: info.mtimeMs, data };
    return data;
  } catch {
    return null;
  }
}

/**
 * The native Preframe route for a catalog video. Mirrors `collectionForVideo`
 * in catalog/lib/routes.ts: sources live under /assets, everything else under
 * /treatments.
 */
export function nativeHrefForVideo(video: Video): string {
  const collection = !video.stage || video.stage === 'source' ? 'assets' : 'treatments';
  return `/${collection}/${encodeURIComponent(video.id)}`;
}

export function nativeHrefForAudio(audioId: string): string {
  return `/music/${encodeURIComponent(audioId)}`;
}

/** Public paths the catalog records, normalised to a leading-slash URL. */
function videoPublicUrls(video: Video): string[] {
  const out: string[] = [];
  for (const candidate of [video.videoUrl, video.demosPath]) {
    if (!candidate) continue;
    out.push(candidate.startsWith('/') ? candidate : `/${candidate}`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export async function resolveArtifact(input: {
  path?: string | null;
  url?: string | null;
  catalogId?: string | null;
  nativeHref?: string | null;
  jobId?: string | null;
}): Promise<ResolvedArtifact> {
  const ref: RunItemRef = {};
  if (input.jobId) ref.jobId = input.jobId;

  let repoRelative: string | null = null;

  if (input.path) {
    repoRelative = toRepoRelative(input.path);
    if (!repoRelative) {
      // Outside the checkout — keep the caller's string so the dossier can
      // still name it, but it is not addressable from the editor.
      ref.path = input.path;
    } else {
      ref.path = repoRelative;
    }
  }

  let url = input.url ?? null;
  if (!url && repoRelative) url = toPublicUrl(repoRelative);
  if (url) ref.url = url;

  // Does the catalog already index this artifact?
  const catalog = await readCatalog();
  let catalogId = input.catalogId ?? null;
  let nativeHref = input.nativeHref ?? null;

  if (catalog) {
    if (catalogId) {
      const video = catalog.videos.find(v => v.id === catalogId);
      if (video) nativeHref ??= nativeHrefForVideo(video);
      else if (catalog.audioAssets?.some(a => a.id === catalogId)) {
        nativeHref ??= nativeHrefForAudio(catalogId);
      }
    } else if (url) {
      const video = catalog.videos.find(v => videoPublicUrls(v).includes(url));
      if (video) {
        catalogId = video.id;
        nativeHref ??= nativeHrefForVideo(video);
      } else {
        const bare = url.replace(/^\//, '');
        const audio = catalog.audioAssets?.find(a => a.path === bare || a.path === url);
        if (audio) {
          catalogId = audio.id;
          nativeHref ??= nativeHrefForAudio(audio.id);
        }
      }
    }
  }

  if (catalogId) ref.catalogId = catalogId;
  if (nativeHref) ref.nativeHref = nativeHref;

  // Existence — an absent file is `pending`, not a failure.
  let state: ResolvedArtifact['state'] = 'ready';
  let sizeBytes: number | undefined;
  if (repoRelative) {
    try {
      const info = await stat(join(ROOT, repoRelative));
      sizeBytes = info.size;
    } catch {
      state = 'pending';
    }
  } else if (!ref.url && !ref.catalogId && !ref.nativeHref) {
    state = 'pending';
  }

  return { ref, state, sizeBytes };
}
