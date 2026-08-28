/**
 * Run persistence — one JSON document per run under `.data/runs/`.
 *
 * A run is a small, hand-inspectable document that *points at* existing
 * artifacts, so a flat file is the right size of machine: no schema migration,
 * no second source of truth for media, and the whole run is diffable.
 *
 * Writes are atomic (temp file + rename) because the editor polls this
 * directory while agents write to it.
 *
 * Set `PREFRAME_RUNS_DIR` to relocate the store (tests do this).
 */

import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  deriveItemKey,
  slugifyItemId,
  slugifyRunId,
  sortGroups,
  sortItems,
  type Run,
  type RunGroup,
  type RunItem,
  type RunItemKind,
  type RunItemRef,
  type RunItemRole,
  type RunStatus,
} from '@/lib/runs';

export function runsDir(): string {
  return process.env.PREFRAME_RUNS_DIR || join(process.cwd(), '.data', 'runs');
}

function runFile(slug: string): string {
  return join(runsDir(), `${slug}.json`);
}

export class RunStoreError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getRun(slug: string): Promise<Run | null> {
  const id = slugifyRunId(slug);
  try {
    const raw = await readFile(runFile(id), 'utf-8');
    return normalizeRun(JSON.parse(raw) as Run);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function listRuns(): Promise<Run[]> {
  let entries: string[];
  try {
    entries = await readdir(runsDir());
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }

  const runs: Run[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const run = await getRun(entry.slice(0, -'.json'.length));
    if (run) runs.push(run);
  }
  // Most recently touched first — matches how the rest of the catalog sorts.
  return runs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export interface RunItemInput {
  /** Idempotency key. Derived from role + identity when omitted. */
  key?: string;
  role: RunItemRole;
  kind?: RunItemKind;
  label: string;
  description?: string;
  group?: string;
  groupId?: string | null;
  order?: number;
  preferred?: boolean;
  state?: RunItem['state'];
  ref?: RunItemRef;
  catalogId?: string | null;
  path?: string | null;
  url?: string | null;
  nativeHref?: string | null;
  jobId?: string | null;
  meta?: Record<string, unknown>;
}

export interface RunGroupInput {
  id?: string;
  label: string;
  description?: string;
  order?: number;
}

export interface UpsertRunInput {
  slug?: string;
  title?: string;
  description?: string;
  brief?: string;
  status?: RunStatus;
  tags?: string[];
  groups?: RunGroupInput[];
  items?: RunItemInput[];
  /**
   * `merge` (default) upserts the supplied items by key and leaves the rest
   * alone. `replace` makes the supplied list the complete membership — items
   * that survive keep their ids, so deep links stay valid.
   */
  itemsMode?: 'merge' | 'replace';
}

export interface UpsertRunResult {
  run: Run;
  created: boolean;
  createdItemIds: string[];
  updatedItemIds: string[];
  removedItemIds: string[];
}

export async function upsertRun(input: UpsertRunInput): Promise<UpsertRunResult> {
  const slugSource = input.slug ?? input.title;
  if (!slugSource) throw new RunStoreError('A run needs a slug or a title');
  const slug = slugifyRunId(slugSource);

  const now = new Date().toISOString();
  const existing = await getRun(slug);
  const created = existing == null;

  if (created && !input.title) {
    throw new RunStoreError('A new run needs a title');
  }

  const base: Run = existing ?? {
    slug,
    title: input.title!,
    status: 'draft',
    groups: [],
    items: [],
    createdAt: now,
    updatedAt: now,
  };

  const groups = mergeGroups(base.groups, input.groups ?? []);
  const groupIdByLabel = new Map(groups.map(g => [g.label.toLowerCase(), g.id]));

  const byKey = new Map(base.items.map(i => [i.key, i]));
  const usedIds = new Set(base.items.map(i => i.id));
  const createdItemIds: string[] = [];
  const updatedItemIds: string[] = [];
  const touchedKeys = new Set<string>();

  let nextOrder = base.items.reduce((max, i) => Math.max(max, i.order), -1) + 1;
  /** Buckets where this call explicitly claimed a preferred item. */
  const claimedPreferred = new Map<string, string>();

  for (const raw of input.items ?? []) {
    const item = normalizeItemInput(raw, groupIdByLabel);
    const key = raw.key ?? deriveItemKey(item.role, item.ref, item.label);
    touchedKeys.add(key);

    const prior = byKey.get(key);
    if (prior) {
      const merged: RunItem = {
        ...prior,
        role: item.role,
        kind: item.kind,
        label: item.label,
        description: item.description ?? prior.description,
        groupId: item.groupId !== undefined ? item.groupId : prior.groupId,
        order: raw.order ?? prior.order,
        preferred: raw.preferred ?? prior.preferred,
        state: item.state,
        ref: { ...prior.ref, ...pruneUndefined(item.ref) },
        meta: item.meta ? { ...(prior.meta ?? {}), ...item.meta } : prior.meta,
        updatedAt: now,
      };
      byKey.set(key, merged);
      updatedItemIds.push(merged.id);
      if (raw.preferred) claimedPreferred.set(preferenceBucket(merged), key);
      continue;
    }

    const id = uniqueItemId(item.label, key, usedIds);
    usedIds.add(id);
    const next: RunItem = {
      id,
      key,
      role: item.role,
      kind: item.kind,
      label: item.label,
      description: item.description,
      groupId: item.groupId ?? null,
      order: raw.order ?? nextOrder++,
      preferred: raw.preferred,
      state: item.state,
      ref: pruneUndefined(item.ref),
      meta: item.meta,
      addedAt: now,
      updatedAt: now,
    };
    byKey.set(key, next);
    createdItemIds.push(id);
    if (raw.preferred) claimedPreferred.set(preferenceBucket(next), key);
  }

  let items = [...byKey.values()];
  let removedItemIds: string[] = [];
  if (input.itemsMode === 'replace' && input.items) {
    removedItemIds = items.filter(i => !touchedKeys.has(i.key)).map(i => i.id);
    items = items.filter(i => touchedKeys.has(i.key));
  }

  items = sortItems(demoteUnclaimedPreferred(items, claimedPreferred));

  const run: Run = {
    ...base,
    slug,
    title: input.title ?? base.title,
    description: input.description ?? base.description,
    brief: input.brief ?? base.brief,
    status: input.status ?? base.status,
    tags: input.tags ?? base.tags,
    groups,
    items,
    createdAt: base.createdAt,
    updatedAt: now,
  };

  await writeRun(run);
  return { run, created, createdItemIds, updatedItemIds, removedItemIds };
}

export async function writeRun(run: Run): Promise<void> {
  const dir = runsDir();
  await mkdir(dir, { recursive: true });
  const target = runFile(run.slug);
  const tmp = `${target}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(tmp, `${JSON.stringify(run, null, 2)}\n`, 'utf-8');
  await rename(tmp, target);
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeRun(run: Run): Run {
  return {
    ...run,
    groups: sortGroups(run.groups ?? []),
    items: sortItems(run.items ?? []),
  };
}

function normalizeItemInput(
  raw: RunItemInput,
  groupIdByLabel: Map<string, string>,
): {
  role: RunItemRole;
  kind: RunItemKind;
  label: string;
  description?: string;
  groupId: string | null | undefined;
  state: RunItem['state'];
  ref: RunItemRef;
  meta?: Record<string, unknown>;
} {
  if (!raw.label) throw new RunStoreError('Every run item needs a label');
  if (!raw.role) throw new RunStoreError(`Run item "${raw.label}" needs a role`);

  const ref: RunItemRef = {
    ...(raw.ref ?? {}),
    ...pruneUndefined({
      catalogId: raw.catalogId,
      path: raw.path,
      url: raw.url,
      nativeHref: raw.nativeHref,
      jobId: raw.jobId,
    }),
  };

  if (!ref.catalogId && !ref.path && !ref.url && !ref.nativeHref) {
    throw new RunStoreError(
      `Run item "${raw.label}" needs at least one of catalogId, path, url, nativeHref`,
    );
  }

  let groupId: string | null | undefined;
  if (raw.groupId !== undefined) groupId = raw.groupId;
  else if (raw.group) groupId = groupIdByLabel.get(raw.group.toLowerCase()) ?? slugifyRunId(raw.group);

  return {
    role: raw.role,
    kind: raw.kind ?? inferKind(ref),
    label: raw.label,
    description: raw.description,
    groupId,
    state: raw.state ?? 'ready',
    ref,
    meta: raw.meta,
  };
}

const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|gif)$/i;
const AUDIO_EXT = /\.(mp3|wav|aac|m4a|flac|ogg)$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|svg)$/i;
const CODE_EXT = /\.(tsx?|jsx?|mjs|cjs|py|sh|css|json)$/i;
const DOC_EXT = /\.(md|mdx|txt)$/i;

function inferKind(ref: RunItemRef): RunItemKind {
  const probe = ref.path || ref.url || '';
  if (VIDEO_EXT.test(probe)) return 'video';
  if (AUDIO_EXT.test(probe)) return 'audio';
  if (IMAGE_EXT.test(probe)) return 'image';
  if (DOC_EXT.test(probe)) return 'doc';
  if (CODE_EXT.test(probe)) return 'code';
  return 'link';
}

function mergeGroups(existing: RunGroup[], incoming: RunGroupInput[]): RunGroup[] {
  const byId = new Map(existing.map(g => [g.id, g]));
  let nextOrder = existing.reduce((max, g) => Math.max(max, g.order), -1) + 1;

  for (const raw of incoming) {
    const id = slugifyRunId(raw.id ?? raw.label);
    const prior = byId.get(id);
    byId.set(id, {
      id,
      label: raw.label,
      description: raw.description ?? prior?.description,
      order: raw.order ?? prior?.order ?? nextOrder++,
    });
  }
  return sortGroups([...byId.values()]);
}

/** Preference is scoped to (group, role): one hero final, one hero score, … */
function preferenceBucket(item: Pick<RunItem, 'groupId' | 'role'>): string {
  return `${item.groupId ?? ''}::${item.role}`;
}

/**
 * "Preferred" means *the* one to show, so a bucket holds at most one. When a
 * call explicitly marks a new hero, the previous hero in that bucket is
 * demoted; buckets the call didn't touch keep whatever they had.
 */
function demoteUnclaimedPreferred(
  items: RunItem[],
  claimed: Map<string, string>,
): RunItem[] {
  if (claimed.size === 0) return items;
  return items.map(item => {
    if (!item.preferred) return item;
    const winner = claimed.get(preferenceBucket(item));
    if (!winner || winner === item.key) return item;
    return { ...item, preferred: false };
  });
}

function uniqueItemId(label: string, key: string, used: Set<string>): string {
  const base = slugifyItemId(label) || slugifyItemId(key);
  if (!used.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new RunStoreError(`Could not allocate an item id for "${label}"`, 500);
}

function pruneUndefined<T extends object>(obj: T): T {
  const out = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}
