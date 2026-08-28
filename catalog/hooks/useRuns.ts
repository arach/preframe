'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Run, RunSummary } from '../../lib/runs';
import { apiClient } from '../lib/api-client';

/** The run list at /runs. */
export function useRunList() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiClient.get('/api/runs', { cache: 'no-store' });
    if (!res.ok) {
      setError(`Could not load runs (${res.status})`);
      setRuns([]);
      return;
    }
    const body = (await res.json()) as { runs: RunSummary[] };
    setRuns(body.runs ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { runs, error, reload: load };
}

/** One run document. `null` slug parks the hook without fetching. */
export function useRun(slug: string | null) {
  const [run, setRun] = useState<Run | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle');

  const load = useCallback(async () => {
    if (!slug) {
      setRun(null);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const res = await apiClient.get(`/api/runs/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.status === 404) {
      setRun(null);
      setStatus('missing');
      return;
    }
    if (!res.ok) {
      setRun(null);
      setStatus('error');
      return;
    }
    const body = (await res.json()) as { run: Run };
    setRun(body.run);
    setStatus('ready');
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { run, status, reload: load };
}
