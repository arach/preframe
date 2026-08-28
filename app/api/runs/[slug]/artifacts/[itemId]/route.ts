import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { getRun } from '@/services/runs/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

/**
 * Serve a run member that lives outside `public/` — the canonical deliverables
 * in `out/`, composition source, validation stills.
 *
 * The allowlist is the run itself: a path is served only when the named run
 * lists it as the named item's `ref.path`, and only when it resolves inside the
 * checkout. Nothing is copied.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  const { slug, itemId } = await params;

  const run = await getRun(slug);
  if (!run) return NextResponse.json({ error: 'not_found', slug }, { status: 404 });

  const item = run.items.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: 'not_found', itemId }, { status: 404 });
  if (!item.ref.path) {
    return NextResponse.json({ error: 'no_file', itemId }, { status: 404 });
  }

  const absolute = resolve(ROOT, item.ref.path);
  const rel = relative(ROOT, absolute);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
    return NextResponse.json({ error: 'outside_project' }, { status: 403 });
  }

  let size: number;
  try {
    const info = await stat(join(ROOT, rel));
    if (!info.isFile()) return NextResponse.json({ error: 'not_a_file' }, { status: 404 });
    size = info.size;
  } catch {
    return NextResponse.json({ error: 'not_on_disk', path: rel }, { status: 404 });
  }

  const type = contentType(rel);
  const range = parseRange(request.headers.get('range'), size);

  if (range) {
    const stream = createReadStream(absolute, { start: range.start, end: range.end });
    return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
      status: 206,
      headers: {
        'Content-Type': type,
        'Content-Length': String(range.end - range.start + 1),
        'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      },
    });
  }

  const stream = createReadStream(absolute);
  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Content-Length': String(size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    },
  });
}

/** `bytes=start-end`, clamped to the file. Unsatisfiable ranges fall back to 200. */
function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  let start: number;
  let end: number;

  if (rawStart === '') {
    // Suffix range: the last N bytes.
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === '' ? size - 1 : Number(rawEnd);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start > end || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

const TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4v: 'video/x-m4v',
  gif: 'image/gif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  json: 'application/json; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  ts: 'text/plain; charset=utf-8',
  tsx: 'text/plain; charset=utf-8',
};

function contentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return TYPES[ext] ?? 'application/octet-stream';
}
