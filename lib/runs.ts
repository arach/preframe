/**
 * Runs — a first-class container for one creative exercise.
 *
 * A Run is an *organizing layer* over objects that already exist in Preframe
 * (treatments, assets, music, logos, jobs) plus the repo files that produced
 * them (composition source, briefs, validation stills). It never duplicates
 * storage: every member keeps its native identity and native view, and the run
 * only records role, ordering, grouping and preference.
 *
 * This module is the shared contract — pure types plus URL builders, no Node
 * imports — so the editor UI, the API routes, and the seed scripts all agree on
 * identifiers and links. Persistence lives in `services/runs/store.ts`.
 */

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** Where a run sits in its lifecycle. Deliberately small. */
export const RUN_STATUSES = ['draft', 'active', 'review', 'delivered', 'archived'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

/**
 * What a member *is to this run* — not what kind of file it is. A single .mp4
 * can be a `final` in one run and a `source` in the next.
 */
export const RUN_ITEM_ROLES = [
  'final',
  'variant',
  'source',
  'composition',
  'score',
  'logo',
  'treatment',
  'validation',
  'document',
  'note',
  'reference',
] as const;
export type RunItemRole = (typeof RUN_ITEM_ROLES)[number];

/** How the member is opened / rendered. */
export const RUN_ITEM_KINDS = ['video', 'audio', 'image', 'code', 'doc', 'link'] as const;
export type RunItemKind = (typeof RUN_ITEM_KINDS)[number];

/** Groups are the dossier's sections. Ordered by `order`, then label. */
export interface RunGroup {
  id: string;
  label: string;
  description?: string;
  order: number;
}

/**
 * A pointer to the artifact in its native home. At most one of these is the
 * "primary" identity; the rest are convenience.
 */
export interface RunItemRef {
  /** Catalog video / audio / logo id when the artifact is a catalog object. */
  catalogId?: string | null;
  /** Repo-relative path — the canonical location of the deliverable on disk. */
  path?: string | null;
  /** Web-servable URL under the Preframe origin (e.g. `/out/foo.mp4`). */
  url?: string | null;
  /** Canonical native Preframe route for this object (e.g. `/treatments/foo`). */
  nativeHref?: string | null;
  /** Job id when the artifact was produced by a tracked job. */
  jobId?: string | null;
}

export interface RunItem {
  /** Stable within the run. Derived from `key`; safe in URLs. */
  id: string;
  /** Idempotency key supplied by the caller (or derived). Upserts match on it. */
  key: string;
  role: RunItemRole;
  kind: RunItemKind;
  label: string;
  description?: string;
  groupId?: string | null;
  order: number;
  /** Marks the preferred/hero member of its group. */
  preferred?: boolean;
  /**
   * `ready` when the artifact exists and is addressable; `pending` when it is
   * declared but not yet produced (e.g. a render still in flight).
   */
  state: 'ready' | 'pending' | 'missing';
  ref: RunItemRef;
  /** Free-form facts worth showing: format, aspect, durationSec, bpm, sha… */
  meta?: Record<string, unknown>;
  addedAt: string;
  updatedAt: string;
}

export interface Run {
  slug: string;
  title: string;
  description?: string;
  /** Long-form markdown brief. */
  brief?: string;
  status: RunStatus;
  tags?: string[];
  groups: RunGroup[];
  items: RunItem[];
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by list endpoints — no item bodies. */
export interface RunSummary {
  slug: string;
  title: string;
  description?: string;
  status: RunStatus;
  tags?: string[];
  itemCount: number;
  finalCount: number;
  /** Preferred hero item, when one is marked. */
  hero: RunItem | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/**
 * Slugify to the same alphabet the catalog uses for composition ids, so a run
 * slug and a composition id can safely be the same string.
 */
export function slugifyRunId(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'run'
  );
}

/** Item ids are slugs too — they appear in deep-link paths. */
export function slugifyItemId(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[\s_/.]+/g, '-')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

/**
 * Derive an idempotency key for an item when the caller did not supply one.
 * Keyed on role + the most specific identity available, so re-attaching the
 * same artifact in the same role updates rather than duplicates.
 */
export function deriveItemKey(role: RunItemRole, ref: RunItemRef, label?: string): string {
  const identity = ref.catalogId || ref.path || ref.url || ref.nativeHref || label || 'item';
  return `${role}:${identity}`;
}

// ---------------------------------------------------------------------------
// URL contract
//
// Canonical run URL:      /runs/<slug>
// Artifact deep link:     /runs/<slug>/items/<itemId>
//
// Paths are host-independent on purpose: the same route works on
// http://localhost:3100 today and a deployed Preframe later. Absolute URLs are
// only ever produced by joining an explicit origin.
// ---------------------------------------------------------------------------

export const RUNS_BASE_PATH = '/runs';

export function runsPath(): string {
  return RUNS_BASE_PATH;
}

export function runPath(slug: string): string {
  return `${RUNS_BASE_PATH}/${encodeURIComponent(slug)}`;
}

export function runItemPath(slug: string, itemId: string): string {
  return `${runPath(slug)}/items/${encodeURIComponent(itemId)}`;
}

/**
 * Read-only stream for a run member that lives outside `public/`.
 *
 * The canonical deliverables sit in `out/`, which Next does not serve — and
 * copying them into `public/` just to look at them is exactly the duplication a
 * run is supposed to avoid. This route serves a file *because the run says it
 * belongs to the run*: membership is the allowlist.
 */
export function runArtifactPath(slug: string, itemId: string): string {
  return `/api/runs/${encodeURIComponent(slug)}/artifacts/${encodeURIComponent(itemId)}`;
}

/** Playable/viewable source for an item, or null when there is nothing to show. */
export function artifactSrc(run: Pick<Run, 'slug'>, item: RunItem): string | null {
  if (item.state !== 'ready') return null;
  if (item.ref.url) return item.ref.url;
  if (item.ref.path) return runArtifactPath(run.slug, item.id);
  return null;
}

/** Join a path onto an origin without doubling or dropping slashes. */
export function absoluteUrl(origin: string, path: string): string {
  const base = origin.replace(/\/+$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${base}${rel}`;
}

/**
 * The single most useful link for an item:
 * its native Preframe view when it has one, else the run deep link.
 */
export function bestItemHref(run: Pick<Run, 'slug'>, item: RunItem): string {
  return item.ref.nativeHref || runItemPath(run.slug, item.id);
}

// ---------------------------------------------------------------------------
// Ordering / grouping helpers (pure — shared by UI and API responses)
// ---------------------------------------------------------------------------

export function sortGroups(groups: RunGroup[]): RunGroup[] {
  return [...groups].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

export function sortItems(items: RunItem[]): RunItem[] {
  return [...items].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

export function itemsInGroup(run: Run, groupId: string | null): RunItem[] {
  return sortItems(run.items.filter(i => (i.groupId ?? null) === groupId));
}

/** The run's hero: the preferred `final`, else the first `final`, else null. */
export function runHero(run: Run): RunItem | null {
  const finals = sortItems(run.items.filter(i => i.role === 'final'));
  return finals.find(i => i.preferred) ?? finals[0] ?? null;
}

export function summarizeRun(run: Run): RunSummary {
  return {
    slug: run.slug,
    title: run.title,
    description: run.description,
    status: run.status,
    tags: run.tags,
    itemCount: run.items.length,
    finalCount: run.items.filter(i => i.role === 'final').length,
    hero: runHero(run),
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

export function findItem(run: Run, itemId: string): RunItem | null {
  return run.items.find(i => i.id === itemId) ?? null;
}
