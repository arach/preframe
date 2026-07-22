/**
 * POST /api/catalog/import
 *
 * Run capture ingest using saved settings (body may override since/limit/analyze/dryRun
 * and kind — but not folder path; folder always comes from saved settings).
 * Same outcome as `bun run process --from talkie|folder …`.
 *
 * Body (all optional):
 *   { since?, limit?, dryRun?, analyze?, kind? }
 */
import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import {
  readIngestSettings,
  runImport,
  type IngestSettings,
} from '@/lib/ingest';
import { createJob, ensureJobsRuntime } from '@/services/jobs/init';
import type { Video } from '@/lib/types';

export const runtime = 'nodejs';

function loadCatalogVideos(): Video[] {
  const path = join(process.cwd(), 'public', 'catalog-data.json');
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as { videos?: Video[] };
    return Array.isArray(data.videos) ? data.videos : [];
  } catch {
    return [];
  }
}

function slugCompositionId(id: string): string {
  const slug = id
    .toLowerCase()
    .replace(/[^a-z0-9\-\u4e00-\u9fff]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return slug || `asset-${Date.now().toString(36)}`;
}

/** Ensure demos/<filename> stays under public/ and exists. */
function demosClipPath(filename: string): string | null {
  const publicDir = resolve(process.cwd(), 'public');
  const abs = resolve(publicDir, 'demos', filename);
  const r = relative(publicDir, abs);
  if (!r || r.startsWith('..') || r.startsWith(sep) || r.startsWith('/')) return null;
  if (!existsSync(abs)) return null;
  return r.replace(/\\/g, '/');
}

function safePublicRel(relPath: string): string | null {
  const publicDir = resolve(process.cwd(), 'public');
  const rel = relPath.replace(/^\/+/, '');
  const abs = resolve(publicDir, rel);
  const r = relative(publicDir, abs);
  if (!r || r.startsWith('..') || r.startsWith(sep) || r.startsWith('/')) return null;
  if (!existsSync(abs)) return null;
  return r.replace(/\\/g, '/');
}

async function enqueueAnalyze(filenames: string[]) {
  ensureJobsRuntime();
  const set = new Set(filenames);
  const catalogVideos = loadCatalogVideos().filter(
    v =>
      (v.stage === 'source' || !v.stage) &&
      (set.has(v.id) || (v.filename != null && set.has(v.filename))),
  );

  // Prefer catalog rows when present; fall back to demos/<filename> so analyze
  // still runs if catalog rebuild lagged or failed.
  const targets: Array<{ id: string; clip: string; name: string }> = [];
  const seenClips = new Set<string>();

  for (const video of catalogVideos) {
    const safe =
      (video.demosPath ? safePublicRel(video.demosPath) : null) ||
      (video.filename ? demosClipPath(video.filename) : null);
    if (!safe || seenClips.has(safe)) continue;
    seenClips.add(safe);
    targets.push({
      id: video.id,
      clip: safe,
      name: video.filename || video.id,
    });
  }

  for (const filename of filenames) {
    const clip = demosClipPath(filename);
    if (!clip || seenClips.has(clip)) continue;
    seenClips.add(clip);
    targets.push({ id: filename, clip, name: filename });
  }

  const jobIds: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const t of targets) {
    const compositionId = slugCompositionId(t.id);
    const result = await createJob(compositionId, {
      kind: 'analyze',
      prompt: `Analyze source asset ${t.id} (storyboard + VLM)`,
      inputs: { clips: [t.clip] },
      params: {
        name: t.name,
        videoId: t.id,
        transcribe: false,
        force: false,
      },
    });
    if ('error' in result && result.error) {
      skipped.push({ id: t.id, reason: String(result.error) });
      continue;
    }
    const data = (result as { data?: { jobId: string } }).data;
    if (data?.jobId) jobIds.push(data.jobId);
  }

  return { enqueued: jobIds.length, jobIds, skipped: skipped.length ? skipped : undefined };
}

export async function POST(request: Request) {
  let body: {
    since?: string;
    limit?: number;
    dryRun?: boolean;
    analyze?: boolean;
    kind?: IngestSettings['kind'];
    /** @deprecated Ignored for security — folder always comes from saved settings */
    folder?: string;
  } = {};

  try {
    const ct = request.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      body = (await request.json()) as typeof body;
    }
  } catch {
    /* empty body ok */
  }

  const saved = readIngestSettings();
  // Do not accept folder path overrides from the request body (arbitrary
  // directory listing + bulk copy into public/). Kind/since/limit are ok.
  const settings: IngestSettings = {
    ...saved,
    ...(body.kind === 'talkie' || body.kind === 'folder' ? { kind: body.kind } : {}),
    ...(body.since ? { since: body.since } : {}),
  };

  const ignoredFolderOverride = Boolean(body.folder && body.folder !== saved.folder);

  try {
    const result = runImport({
      settings,
      since: body.since ?? settings.since,
      limit: body.limit,
      dryRun: !!body.dryRun,
    });

    const doAnalyze = body.analyze ?? settings.analyze;
    let analyze: Awaited<ReturnType<typeof enqueueAnalyze>> | undefined;
    const warnings: string[] = [];
    if (ignoredFolderOverride) {
      warnings.push('Request body "folder" was ignored; using saved ingest settings only.');
    }
    if (!result.dryRun && !result.catalogOk) {
      warnings.push(
        'Catalog rebuild failed or returned non-zero; analyze may use demos/ paths only.',
      );
    }

    if (!result.dryRun && doAnalyze && result.imported.length > 0) {
      analyze = await enqueueAnalyze(result.imported);
      if (analyze.enqueued === 0 && result.imported.length > 0) {
        warnings.push(
          `Analyze requested for ${result.imported.length} import(s) but 0 jobs were enqueued.`,
        );
      }
    }

    if (!result.found.length) {
      return NextResponse.json({
        ok: true,
        ...result,
        analyze,
        warnings: warnings.length ? warnings : undefined,
        message: `No captures found (${result.source})`,
        queue: '/queue',
        assets: '/assets',
      });
    }

    return NextResponse.json({
      ok: result.catalogOk || result.dryRun,
      ...result,
      analyze,
      warnings: warnings.length ? warnings : undefined,
      message: result.dryRun
        ? `Dry run: ${result.found.length} file(s)`
        : `Imported ${result.copied.length} new, ${result.existed.length} already present` +
          (analyze ? ` · enqueued ${analyze.enqueued} analyze job(s)` : '') +
          (!result.catalogOk ? ' · catalog rebuild failed' : ''),
      queue: '/queue',
      assets: '/assets',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Import failed',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const settings = readIngestSettings();
  return NextResponse.json({
    settings,
    hint: 'POST to import. CLI: bun run process --from talkie --since 1d --analyze',
  });
}
