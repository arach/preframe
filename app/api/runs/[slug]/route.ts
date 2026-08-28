import { NextResponse } from 'next/server';
import { linksForRun } from '@/services/runs/intake';
import { getRun } from '@/services/runs/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const run = await getRun(slug);
  if (!run) {
    return NextResponse.json({ error: 'not_found', slug }, { status: 404 });
  }
  return NextResponse.json({ run, links: linksForRun(run, new URL(request.url).origin) });
}
