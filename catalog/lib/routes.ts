/**
 * Catalog URL routes (RESTful path resources).
 *
 * Collections:
 *   /treatments                 treatments list ( /  is an alias )
 *   /assets                     source assets
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
  'music',
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

/**
 * Parse a catalog pathname into route state.
 * Unknown first segments are treated as non-catalog (view null, no ids).
 */
export function parseCatalogRoute(pathname: string): CatalogRoute {
  const empty: CatalogRoute = {
    view: null,
    collection: 'treatments',
    videoId: null,
    projectId: null,
    frameIndex: null,
    review: false,
  };

  const segs = pathSegments(pathname);
  if (segs.length === 0) {
    return empty;
  }

  const head = segs[0];

  // /treatments[/:id[/review|/frames/:n|/sources/:sid[/frames/:n]]]
  if (head === 'treatments') {
    if (segs.length === 1) return empty;
    const id = decodeURIComponent(segs[1]);

    if (segs.length === 2) {
      return {
        view: null,
        collection: 'treatments',
        videoId: id,
        projectId: id,
        frameIndex: null,
        review: false,
      };
    }

    if (segs[2] === 'review') {
      return {
        view: null,
        collection: 'treatments',
        videoId: id,
        projectId: id,
        frameIndex: null,
        review: true,
      };
    }

    if (segs[2] === 'frames') {
      return {
        view: null,
        collection: 'treatments',
        videoId: id,
        projectId: id,
        frameIndex: parseFrameIndex(segs[3]),
        review: false,
      };
    }

    if (segs[2] === 'sources' && segs[3]) {
      const sourceId = decodeURIComponent(segs[3]);
      let frameIndex: number | null = null;
      if (segs[4] === 'frames') frameIndex = parseFrameIndex(segs[5]);
      return {
        view: null,
        collection: 'treatments',
        videoId: sourceId,
        projectId: id,
        frameIndex,
        review: false,
      };
    }

    return {
      view: null,
      collection: 'treatments',
      videoId: id,
      projectId: id,
      frameIndex: null,
      review: false,
    };
  }

  // /assets[/:id[/frames/:n]]
  if (head === 'assets') {
    if (segs.length === 1) {
      return {
        view: 'assets',
        collection: 'assets',
        videoId: null,
        projectId: null,
        frameIndex: null,
        review: false,
      };
    }
    const id = decodeURIComponent(segs[1]);
    let frameIndex: number | null = null;
    if (segs[2] === 'frames') frameIndex = parseFrameIndex(segs[3]);
    return {
      view: 'assets',
      collection: 'assets',
      videoId: id,
      projectId: null,
      frameIndex,
      review: false,
    };
  }

  // List-only studio surfaces
  if (LIST_ONLY.has(head)) {
    return {
      view: head,
      collection: null,
      videoId: null,
      projectId: null,
      frameIndex: null,
      review: false,
    };
  }

  // Unknown path — not a catalog route
  return {
    view: null,
    collection: null,
    videoId: null,
    projectId: null,
    frameIndex: null,
    review: false,
  };
}

/** True when pathname is the catalog shell (/, known collection, or nested resource). */
export function isCatalogPathname(pathname: string): boolean {
  const segs = pathSegments(pathname);
  if (segs.length === 0) return true;
  const head = segs[0];
  return head === 'treatments' || head === 'assets' || LIST_ONLY.has(head) || isCatalogView(head);
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
