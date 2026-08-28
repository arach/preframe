/**
 * Catalog URL routes (RESTful path resources).
 *
 * Collections:
 *   /treatments                 treatments list ( /  is an alias )
 *   /assets                     source assets
 *   /runs                       creative runs
 *   /queue /music /logos /frames /fx /prompts /settings
 *   /new /new-music
 *
 * Resources:
 *   /treatments/:id
 *   /treatments/:id/review
 *   /treatments/:id/frames/:n
 *   /treatments/:projectId/sources/:sourceId
 *   /treatments/:projectId/sources/:sourceId/frames/:n
 *   /assets/:id
 *   /assets/:id/frames/:n
 *   /runs/:slug
 *   /runs/:slug/items/:itemId
 *   /music/:trackId
 *
 * List query params only: filter, q, sort, category
 * Legacy ?video= / ?project= / ?frame= / ?review= are accepted and rewritten.
 */

export const CATALOG_VIEWS = [
  'treatments',
  'new',
  'new-music',
  'queue',
  'assets',
  'runs',
  'frames',
  'fx',
  'music',
  'logos',
  'prompts',
  'settings',
] as const;

export type CatalogView = (typeof CATALOG_VIEWS)[number];

/** Top-level collections that never take a resource id in the second segment. */
const LIST_ONLY = new Set<string>([
  'queue',
  'logos',
  'frames',
  'fx',
  'prompts',
  'settings',
  'new',
  'new-music',
]);

const KNOWN = new Set<string>(CATALOG_VIEWS);

export interface CatalogRoute {
  /** UI view key. `null` means treatments (home grid). */
  view: string | null;
  /** Resource collection for path building: treatments | assets | null */
  collection: 'treatments' | 'assets' | null;
  /** Primary video / asset id from the path */
  videoId: string | null;
  /** Project anchor when viewing a source under a treatment */
  projectId: string | null;
  frameIndex: number | null;
  review: boolean;
  /** Run slug from /runs/:slug */
  runSlug: string | null;
  /** Run member from /runs/:slug/items/:itemId */
  runItemId: string | null;
  /** Track id from /music/:trackId */
  musicId: string | null;
}

export const LIST_PARAM_KEYS = ['filter', 'q', 'sort', 'category'] as const;

export function isCatalogView(segment: string | null | undefined): segment is CatalogView {
  return !!segment && KNOWN.has(segment);
}

export function pathSegments(pathname: string): string[] {
  if (!pathname || pathname === '/') return [];
  return pathname.replace(/^\//, '').split('/').filter(Boolean);
}

function parseFrameIndex(seg: string | undefined): number | null {
  if (seg == null || seg === '') return null;
  const n = Number(seg);
  return Number.isFinite(n) ? n : null;
}

const EMPTY_ROUTE: CatalogRoute = {
  view: null,
  collection: null,
  videoId: null,
  projectId: null,
  frameIndex: null,
  review: false,
  runSlug: null,
  runItemId: null,
  musicId: null,
};

function route(partial: Partial<CatalogRoute>): CatalogRoute {
  return { ...EMPTY_ROUTE, ...partial };
}

/**
 * Parse a catalog pathname into route state.
 * Unknown first segments are treated as non-catalog (view null, no ids).
 */
export function parseCatalogRoute(pathname: string): CatalogRoute {
  // `/` and bare `/treatments` are the same surface: the treatments grid.
  const home = route({ collection: 'treatments' });

  const segs = pathSegments(pathname);
  if (segs.length === 0) return home;

  const head = segs[0];

  // /treatments[/:id[/review|/frames/:n|/sources/:sid[/frames/:n]]]
  if (head === 'treatments') {
    if (segs.length === 1) return home;
    const id = decodeURIComponent(segs[1]);

    if (segs[2] === 'review') {
      return route({ collection: 'treatments', videoId: id, projectId: id, review: true });
    }

    if (segs[2] === 'frames') {
      return route({
        collection: 'treatments',
        videoId: id,
        projectId: id,
        frameIndex: parseFrameIndex(segs[3]),
      });
    }

    if (segs[2] === 'sources' && segs[3]) {
      const sourceId = decodeURIComponent(segs[3]);
      return route({
        collection: 'treatments',
        videoId: sourceId,
        projectId: id,
        frameIndex: segs[4] === 'frames' ? parseFrameIndex(segs[5]) : null,
      });
    }

    return route({ collection: 'treatments', videoId: id, projectId: id });
  }

  // /assets[/:id[/frames/:n]]
  if (head === 'assets') {
    if (segs.length === 1) return route({ view: 'assets', collection: 'assets' });
    const id = decodeURIComponent(segs[1]);
    return route({
      view: 'assets',
      collection: 'assets',
      videoId: id,
      frameIndex: segs[2] === 'frames' ? parseFrameIndex(segs[3]) : null,
    });
  }

  // /runs[/:slug[/items/:itemId]]
  if (head === 'runs') {
    if (segs.length === 1) return route({ view: 'runs' });
    const slug = decodeURIComponent(segs[1]);
    return route({
      view: 'runs',
      runSlug: slug,
      runItemId: segs[2] === 'items' && segs[3] ? decodeURIComponent(segs[3]) : null,
    });
  }

  // /music[/:trackId]
  if (head === 'music') {
    return route({
      view: 'music',
      musicId: segs[1] ? decodeURIComponent(segs[1]) : null,
    });
  }

  // List-only studio surfaces
  if (LIST_ONLY.has(head)) return route({ view: head });

  // Unknown path — not a catalog route
  return EMPTY_ROUTE;
}

/** True when pathname is the catalog shell (/, known collection, or nested resource). */
export function isCatalogPathname(pathname: string): boolean {
  const segs = pathSegments(pathname);
  if (segs.length === 0) return true;
  const head = segs[0];
  return (
    head === 'treatments' ||
    head === 'assets' ||
    head === 'runs' ||
    head === 'music' ||
    LIST_ONLY.has(head) ||
    isCatalogView(head)
  );
}

/** Build the path for a run, or a deep link to one of its members. */
export function pathForRun(slug: string, itemId?: string | null): string {
  const base = `/runs/${encodeURIComponent(slug)}`;
  return itemId ? `${base}/items/${encodeURIComponent(itemId)}` : base;
}

/** Build the path for a music track resource. */
export function pathForTrack(trackId: string): string {
  return `/music/${encodeURIComponent(trackId)}`;
}

/** UI view → collection path (no resource id). */
export function pathForView(view: CatalogView | string | null): string {
  if (!view || view === 'treatments') return '/treatments';
  return `/${view}`;
}

export function viewFromPathname(pathname: string): string | null {
  return parseCatalogRoute(pathname).view;
}

export interface ResourcePathOpts {
  collection: 'treatments' | 'assets';
  id: string;
  /** When set and different from id, builds .../sources/:id under the project */
  projectId?: string | null;
  frameIndex?: number | null;
  review?: boolean;
}

/** Build a RESTful resource path (no query string). */
export function pathForResource(opts: ResourcePathOpts): string {
  const id = encodeURIComponent(opts.id);

  if (opts.collection === 'assets') {
    let path = `/assets/${id}`;
    if (opts.frameIndex != null && Number.isFinite(opts.frameIndex)) {
      path += `/frames/${opts.frameIndex}`;
    }
    return path;
  }

  // treatments
  if (opts.projectId && opts.projectId !== opts.id) {
    let path = `/treatments/${encodeURIComponent(opts.projectId)}/sources/${id}`;
    if (opts.frameIndex != null && Number.isFinite(opts.frameIndex)) {
      path += `/frames/${opts.frameIndex}`;
    }
    return path;
  }

  let base = `/treatments/${id}`;
  if (opts.review) return `${base}/review`;
  if (opts.frameIndex != null && Number.isFinite(opts.frameIndex)) {
    return `${base}/frames/${opts.frameIndex}`;
  }
  return base;
}

/**
 * Pick collection for opening a video from the current view + stage.
 */
export function collectionForVideo(
  currentView: string | null,
  stage?: string | null,
): 'treatments' | 'assets' {
  if (currentView === 'assets') return 'assets';
  if (currentView == null || currentView === 'treatments') {
    // Home / treatments: finals & wip stay here; pure sources go to assets
    if (!stage || stage === 'source') return 'assets';
    return 'treatments';
  }
  // From queue or other surfaces
  if (currentView === 'queue' || !stage || stage === 'source') return 'assets';
  return 'treatments';
}

/** @deprecated prefer pathForResource */
export function pathForVideoDetail(
  currentView: CatalogView | string | null,
  stage?: string | null,
): string {
  const collection = collectionForVideo(
    currentView === 'treatments' ? null : currentView,
    stage,
  );
  return pathForView(collection === 'assets' ? 'assets' : null);
}

export function copyListParams(
  from: URLSearchParams,
  to: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  for (const key of LIST_PARAM_KEYS) {
    const v = from.get(key);
    if (v) to.set(key, v);
  }
  return to;
}

/** Append list query params to a path. */
export function withListQuery(path: string, from: URLSearchParams): string {
  const params = copyListParams(from);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Legacy query keys that belong in the path now. */
export const LEGACY_DETAIL_KEYS = ['video', 'project', 'frame', 'review'] as const;

export function stripLegacyDetailParams(from: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(from.toString());
  for (const key of LEGACY_DETAIL_KEYS) params.delete(key);
  return params;
}
