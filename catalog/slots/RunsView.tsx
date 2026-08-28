'use client';

import { useMemo } from 'react';
import { Boxes, Clock3, Film, Layers } from 'lucide-react';
import { useCatalog } from '../Provider';
import { useRunList } from '../hooks/useRuns';
import { pathForRun } from '../lib/routes';
import { CopyLink, StatusPill } from './RunPrimitives';
import { artifactSrc, type RunSummary } from '../../lib/runs';

export function RunsView() {
  const { runs, error } = useRunList();

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-300/60 text-[12px] font-mono">
        {error}
      </div>
    );
  }

  if (runs == null) {
    return (
      <div className="flex h-full items-center justify-center text-white/20 text-[12px] font-mono tracking-wider uppercase">
        Loading runs…
      </div>
    );
  }

  if (runs.length === 0) return <EmptyRuns />;

  return (
    <div className="h-full overflow-y-auto frame-scrollbar">
      <div className="px-6 pt-6 pb-3">
        <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">Runs</div>
        <h1 className="text-[15px] text-white/85 font-medium mt-1">Creative exercises</h1>
        <p className="text-[11px] text-white/35 mt-1 max-w-[52ch] leading-relaxed">
          A run gathers everything one exercise produced — brief, sources, score, composition,
          finals and the evidence they were checked against — without moving a single file.
        </p>
      </div>

      <div className="px-6 pb-10 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
        {runs.map(run => (
          <RunCard key={run.slug} run={run} />
        ))}
      </div>
    </div>
  );
}

function EmptyRuns() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
      <Boxes size={28} className="text-white/12" />
      <div className="text-[12px] text-white/40">No runs yet</div>
      <p className="text-[11px] text-white/25 max-w-[44ch] leading-relaxed font-mono">
        POST to <span className="text-cyan-300/60">/api/agents/runs</span> with a slug, a title and
        the artifacts to attach. Nothing is copied — a run points at what already exists.
      </p>
    </div>
  );
}

function RunCard({ run }: { run: RunSummary }) {
  const { openRun } = useCatalog();
  const href = pathForRun(run.slug);
  const heroUrl = run.hero ? artifactSrc(run, run.hero) : null;

  const updated = useMemo(() => relativeTime(run.updatedAt), [run.updatedAt]);

  return (
    <a
      href={href}
      onClick={e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openRun(run.slug);
      }}
      className="group flex flex-col rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden hover:border-cyan-400/25 hover:bg-white/[0.03] transition-colors"
    >
      <div className="relative aspect-video bg-black/50 flex items-center justify-center overflow-hidden">
        {heroUrl ? (
          <video
            src={heroUrl}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <Film size={22} className="text-white/10" />
        )}
        <div className="absolute top-2 left-2">
          <StatusPill status={run.status} />
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <div className="text-[12.5px] text-white/85 font-medium leading-snug">{run.title}</div>
        {run.description && (
          <div className="text-[11px] text-white/40 leading-relaxed line-clamp-2">
            {run.description}
          </div>
        )}
        <div className="flex items-center gap-3 pt-1 text-[9.5px] font-mono uppercase tracking-[0.12em] text-white/28">
          <span className="inline-flex items-center gap-1">
            <Layers size={9} />
            {run.itemCount} artifacts
          </span>
          <span className="inline-flex items-center gap-1">
            <Film size={9} />
            {run.finalCount} finals
          </span>
          <span className="inline-flex items-center gap-1 ml-auto">
            <Clock3 size={9} />
            {updated}
          </span>
        </div>
      </div>
    </a>
  );
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export { CopyLink };
