/**
 * GET / PUT / DELETE /api/presets/:name
 *
 * Preset JSON read/write. Slug validation guards against directory
 * traversal. We don't auto-create the parent dir on GET (file just won't
 * exist), but PUT will mkdir -p so a fresh repo works.
 */
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const PRESET_DIR = join(process.cwd(), 'src', 'kit', 'presets');

function validSlug(name: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(name);
}

function presetPath(name: string): string {
  return join(PRESET_DIR, `${name}.json`);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!validSlug(name)) return jsonResponse({ error: 'invalid_name' }, 400);
  try {
    const body = await readFile(presetPath(name), 'utf-8');
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return jsonResponse({ error: 'not_found' }, 404);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!validSlug(name)) return jsonResponse({ error: 'invalid_name' }, 400);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }
  if (!payload || typeof payload !== 'object') {
    return jsonResponse({ error: 'invalid_body' }, 400);
  }

  try {
    await mkdir(PRESET_DIR, { recursive: true });
    await writeFile(presetPath(name), JSON.stringify(payload, null, 2), 'utf-8');
    return jsonResponse({ ok: true, name });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!validSlug(name)) return jsonResponse({ error: 'invalid_name' }, 400);
  try {
    await unlink(presetPath(name));
    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ error: 'not_found' }, 404);
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
