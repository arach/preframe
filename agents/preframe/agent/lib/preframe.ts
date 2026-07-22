/**
 * HTTP-only helpers for the Preframe operator agent.
 * All product side effects go through the Preframe app on PREFRAME_URL (:3100).
 * No disk reads of the monorepo, no shelling bun/python.
 */

export function preframeUrl(): string {
  return (process.env.PREFRAME_URL || "http://localhost:3100").replace(/\/$/, "");
}

export interface CatalogVideo {
  id: string;
  filename: string;
  demosPath?: string | null;
  capturedAt?: string;
  duration: number;
  resolution?: string;
  sizeMB?: number;
  app?: string;
  stage?: string;
  analysisStatus?: string | null;
  storyboardDir?: string | null;
  description?: string;
  transcript?: unknown;
}

export interface CatalogData {
  videos: CatalogVideo[];
  generatedAt?: string;
}

export async function fetchCatalog(): Promise<CatalogData> {
  const res = await fetch(`${preframeUrl()}/catalog-data.json`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `Catalog fetch failed (${res.status}). Is Preframe running at ${preframeUrl()}?`,
    );
  }
  return (await res.json()) as CatalogData;
}

export function isAnalyzed(v: CatalogVideo): boolean {
  return v.analysisStatus === "complete" || v.analysisStatus === "analyzed";
}

export function needsAnalysis(v: CatalogVideo): boolean {
  return (
    !v.analysisStatus ||
    v.analysisStatus === "none" ||
    v.analysisStatus === "frames-only"
  );
}

export function filterSourceVideos(
  videos: CatalogVideo[],
  opts: {
    needsAnalysisOnly?: boolean;
    analyzedOnly?: boolean;
    since?: string;
    app?: string;
    ids?: string[];
    limit?: number;
  } = {},
): CatalogVideo[] {
  let list = videos.filter((v) => v.stage === "source" || !v.stage);

  if (opts.ids?.length) {
    const set = new Set(opts.ids);
    list = list.filter((v) => set.has(v.id) || set.has(v.filename));
  }
  if (opts.needsAnalysisOnly) list = list.filter(needsAnalysis);
  if (opts.analyzedOnly) list = list.filter(isAnalyzed);
  if (opts.app) {
    const app = opts.app.toLowerCase();
    list = list.filter((v) => (v.app || "").toLowerCase() === app);
  }
  if (opts.since) {
    const cutoff = parseSince(opts.since);
    if (cutoff) {
      // Missing timestamps are older than any relative window — exclude them.
      list = list.filter((v) => {
        if (!v.capturedAt) return false;
        return new Date(v.capturedAt).getTime() >= cutoff.getTime();
      });
    }
  }

  list.sort(
    (a, b) =>
      new Date(b.capturedAt ?? 0).getTime() -
      new Date(a.capturedAt ?? 0).getTime(),
  );

  if (opts.limit && opts.limit > 0) list = list.slice(0, opts.limit);
  return list;
}

function parseSince(value: string): Date | null {
  const rel = value.match(/^(\d+)([dhm])$/i);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = rel[2].toLowerCase();
    const d = new Date();
    if (unit === "d") d.setDate(d.getDate() - n);
    else if (unit === "h") d.setHours(d.getHours() - n);
    else if (unit === "m") d.setMinutes(d.getMinutes() - n);
    return d;
  }
  const abs = new Date(value);
  return Number.isNaN(abs.getTime()) ? null : abs;
}

export async function postAnalyze(body: {
  ids?: string[];
  filter?: "needs-analysis" | "all";
  since?: string;
  app?: string;
  limit?: number;
  transcribe?: boolean;
  force?: boolean;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  try {
    const res = await fetch(`${preframeUrl()}/api/assets/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep */
    }
    return { ok: res.ok, status: res.status, body: parsed };
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      body: {
        error: e.message,
        hint: `Start Preframe: bun run dev at monorepo root (${preframeUrl()})`,
      },
    };
  }
}

export async function postJob(body: {
  compositionId: string;
  kind: string;
  prompt: string;
  inputs?: Record<string, unknown>;
  params?: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const url = `${preframeUrl()}/api/compositions/${encodeURIComponent(body.compositionId)}/jobs`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: body.kind,
        prompt: body.prompt,
        inputs: body.inputs,
        params: body.params,
        idempotencyKey: body.idempotencyKey,
      }),
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep */
    }
    return { ok: res.ok, status: res.status, body: parsed };
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      body: {
        error: e.message,
        hint: `Is Preframe running at ${preframeUrl()}?`,
      },
    };
  }
}

export async function listJobs(): Promise<unknown> {
  const res = await fetch(`${preframeUrl()}/api/jobs`);
  if (!res.ok) throw new Error(`jobs API ${res.status}`);
  return res.json();
}
