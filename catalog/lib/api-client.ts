/**
 * Shared API client for catalog components.
 *
 * Resolves base URL once:
 * - Standalone (:3100): relative fetch (empty base)
 * - Embedded in Hudson (:3500): absolute fetch to preframe's origin
 */

const PREFRAME_ORIGIN = 'http://localhost:3100';

function getBase(): string {
  if (typeof window === 'undefined') return '';
  // If we're running on preframe's own port, use relative paths
  if (window.location.origin === PREFRAME_ORIGIN) return '';
  // Otherwise we're embedded — target preframe's API server
  return PREFRAME_ORIGIN;
}

let _base: string | null = null;
function base(): string {
  if (_base === null) _base = getBase();
  return _base;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${base()}${path}`, init);
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
