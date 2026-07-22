/**
 * POST /api/catalog/import
 *
 * Run capture ingest using saved settings (or body overrides).
 * Same outcome as `bun run process --from talkie|folder …`.
 *
 * Body (all optional):
 *   { since?, limit?, dryRun?, analyze?, kind?, folder? }
 */
import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    const data = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(data.videos) ? data.videos : [];
  } catch {
    return [];
  }
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

async function enqueueAnalyze(filenames: string[]) {
  ensureJobsRuntime();
  const set = new Set(filenames);
  const videos = loadCatalogVideos().filter(
    v =>
      (v.stage === 'source' || !v.stage) &&
      (set.has(v.id) || (v.filename != null && set.has(v.filename))),
  );

  const jobIds: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const video of videos) {
    const clip = video.demosPath?.replace(/^\/+/, '')
      || (video.filename ? `demos/${video.filename}` : null);
    if (!clip) {
      skipped.push({ id: video.id, reason: 'no demos path' });
      continue;
    }
    const compositionId = slugCompositionId(video);
    const result = await createJob(compositionId, {
      kind: 'analyze',
      prompt: `Analyze source asset ${video.id} (storyboard + VLM)`,
      inputs: { clips: [clip] },
      params: {
        name: video.filename || video.id,
        videoId: video.id,
        transcribe: false,
        force: false,
      },
    });
    if ('error' in result && result.error) {
      skipped.push({ id: video.id, reason: String(result.error) });
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
  const settings: IngestSettings = {
    ...saved,
    ...(body.kind ? { kind: body.kind } : {}),
    ...(body.folder ? { folder: body.folder } : {}),
    ...(body.since ? { since: body.since } : {}),
  };

  try {
    const result = runImport({
      settings,
      since: body.since ?? settings.since,
      limit: body.limit,
      dryRun: !!body.dryRun,
    });

    const doAnalyze = body.analyze ?? settings.analyze;
    let analyze: Awaited<ReturnType<typeof enqueueAnalyze>> | undefined;
    if (!result.dryRun && doAnalyze && result.imported.length > 0) {
      analyze = await enqueueAnalyze(result.imported);
    }

    if (!result.found.length) {
      return NextResponse.json({
        ok: true,
        ...result,
        analyze,
        message: `No captures found (${result.source})`,
        queue: '/queue',
        assets: '/assets',
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
      analyze,
      message: result.dryRun
        ? `Dry run: ${result.found.length} file(s)`
        : `Imported ${result.copied.length} new, ${result.existed.length} already present` +
          (analyze ? ` · enqueued ${analyze.enqueued} analyze job(s)` : ''),
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
