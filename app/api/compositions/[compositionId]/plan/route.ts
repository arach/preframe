/**
 * GET /api/compositions/:compositionId/plan
 * Best-effort parse of generated Composition.tsx CLIPS (incl. zoom) for zoom map UI.
 */
import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseClipsFromCompositionTsx } from '@/lib/zoom-map';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ compositionId: string }> },
) {
  const { compositionId } = await params;
  if (!compositionId || compositionId.includes('..') || compositionId.includes('/')) {
    return NextResponse.json({ error: 'invalid compositionId' }, { status: 400 });
  }

  const path = join(process.cwd(), '.compositions', compositionId, 'Composition.tsx');
  if (!existsSync(path)) {
    return NextResponse.json(
      { error: 'composition not found', compositionId, path: `.compositions/${compositionId}/Composition.tsx` },
      { status: 404 },
    );
  }

  const tsx = readFileSync(path, 'utf8');
  const clips = parseClipsFromCompositionTsx(tsx);

  // Assign approximate composition timeline offsets (after intro if present)
  const introMatch = tsx.match(/INTRO_FRAMES\s*=\s*Math\.round\(([0-9.]+)\s*\*\s*FPS\)/);
  const introSec = introMatch ? parseFloat(introMatch[1]) : 0;
  let t = introSec;
  for (const c of clips) {
    c.timelineStartSec = t;
    t += c.duration;
  }

  const zoomCount = clips.filter(c => c.zoom && (c.zoom.scale ?? 1) > 1.01).length;

  return NextResponse.json({
    compositionId,
    introSec,
    clips,
    zoomCount,
    hint:
      zoomCount === 0
        ? 'No clip zooms in this plan'
        : `${zoomCount} clip(s) with zoom — open Zoom map in the player to inspect viewport vs full frame`,
  });
}
