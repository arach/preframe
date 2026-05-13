'use client';

import { useCallback, useRef } from 'react';
import type { AppPorts } from 'hudsonkit';

// ---------------------------------------------------------------------------
// Hudson Logo Animation Job — input payload from Logo Designer
// ---------------------------------------------------------------------------
export interface LogoAnimationJobPayload {
  sourceSvg: string;
  renderBody?: string;
  params?: Record<string, unknown>;
  targetParams?: Record<string, unknown>;
  prompt?: string;
  fx?: { presets?: string[]; prompt?: string };
  sfx?: { presets?: string[]; prompt?: string; mute?: boolean };
  templateId?: string;
}

// ---------------------------------------------------------------------------
// Render-complete — output payload back to Hudson
// ---------------------------------------------------------------------------
export interface RenderCompletePayload {
  jobId: string;
  compositionId: string;
  status: 'completed' | 'failed';
  outputUrls?: string[];
  error?: string;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Static port declarations
// ---------------------------------------------------------------------------
export const preframePorts: AppPorts = {
  inputs: [
    {
      id: 'logo-animation-job',
      name: 'Logo Animation Job',
      dataType: 'json',
      description: 'Accepts a logo animation job from Logo Designer (SVG + params + prompt + fx/sfx)',
    },
  ],
  outputs: [
    {
      id: 'render-complete',
      name: 'Render Complete',
      dataType: 'json',
      description: 'Emits job completion status with output URLs or error',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function pollJobUntilDone(
  jobId: string,
  timeoutMs = 90_000,
): Promise<{ status: string; result?: { outputUrls?: string[] }; error?: { message: string } }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
      if (res.ok) {
        const job = await res.json() as {
          status: string;
          result?: { outputUrls?: string[] };
          error?: { message: string };
        };
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'canceled') {
          return job;
        }
      }
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 1500));
  }
  return { status: 'failed', error: { message: 'Timed out waiting for job completion' } };
}

// ---------------------------------------------------------------------------
// Port hooks — share latest result via a ref stored once per component tree
// ---------------------------------------------------------------------------

/**
 * Combined port hooks for preframe's HudsonApp.
 * Both hooks must be called in the same component (the Bridge) so they
 * share the same ref for the latest render result.
 */
export function usePreframePortOutput() {
  const resultRef = useRef<RenderCompletePayload | null>(null);

  return useCallback((portId: string): unknown | null => {
    if (portId !== 'render-complete') return null;
    const value = resultRef.current;
    // Clear after read — port events are one-shot notifications
    resultRef.current = null;
    return value;
  }, []);
}

export function usePreframePortInput() {
  const resultRef = useRef<RenderCompletePayload | null>(null);

  const setResult = useCallback((r: RenderCompletePayload) => {
    resultRef.current = r;
  }, []);

  return useCallback(async (portId: string, data: unknown) => {
    if (portId !== 'logo-animation-job') return;
    const payload = data as LogoAnimationJobPayload;
    if (!payload?.sourceSvg) return;

    const compositionId = payload.templateId
      ? `hudson-logo-${payload.templateId}-${Date.now()}`
      : `hudson-logo-${Date.now()}`;

    const startTime = Date.now();

    // Build prompt enriched with fx/sfx context
    const promptParts: string[] = [];
    if (payload.prompt) promptParts.push(payload.prompt);
    if (payload.fx?.presets?.length) promptParts.push(`Visual effects: ${payload.fx.presets.join(', ')}`);
    if (payload.fx?.prompt) promptParts.push(`FX notes: ${payload.fx.prompt}`);
    if (payload.sfx && !payload.sfx.mute) {
      if (payload.sfx.presets?.length) promptParts.push(`Sound effects: ${payload.sfx.presets.join(', ')}`);
      if (payload.sfx.prompt) promptParts.push(`SFX notes: ${payload.sfx.prompt}`);
    }
    if (payload.sfx?.mute) promptParts.push('No sound effects — silent render.');
    const enrichedPrompt = promptParts.join('\n');

    const inputs: Record<string, unknown> = {
      sourceSvg: payload.sourceSvg,
      prompt: enrichedPrompt || undefined,
    };
    if (payload.renderBody) inputs.renderBody = payload.renderBody;
    if (payload.params) inputs.params = payload.params;
    if (payload.targetParams) inputs.targetParams = payload.targetParams;
    if (payload.fx) inputs.fx = payload.fx;
    if (payload.sfx) inputs.sfx = payload.sfx;

    try {
      // Stage 1: logo-brief
      const briefRes = await fetch(`/api/compositions/${encodeURIComponent(compositionId)}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'logo-brief', prompt: enrichedPrompt, inputs }),
      });
      if (!briefRes.ok) {
        const body = await briefRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `logo-brief failed (${briefRes.status})`);
      }
      const briefJob = await briefRes.json() as { jobId: string };
      const briefResult = await pollJobUntilDone(briefJob.jobId);
      if (briefResult.status !== 'completed') {
        throw new Error(briefResult.error?.message ?? 'logo-brief failed');
      }

      // Stage 2: logo-render (brief is now on disk for the worker to read)
      const renderRes = await fetch(`/api/compositions/${encodeURIComponent(compositionId)}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'logo-render', prompt: enrichedPrompt, inputs }),
      });
      if (!renderRes.ok) {
        const body = await renderRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `logo-render failed (${renderRes.status})`);
      }
      const renderJob = await renderRes.json() as { jobId: string };
      const renderResult = await pollJobUntilDone(renderJob.jobId);

      setResult({
        jobId: renderJob.jobId,
        compositionId,
        status: renderResult.status === 'completed' ? 'completed' : 'failed',
        outputUrls: renderResult.result?.outputUrls,
        error: renderResult.error?.message,
        durationMs: Date.now() - startTime,
      });
    } catch (err) {
      setResult({
        jobId: '',
        compositionId,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
      });
    }
  }, [setResult]);
}
