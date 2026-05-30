'use client';

/**
 * MemoReelInspector — right-side detail panel for MemoReel renders.
 *
 * Loads <video>.meta.json (sibling to the MP4) and renders four sections:
 *   1. Per-segment frame strip + VLM description
 *   2. Storyboard timeline overlay (live windows vs dead zones, picks marked)
 *   3. Judge findings (score, failures, warnings)
 *   4. Brief markdown preview (raw)
 *
 * The component is read-only — review notes still live in CatalogInspector.
 */

import { useEffect, useMemo, useState } from 'react';
import type { Video } from '../../lib/types';

interface SegmentMeta {
  index: number;
  srcStart: number;
  durationFrames: number;
  durationSec: number;
  label: string | null;
  role: string | null;
  vlm: null | {
    description: string | null;
    tags: string[];
    contentType: string | null;
    sceneActivity: string | null;
    sceneStart: number;
    sceneEnd: number;
    frameFile: string | null;
    frameUrl: string | null;
  };
}

interface JudgeReport {
  ok: boolean;
  score: number;
  failures: string[];
  warnings: string[];
}

interface MemoReelMeta {
  jobId: string;
  compositionId: string;
  createdAt: string;
  source: { path: string; duration: number; resolution: string; fps: number };
  storyboard: {
    id: string;
    dir: string;
    sceneCount: number;
    deadZones: Array<{ start: number; end: number; duration: number; reason: string }>;
    stats: { activeTime?: number; idleTime?: number; transitionTime?: number };
    scenes: Array<{
      index: number;
      start: number;
      end: number;
      activity: string;
      description: string;
      tags: string[];
      contentType: string;
      frameFile: string | null;
      frameUrl: string | null;
    }>;
  };
  visionProvider: string;
  judge: JudgeReport;
  segments: SegmentMeta[];
  output: { mp4: string; brief: string; meta: string };
}

function metaUrlFor(v: Video): string | null {
  if (!v.filename?.startsWith('MemoReel-')) return null;
  const base = v.filename.replace(/\.mp4$/, '');
  return `/out/${base}.meta.json`;
}

function briefUrlFor(v: Video): string | null {
  if (!v.filename?.startsWith('MemoReel-')) return null;
  const base = v.filename.replace(/\.mp4$/, '');
  return `/out/${base}.brief.md`;
}

export function MemoReelInspector({ video }: { video: Video }) {
  const metaUrl = metaUrlFor(video);
  const briefUrl = briefUrlFor(video);

  const [meta, setMeta] = useState<MemoReelMeta | null>(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!metaUrl) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(metaUrl).then(r => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`)))),
      briefUrl ? fetch(briefUrl).then(r => (r.ok ? r.text() : '')) : Promise.resolve(''),
    ])
      .then(([m, b]) => {
        setMeta(m);
        setBrief(b);
      })
      .catch((e) => setError(e.message ?? String(e)))
      .finally(() => setLoading(false));
  }, [metaUrl, briefUrl]);

  if (!metaUrl) return null;
  if (loading) return <div className="p-4 text-[10px] font-mono text-white/30">Loading memo-reel metadata…</div>;
  if (error || !meta) return (
    <div className="p-4 text-[10px] font-mono text-white/40">
      No metadata found ({error ?? 'meta.json missing'}). The memo-reel was likely rendered before the meta-persistence feature landed — re-run the routine to get the full inspector.
    </div>
  );

  return (
    <div className="flex flex-col">
      <Header meta={meta} />
      <JudgePanel report={meta.judge} />
      <TimelinePanel meta={meta} />
      <SegmentsPanel meta={meta} />
      <BriefPanel brief={brief ?? ''} />
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────

function Header({ meta }: { meta: MemoReelMeta }) {
  return (
    <div className="px-4 py-3 border-b border-white/[0.04]">
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/30 mb-2">Memo Reel</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
        <Cell label="Job" value={meta.jobId.slice(-12)} />
        <Cell label="Vision" value={meta.visionProvider} />
        <Cell label="Source" value={meta.source.path.split('/').pop() ?? meta.source.path} />
        <Cell label="Length" value={`${meta.source.duration.toFixed(1)}s`} />
        <Cell label="Scenes" value={`${meta.storyboard.sceneCount}`} />
        <Cell label="Dead zones" value={`${meta.storyboard.deadZones.length}`} />
        <Cell label="Active" value={`${meta.storyboard.stats.activeTime ?? '?'}s`} />
        <Cell label="Idle" value={`${meta.storyboard.stats.idleTime ?? '?'}s`} />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-white/30 text-[9px] uppercase tracking-[0.1em] shrink-0">{label}</span>
      <span className="text-white/75 truncate" title={value}>{value}</span>
    </div>
  );
}

// ── Judge panel ─────────────────────────────────────────────────

function JudgePanel({ report }: { report: JudgeReport }) {
  const passColor = report.ok ? 'text-emerald-300' : 'text-amber-300';
  return (
    <details open className="border-b border-white/[0.04]">
      <summary className="px-4 py-2.5 text-[9px] font-mono uppercase tracking-[0.15em] text-white/30 hover:text-white/50 cursor-pointer flex items-center gap-2">
        <span>Judge</span>
        <span className={`ml-auto ${passColor} normal-case tracking-normal text-[10px]`}>
          {report.ok ? 'PASS' : 'BEST-EFFORT'} · score {report.score.toFixed(1)}
        </span>
      </summary>
      <div className="px-4 pb-3 text-[10px] font-mono space-y-2">
        {report.failures.length > 0 && (
          <div>
            <div className="text-rose-300/80 text-[9px] uppercase tracking-wider mb-1">{report.failures.length} failure{report.failures.length !== 1 ? 's' : ''}</div>
            <ul className="space-y-0.5">
              {report.failures.map((f, i) => <li key={i} className="text-white/70 text-[10px] leading-tight">· {f}</li>)}
            </ul>
          </div>
        )}
        {report.warnings.length > 0 && (
          <div>
            <div className="text-amber-300/80 text-[9px] uppercase tracking-wider mb-1">{report.warnings.length} warning{report.warnings.length !== 1 ? 's' : ''}</div>
            <ul className="space-y-0.5 max-h-32 overflow-y-auto">
              {report.warnings.map((w, i) => <li key={i} className="text-white/50 text-[10px] leading-tight">· {w}</li>)}
            </ul>
          </div>
        )}
        {report.failures.length === 0 && report.warnings.length === 0 && (
          <div className="text-white/30">No findings.</div>
        )}
      </div>
    </details>
  );
}

// ── Timeline overlay ────────────────────────────────────────────

function TimelinePanel({ meta }: { meta: MemoReelMeta }) {
  const totalSec = meta.source.duration;
  const deadZones = meta.storyboard.deadZones;
  const picks = meta.segments;

  return (
    <details open className="border-b border-white/[0.04]">
      <summary className="px-4 py-2.5 text-[9px] font-mono uppercase tracking-[0.15em] text-white/30 hover:text-white/50 cursor-pointer flex items-center gap-2">
        Source timeline
        <span className="ml-auto text-[10px] text-white/40 normal-case tracking-normal">
          {totalSec.toFixed(1)}s
        </span>
      </summary>
      <div className="px-4 pb-3">
        {/* Timeline track */}
        <div className="relative h-7 rounded-sm bg-emerald-500/[0.12] border border-emerald-400/[0.18] overflow-hidden">
          {/* Dead zones */}
          {deadZones.map((dz, i) => (
            <div
              key={`dz-${i}`}
              className="absolute top-0 bottom-0 bg-white/[0.05]"
              style={{ left: `${(dz.start / totalSec) * 100}%`, width: `${((dz.end - dz.start) / totalSec) * 100}%` }}
              title={`dead ${dz.start.toFixed(1)}–${dz.end.toFixed(1)}s`}
            />
          ))}
          {/* Picks */}
          {picks.map((p) => (
            <div
              key={`pick-${p.index}`}
              className="absolute top-0 bottom-0 bg-rose-400/80 border-l border-r border-rose-300/60"
              style={{ left: `${(p.srcStart / totalSec) * 100}%`, width: `${Math.max(0.4, (p.durationSec / totalSec) * 100)}%` }}
              title={`#${p.index} ${p.role ?? ''} @ ${p.srcStart.toFixed(2)}s · ${p.durationSec}s${p.label ? ' · ' + p.label : ''}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[9px] font-mono text-white/30">
          <span>0s</span>
          <span>{(totalSec / 2).toFixed(0)}s</span>
          <span>{totalSec.toFixed(0)}s</span>
        </div>
        <div className="mt-2 flex gap-3 text-[9px] font-mono text-white/40">
          <span><span className="inline-block w-2 h-2 mr-1 bg-emerald-500/40 border border-emerald-400/40 align-middle" />live</span>
          <span><span className="inline-block w-2 h-2 mr-1 bg-white/10 align-middle" />dead</span>
          <span><span className="inline-block w-2 h-2 mr-1 bg-rose-400/80 align-middle" />pick ({picks.length})</span>
        </div>
      </div>
    </details>
  );
}

// ── Segments panel ──────────────────────────────────────────────

function SegmentsPanel({ meta }: { meta: MemoReelMeta }) {
  return (
    <details open className="border-b border-white/[0.04]">
      <summary className="px-4 py-2.5 text-[9px] font-mono uppercase tracking-[0.15em] text-white/30 hover:text-white/50 cursor-pointer flex items-center gap-2">
        Segments
        <span className="ml-auto text-[10px] text-white/40 normal-case tracking-normal">
          {meta.segments.length} cuts
        </span>
      </summary>
      <div className="pb-2">
        {meta.segments.map((s) => (
          <SegmentRow key={s.index} seg={s} />
        ))}
      </div>
    </details>
  );
}

function SegmentRow({ seg }: { seg: SegmentMeta }) {
  return (
    <div className="px-4 py-2 border-t border-white/[0.03] flex gap-3">
      <div className="shrink-0 w-24">
        {seg.vlm?.frameUrl ? (
          <img
            src={seg.vlm.frameUrl}
            alt={`segment ${seg.index} frame`}
            className="w-24 h-14 object-cover rounded-sm border border-white/[0.06]"
            loading="lazy"
          />
        ) : (
          <div className="w-24 h-14 rounded-sm border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-[9px] font-mono text-white/30">
            no frame
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-white/40">#{String(seg.index).padStart(2, '0')}</span>
          {seg.role && <span className="text-cyan-300/80 uppercase tracking-wider text-[9px]">{seg.role}</span>}
          {seg.label && <span className="text-amber-300/80 uppercase tracking-wider text-[9px]">{seg.label}</span>}
          <span className="ml-auto text-white/40 tabular-nums">{seg.srcStart.toFixed(2)}s · {seg.durationSec}s</span>
        </div>
        {seg.vlm?.description && (
          <div className="mt-1 text-[10px] leading-snug text-white/70">{seg.vlm.description}</div>
        )}
        {seg.vlm?.tags && seg.vlm.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {seg.vlm.tags.map((t) => (
              <span key={t} className="text-[8px] font-mono uppercase tracking-wider text-white/35 px-1 py-0.5 rounded-sm bg-white/[0.03]">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Brief preview ───────────────────────────────────────────────

function BriefPanel({ brief }: { brief: string }) {
  if (!brief) return null;
  return (
    <details className="border-b border-white/[0.04]">
      <summary className="px-4 py-2.5 text-[9px] font-mono uppercase tracking-[0.15em] text-white/30 hover:text-white/50 cursor-pointer">
        Brief (markdown)
      </summary>
      <div className="px-4 pb-3">
        <pre className="text-[10px] font-mono text-white/60 whitespace-pre-wrap leading-tight max-h-80 overflow-y-auto">{brief}</pre>
      </div>
    </details>
  );
}

export function isMemoReel(video: Video | null | undefined): boolean {
  return !!video?.filename?.startsWith('MemoReel-');
}
