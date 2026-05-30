/**
 * GET /api/presets — list saved frame presets.
 *
 * Presets live as JSON files under src/kit/presets/. The directory may not
 * exist on a fresh clone — return an empty list rather than failing.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const PRESET_DIR = join(process.cwd(), 'src', 'kit', 'presets');

export async function GET() {
  try {
    let entries: string[] = [];
    try {
      entries = await readdir(PRESET_DIR);
    } catch {
      return jsonResponse({ presets: [] });
    }

    const presets = await Promise.all(
      entries
        .filter((n) => n.endsWith('.json'))
        .map(async (file) => {
          const path = join(PRESET_DIR, file);
          try {
            const [body, info] = await Promise.all([
              readFile(path, 'utf-8'),
              stat(path),
            ]);
            const data = JSON.parse(body);
            return {
              name: data.name ?? file.replace(/\.json$/, ''),
              title: data.title,
              description: data.description,
              layerCount: Array.isArray(data.layers) ? data.layers.length : 0,
              updatedAt: data.updatedAt ?? info.mtime.toISOString(),
            };
          } catch {
            return null;
          }
        }),
    );

    return jsonResponse({
      presets: presets
        .filter(Boolean)
        .sort((a, b) =>
          (b!.updatedAt ?? '').localeCompare(a!.updatedAt ?? ''),
        ),
    });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
