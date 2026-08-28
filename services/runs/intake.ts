/**
 * Agent-facing run intake.
 *
 * The same ergonomics as `/api/agents/jobs`: an agent POSTs local paths and a
 * stable key, and gets back URLs it can paste at the end of a turn. The
 * difference is that a run *references* artifacts instead of ingesting them —
 * nothing is copied, nothing is renamed, and the catalog is not rebuilt. That
 * makes the endpoint safe to call while a render is still writing files.
 */

import {
  absoluteUrl,
  bestItemHref,
  runHero,
  runItemPath,
  runPath,
  runsPath,
  type Run,
  type RunItem,
} from '@/lib/runs';
import { resolveArtifact } from './resolve';
import { RunStoreError, upsertRun, type RunItemInput, type UpsertRunInput } from './store';

export { RunStoreError };

export function isRunStoreError(err: unknown): err is RunStoreError {
  return err instanceof RunStoreError;
}

export interface RunIntakeResult {
  ok: true;
  created: boolean;
  run: Run;
  createdItemIds: string[];
  updatedItemIds: string[];
  removedItemIds: string[];
  links: RunLinks;
  warnings: string[];
}

export interface RunLinks {
  /** Canonical run URL — the one to return at the end of a turn. */
  run: string;
  runs: string;
  api: string;
  /** Preferred final, when the run has one. */
  hero: string | null;
  /** Every item, keyed by item id: its best link plus the run deep link. */
  items: Record<string, { label: string; role: string; href: string; deepLink: string; state: string }>;
}

/**
 * Build the link block for a run. `origin` is supplied by the caller (the
 * request's own origin in the API, an explicit flag in scripts) so nothing
 * persisted ever hard-codes a hostname.
 */
export function linksForRun(run: Run, origin?: string): RunLinks {
  const abs = (path: string) => (origin ? absoluteUrl(origin, path) : path);
  const hero = runHero(run);

  const items: RunLinks['items'] = {};
  for (const item of run.items) {
    items[item.id] = {
      label: item.label,
      role: item.role,
      href: abs(bestItemHref(run, item)),
      deepLink: abs(runItemPath(run.slug, item.id)),
      state: item.state,
    };
  }

  return {
    run: abs(runPath(run.slug)),
    runs: abs(runsPath()),
    api: abs(`/api/runs/${encodeURIComponent(run.slug)}`),
    hero: hero ? abs(bestItemHref(run, hero)) : null,
    items,
  };
}

export interface AgentRunRequest extends Omit<UpsertRunInput, 'items'> {
  /** Alias for `slug`, mirroring the jobs endpoint's `compositionId`. */
  compositionId?: string;
  name?: string;
  items?: RunItemInput[];
  /** Alias — reads better for "attach these files to the run". */
  attach?: RunItemInput[];
}

export async function submitAgentRun(
  body: AgentRunRequest,
  origin?: string,
): Promise<RunIntakeResult> {
  const slug = body.slug ?? body.compositionId;
  const title = body.title ?? body.name;
  if (!slug && !title) {
    throw new RunStoreError('A run needs a slug (or compositionId) or a title');
  }

  const incoming = [...(body.items ?? []), ...(body.attach ?? [])];
  const warnings: string[] = [];
  const resolved: RunItemInput[] = [];

  for (const raw of incoming) {
    if (!raw.label) throw new RunStoreError('Every run item needs a label');
    const artifact = await resolveArtifact({
      path: raw.path ?? raw.ref?.path,
      url: raw.url ?? raw.ref?.url,
      catalogId: raw.catalogId ?? raw.ref?.catalogId,
      nativeHref: raw.nativeHref ?? raw.ref?.nativeHref,
      jobId: raw.jobId ?? raw.ref?.jobId,
    });

    // An explicit state from the caller wins — it may know a render is queued.
    const state = raw.state ?? artifact.state;
    if (state === 'pending') {
      warnings.push(`"${raw.label}" is not on disk yet — recorded as pending`);
    }

    resolved.push({
      ...raw,
      state,
      // The resolved ref is authoritative — clear the caller's flat shorthand so
      // an unresolved absolute path can't shadow it in the store.
      ref: artifact.ref,
      path: undefined,
      url: undefined,
      catalogId: undefined,
      nativeHref: undefined,
      jobId: undefined,
      meta:
        artifact.sizeBytes != null
          ? { sizeBytes: artifact.sizeBytes, ...(raw.meta ?? {}) }
          : raw.meta,
    });
  }

  const result = await upsertRun({
    slug,
    title,
    description: body.description,
    brief: body.brief,
    status: body.status,
    tags: body.tags,
    groups: body.groups,
    items: resolved,
    itemsMode: body.itemsMode,
  });

  return {
    ok: true,
    created: result.created,
    run: result.run,
    createdItemIds: result.createdItemIds,
    updatedItemIds: result.updatedItemIds,
    removedItemIds: result.removedItemIds,
    links: linksForRun(result.run, origin),
    warnings,
  };
}

/** Compact, paste-ready block for the end of an agent turn. */
export function formatRunHandoff(run: Run, origin?: string): string {
  const links = linksForRun(run, origin);
  const lines = [`Run: ${links.run}`];
  const shown = new Set<string>();

  const push = (item: RunItem) => {
    if (shown.has(item.id)) return;
    shown.add(item.id);
    lines.push(`${item.label}: ${links.items[item.id].href}`);
  };

  run.items.filter(i => i.role === 'final' && i.preferred).forEach(push);
  run.items.filter(i => i.role === 'score' && i.preferred).forEach(push);
  return lines.join('\n');
}
