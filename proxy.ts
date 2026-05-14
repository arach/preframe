import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Allow Hudson (and self) to call preframe's API when preframe is composed
// into Hudson's WorkspaceShell. Without this, the cross-origin fetch from
// :3500 → :3100 fails CORS preflight.
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3500',
  'http://localhost:3100',
]);

export function proxy(req: NextRequest) {
  const origin = req.headers.get('origin');
  const isAllowed = origin !== null && ALLOWED_ORIGINS.has(origin);

  if (req.method === 'OPTIONS' && isAllowed) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin!,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const res = NextResponse.next();
  if (isAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin!);
    res.headers.set('Vary', 'Origin');
  }
  return res;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/catalog-data.json',
    '/curated-snippets.json',
  ],
};
