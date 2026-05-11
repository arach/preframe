import { NextResponse } from 'next/server';
import { unlink } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PUBLIC = join(process.cwd(), 'public');

export async function POST(req: Request) {
  const { path } = await req.json();
  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  const absPath = resolve(PUBLIC, path.replace(/^\//, ''));
  const rel = relative(PUBLIC, absPath);
  if (rel.startsWith('..') || rel.startsWith('/')) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  const deletions = [absPath, absPath.replace(/\.mp3$/, '.json')];
  await Promise.all(
    deletions.map(p => unlink(p).catch(e => { if (e.code !== 'ENOENT') throw e; }))
  );

  // Rebuild catalog in background so the deleted entry is gone on next refresh
  execFileAsync('bun', ['run', 'scripts/build-catalog.ts'], {
    cwd: process.cwd(),
    timeout: 60_000,
    env: { ...process.env, PATH: `${process.env.PATH}:/Users/art/.bun/bin:/usr/local/bin` },
  }).catch(() => { /* non-fatal */ });

  return NextResponse.json({ ok: true });
}
