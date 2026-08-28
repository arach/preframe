import { NextResponse } from 'next/server';
import { summarizeRun } from '@/lib/runs';
import { listRuns } from '@/services/runs/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const runs = await listRuns();
  return NextResponse.json({ runs: runs.map(summarizeRun) });
}
