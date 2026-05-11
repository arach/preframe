import { NextResponse } from 'next/server';
import { unlink } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PUBLIC = join(process.cwd(), 'public');
const LEGACY_OUT = join(process.cwd(), 'out');

const ALLOWED_ROOTS = [PUBLIC, LEGACY_OUT];

export async function POST(req: Request) {
  const { videoUrl } = await req.json();
  if (!videoUrl || typeof videoUrl !== 'string') {
    return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });
  }

  // videoUrl is relative to public; "../out" is kept for older root-level renders.
  let absPath: string;
  if (videoUrl.startsWith('../out/')) {
    absPath = resolve(LEGACY_OUT, videoUrl.replace(/^\.\.\/out\//, ''));
  } else {
    absPath = resolve(PUBLIC, videoUrl);
  }

  const allowed = ALLOWED_ROOTS.some(root => {
    const rel = relative(root, absPath);
    return !rel.startsWith('..') && !rel.startsWith('/');
  });

  if (!allowed) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  try {
    await unlink(absPath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Rebuild catalog in background so the deleted entry is gone on next refresh
  execFileAsync('bun', ['run', 'scripts/build-catalog.ts'], {
    cwd: process.cwd(),
    timeout: 60_000,
    env: { ...process.env, PATH: `${process.env.PATH}:/Users/art/.bun/bin:/usr/local/bin` },
  }).catch(() => { /* non-fatal */ });

  return NextResponse.json({ ok: true });
}
