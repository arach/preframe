import { NextResponse } from 'next/server';
import {
  DEFAULT_INGEST,
  readIngestSettings,
  writeIngestSettings,
  type IngestSettings,
} from '@/lib/ingest';

export async function GET() {
  return NextResponse.json(readIngestSettings());
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<IngestSettings>;
    const current = readIngestSettings();
    const next = writeIngestSettings({
      kind: body.kind ?? current.kind,
      since: body.since ?? current.since,
      folder: body.folder ?? current.folder,
      analyze: body.analyze ?? current.analyze,
      register: body.register ?? current.register,
    });
    return NextResponse.json(next);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save ingest settings' },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const next = writeIngestSettings({ ...DEFAULT_INGEST });
  return NextResponse.json(next);
}
