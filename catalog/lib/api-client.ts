/**
 * Shared API client for catalog components.
 *
 * Resolves base URL once:
 * - Standalone (:3100): relative fetch (empty base)
 * - Embedded in Hudson (:3500): absolute fetch to preframe's origin
 *
 * All requests are network-safe — if the Preframe service is unreachable,
 * `request()` returns a synthetic 503 Response instead of throwing.
 * Use `checkHealth()` to probe service availability before driving UI state.
 *
 * Note: `Response` status must be in [200, 599]; status 0 is invalid and throws
 * RangeError in modern browsers.
 */

const PREFRAME_ORIGIN = 'http://localhost:3100';
const HEALTH_PATH = '/api/health';

function getBase(): string {
  if (typeof window === 'undefined') return '';
  if (window.location.origin === PREFRAME_ORIGIN) return '';
  return PREFRAME_ORIGIN;
}

let _base: string | null = null;
function base(): string {
  if (_base === null) _base = getBase();
  return _base;
}

function offlineResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'network_unavailable', offline: true }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${base()}${path}`, init);
  } catch {
    return offlineResponse();
  }
}

/** Probe the Preframe service. Resolves true iff /api/health returns ok within timeoutMs. */
export async function checkHealth(timeoutMs = 2000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(`${base()}${HEALTH_PATH}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  get(path: string, init?: RequestInit): Promise<Response> {
    return request(path, { ...init, method: 'GET' });
  },
  post(path: string, init?: RequestInit): Promise<Response> {
    return request(path, { ...init, method: 'POST' });
  },
  patch(path: string, init?: RequestInit): Promise<Response> {
    return request(path, { ...init, method: 'PATCH' });
  },
  delete(path: string, init?: RequestInit): Promise<Response> {
    return request(path, { ...init, method: 'DELETE' });
  },
  /** Raw request — caller controls method. */
  fetch: request,
};
