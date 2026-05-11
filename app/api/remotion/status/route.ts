import { NextResponse } from 'next/server';

const REMOTION_PORT = 3000;

export async function GET() {
  try {
    const res = await fetch(`http://localhost:${REMOTION_PORT}`, {
      signal: AbortSignal.timeout(1200),
      cache: 'no-store',
    });
    return NextResponse.json({ running: res.ok || res.status < 500, port: REMOTION_PORT });
  } catch {
    return NextResponse.json({ running: false, port: REMOTION_PORT });
  }
}
