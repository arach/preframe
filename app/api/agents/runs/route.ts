import { NextResponse } from 'next/server';
import { RUN_ITEM_ROLES, RUN_STATUSES } from '@/lib/runs';
import { isRunStoreError, submitAgentRun } from '@/services/runs/intake';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/agents/runs',
    method: 'POST',
    purpose:
      'Create or update a Run — a named, ordered dossier of the artifacts belonging to one creative exercise. References existing files in place; never copies media or rebuilds the catalog.',
    idempotency:
      'Upsert by `slug`. Items upsert by `key` (derived from role + identity when omitted), so re-running the same payload updates in place and keeps item ids — and therefore deep links — stable.',
    body: {
      slug: 'openscout-v3-montage',
      title: 'OpenScout V3 — montage',
      description: 'One line shown on the run card',
      brief: 'Optional markdown brief',
      status: RUN_STATUSES.join(' | '),
      tags: ['openscout', 'v3'],
      groups: [{ id: 'finals', label: 'Finals', description: 'Delivered edits', order: 0 }],
      itemsMode: 'merge (default) | replace',
      items: [
        {
          key: 'optional stable key',
          role: RUN_ITEM_ROLES.join(' | '),
          label: 'Edit A · Dark hero — 16:9',
          description: 'Optional',
          group: 'Finals',
          order: 0,
          preferred: true,
          path: 'out/openscout-v3/openscout-v3-dark-hero-1920x1080.mp4',
          url: 'optional — derived when the path is under public/',
          catalogId: 'optional — derived when the catalog already indexes the file',
          nativeHref: 'optional — derived from the catalog object',
          meta: { format: '16:9', durationSec: 45 },
        },
      ],
    },
    response: {
      ok: true,
      created: 'true when the run did not exist',
      run: 'the full run document',
      links: {
        run: 'canonical run URL',
        hero: 'best link for the preferred final',
        items: 'itemId -> { href, deepLink, state }',
      },
      warnings: ['items whose files are not on disk yet are recorded as pending'],
    },
    notes: [
      'Paths may be absolute or repo-relative; they are stored repo-relative.',
      'A file that does not exist yet is recorded as state=pending, not rejected. Re-post once it lands to upgrade it in place.',
      'Artifacts keep their native identity: a registered treatment resolves to /treatments/<id>, a track to /music/<id>.',
    ],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const origin = new URL(request.url).origin;
    const result = await submitAgentRun(body, origin);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (err) {
    if (isRunStoreError(err)) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
