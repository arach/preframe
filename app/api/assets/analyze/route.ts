import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { createJob, ensureJobsRuntime } from '@/services/jobs/init';
import type { Video } from '@/lib/types';

export const runtime = 'nodejs';

type FilterMode = 'needs-analysis' | 'all';

const DEFAULT_ANALYZE_LIMIT = 20;
const MAX_ANALYZE_LIMIT = 100;

interface AnalyzeBody {
  ids?: string[];
  filter?: FilterMode;
  since?: string;
  app?: string;
  limit?: number;
  transcribe?: boolean;
  force?: boolean;
}

function loadCatalogVideos(): Video[] {
  const path = join(process.cwd(), 'public', 'catalog-data.json');
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(data.videos) ? data.videos : [];
  } catch {
    return [];
  }
}

function isAnalyzed(v: Video): boolean {
  return v.analysisStatus === 'complete' || v.analysisStatus === 'analyzed';
}

function needsAnalysis(v: Video): boolean {
  return !v.analysisStatus || v.analysisStatus === 'none' || v.analysisStatus === 'frames-only';
}

function parseSince(value: string): Date | null {
  const rel = value.match(/^(\d+)([dhm])$/i);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = rel[2].toLowerCase();
    const d = new Date();
    if (unit === 'd') d.setDate(d.getDate() - n);
    else if (unit === 'h') d.setHours(d.getHours() - n);
    else if (unit === 'm') d.setMinutes(d.getMinutes() - n);
    return d;
  }
  const abs = new Date(value);
  return Number.isNaN(abs.getTime()) ? null : abs;
}

/** Resolve a clip path under public/ with containment + existence checks. */
function clipPublicPath(v: Video): string | null {
  const publicDir = resolve(process.cwd(), 'public');

  const underPublic = (rel: string): string | null => {
    const normalized = rel.replace(/^\/+/, '');
    const abs = resolve(publicDir, normalized);
    const r = relative(publicDir, abs);
    if (!r || r.startsWith('..') || r.startsWith(sep) || r.startsWith('/')) return null;
    if (!existsSync(abs)) return null;
    return r.replace(/\\/g, '/');
  };

  if (v.demosPath) {
    const hit = underPublic(v.demosPath);
    if (hit) return hit;
  }
  if (v.filename) {
    const demos = underPublic(`demos/${v.filename}`);
    if (demos) return demos;
    const inbox = underPublic(`inbox/${v.filename}`);
    if (inbox) return inbox;
  }
  return null;
}

function slugCompositionId(video: Video): string {
  const base = video.id || video.filename || `asset-${Date.now()}`;
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9\-\u4e00-\u9fff]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return slug || `asset-${Date.now().toString(36)}`;
}

function selectVideos(body: AnalyzeBody): { videos: Video[]; limitedFrom: number } {
  let list = loadCatalogVideos().filter(v => v.stage === 'source' || !v.stage);

  if (body.ids?.length) {
    const set = new Set(body.ids);
    list = list.filter(v => set.has(v.id) || set.has(v.filename));
  } else {
    // force re-analysis includes already-analyzed assets
    const filter = body.force ? 'all' : (body.filter ?? 'needs-analysis');
    if (filter === 'needs-analysis') list = list.filter(needsAnalysis);
  }

  if (body.app) {
    const app = body.app.toLowerCase();
    list = list.filter(v => (v.app || '').toLowerCase() === app);
  }

  if (body.since) {
    const cutoff = parseSince(body.since);
    if (cutoff) {
      // Missing timestamps are treated as outside the window (not "always match").
      list = list.filter(v => {
        if (!v.capturedAt) return false;
        return new Date(v.capturedAt).getTime() >= cutoff.getTime();
      });
    }
  }

  list.sort(
    (a, b) =>
      new Date(b.capturedAt ?? 0).getTime() - new Date(a.capturedAt ?? 0).getTime(),
  );

  const rawLimit =
    typeof body.limit === 'number' && body.limit > 0
      ? body.limit
      : DEFAULT_ANALYZE_LIMIT;
  const limit = Math.min(rawLimit, MAX_ANALYZE_LIMIT);
  const limitedFrom = list.length;
  if (list.length > limit) list = list.slice(0, limit);
  return { videos: list, limitedFrom };
}

/**
 * POST /api/assets/analyze
 * Enqueue one first-class `analyze` job per selected catalog source clip.
 */
export async function POST(req: Request) {
  ensureJobsRuntime();

  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { videos: selected, limitedFrom } = selectVideos(body);
  if (selected.length === 0) {
    return NextResponse.json({
      ok: true,
      enqueued: 0,
      jobIds: [],
      message: 'No matching source assets',
    });
  }

  const jobIds: string[] = [];
  const jobs: Array<Record<string, unknown>> = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const video of selected) {
    const clip = clipPublicPath(video);
    if (!clip) {
      skipped.push({ id: video.id, reason: 'file not found under public/' });
      continue;
    }

    const compositionId = slugCompositionId(video);
    const result = await createJob(compositionId, {
      kind: 'analyze',
      prompt: `Analyze source asset ${video.id} (storyboard + VLM${body.transcribe ? ' + transcript' : ''})`,
      inputs: { clips: [clip] },
      params: {
        name: video.filename || video.id,
        videoId: video.id,
        transcribe: Boolean(body.transcribe),
        force: Boolean(body.force),
      },
      // Active-job dedup is handled by compositionId+kind. Do not use a
      // permanent idempotency key here: failed/stale analysis jobs must be
      // enqueueable again while the asset still needs analysis.
      idempotencyKey: body.force ? `analyze:${video.id}:${Date.now()}` : undefined,
    });

    if ('error' in result && result.error) {
      skipped.push({ id: video.id, reason: String(result.error) });
      continue;
    }

    const data = (result as { data?: { jobId: string; compositionId: string; status: string } }).data;
    if (data?.jobId) {
      jobIds.push(data.jobId);
      jobs.push({
        videoId: video.id,
        compositionId: data.compositionId,
        jobId: data.jobId,
        status: data.status,
        clip,
      });
    }
  }

  const limitSkipped = Math.max(0, limitedFrom - selected.length);

  return NextResponse.json({
    ok: jobIds.length > 0,
    enqueued: jobIds.length,
    jobIds,
    jobs,
    skipped: skipped.length ? skipped : undefined,
    limit: {
      applied: Math.min(
        typeof body.limit === 'number' && body.limit > 0
          ? body.limit
          : DEFAULT_ANALYZE_LIMIT,
        MAX_ANALYZE_LIMIT,
      ),
      max: MAX_ANALYZE_LIMIT,
      skipped: limitSkipped || undefined,
    },
    queue: '/queue',
    analyzedAlready: selected.filter(isAnalyzed).length,
  }, { status: jobIds.length > 0 ? 201 : 200 });
}
