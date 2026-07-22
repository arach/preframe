import { NextResponse } from 'next/server';
import { getMiniMaxApiKey, readMusicModelConfig } from '@/lib/provider';

export const runtime = 'nodejs';

interface LyricsRequest {
  mode?: 'write_full_song' | 'edit';
  prompt?: string;
  lyrics?: string;
  title?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as LyricsRequest;
    const mode = body.mode || (body.lyrics?.trim() ? 'edit' : 'write_full_song');
    const payload: Record<string, unknown> = {
      mode,
      prompt: (body.prompt || '').slice(0, 2000),
    };

    if (mode === 'edit' && body.lyrics?.trim()) {
      payload.lyrics = body.lyrics.slice(0, 3500);
    }
    if (body.title?.trim()) {
      payload.title = body.title.trim();
    }

    const musicConfig = readMusicModelConfig();
    if (!musicConfig) {
      return NextResponse.json({ error: 'Music model is not configured in Settings' }, { status: 400 });
    }
    const apiKey = getMiniMaxApiKey(musicConfig);
    if (!apiKey) {
      return NextResponse.json({ error: 'Music model API key is not configured' }, { status: 400 });
    }

    const res = await fetch('https://api.minimax.io/v1/lyrics_generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as any;
    const statusCode = data?.base_resp?.status_code;
    if (!res.ok || statusCode !== 0) {
      const statusMsg = data?.base_resp?.status_msg || res.statusText;
      return NextResponse.json({ error: `MiniMax lyrics generation failed: ${statusMsg}`, result: data }, { status: 502 });
    }

    return NextResponse.json({
      ...data,
      request: {
        ...payload,
        authorization: 'Bearer [redacted]',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
