import { NextResponse } from 'next/server';
import { isIntakeError, submitAgentJob } from '@/services/agent-jobs/intake';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/agents/jobs',
    method: 'POST',
    purpose: 'Submit local video/audio files and source materials into the visible Preframe queue.',
    modes: {
      register: 'Default. Ingest local paths, create a completed intake job, and make it visible in /queue.',
      queue: 'Ingest local paths, then enqueue a render/generate job for the worker.',
      treatment: 'Register completed treatment outputs into public/out, create a completed render job, and show them in Treatments.',
    },
    body: {
      mode: 'register | queue | treatment',
      compositionId: 'optional-stable-slug',
      name: 'Human title shown in /queue',
      prompt: 'Motion or editorial instructions',
      sources: [
        {
          path: '/absolute/local/path/to/capture.mov',
          role: 'clip',
          filename: 'optional-public-name.mov',
        },
      ],
      outputs: [
        {
          path: '/absolute/local/path/to/final-treatment.mp4',
          filename: 'optional-public-name.mp4',
        },
      ],
      attachments: [
        {
          path: '/absolute/local/path/to/preframe.manifest.json',
          kind: 'action-preframe-manifest',
        },
      ],
      params: {
        aspectRatio: '1:1',
        durationSec: 12.3,
      },
      idempotencyKey: 'stable retry key',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitAgentJob(body);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (err) {
    if (isIntakeError(err)) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
