'use client';

import { useMemo, useState } from 'react';
import { Check, ClipboardCopy } from 'lucide-react';
import { useRun } from '../hooks/useRuns';
import { pathForRun } from '../lib/routes';
import { CopyLink, StatusPill } from './RunPrimitives';
import { bestItemHref, runHero, type Run, type RunItemRole } from '../../lib/runs';

/**
 * Right-panel context for a run: what it is made of, what is still missing, and
 * the handoff block an agent would paste at the end of a turn.
 */
export function RunInspector({ slug }: { slug: string }) {
  const { run } = useRun(slug);

  if (!run) {
    return (
      <div className="p-4 text-[11px] font-mono text-white/25">Loading run…</div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto frame-scrollbar p-4 gap-5">
      <Composition run={run} />
      <Links run={run} />
      <Handoff run={run} />
    </div>
  );
}

function Composition({ run }: { run: Run }) {
  const byRole = useMemo(() => {
    const counts = new Map<RunItemRole, number>();
    for (const item of run.items) counts.set(item.role, (counts.get(item.role) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [run.items]);

  const pending = run.items.filter(i => i.state !== 'ready').length;

  return (
    <div>
      <SectionLabel>Run</SectionLabel>
      <div className="flex items-center gap-2 mb-2">
        <StatusPill status={run.status} />
        <span className="text-[10px] font-mono text-white/25">{run.slug}</span>
      </div>
      <Row label="Artifacts" value={String(run.items.length)} />
      <Row label="Sections" value={String(run.groups.length)} />
      {pending > 0 && <Row label="Pending" value={String(pending)} tone="amber" />}

      <div className="mt-3">
        <SectionLabel>Composition</SectionLabel>
        {byRole.map(([role, count]) => (
          <Row key={role} label={role} value={String(count)} />
        ))}
      </div>
    </div>
  );
}

function Links({ run }: { run: Run }) {
  const hero = runHero(run);
  const score = run.items.find(i => i.role === 'score' && i.preferred);

  return (
    <div>
      <SectionLabel>Links</SectionLabel>
      <LinkRow label="Run" path={pathForRun(run.slug)} />
      {hero && <LinkRow label="Hero" path={bestItemHref(run, hero)} />}
      {score && <LinkRow label="Score" path={bestItemHref(run, score)} />}
      <LinkRow label="API" path={`/api/runs/${encodeURIComponent(run.slug)}`} />
    </div>
  );
}

/**
 * The exact block a coding agent should return when it finishes work on this
 * run — built from the same preferred-item rules the API uses.
 */
function Handoff({ run }: { run: Run }) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    const abs = (p: string) => `${origin}${p}`;
    const lines = [`Run: ${abs(pathForRun(run.slug))}`];
    for (const item of run.items) {
      if (!item.preferred) continue;
      if (item.role !== 'final' && item.role !== 'score') continue;
      lines.push(`${item.label}: ${abs(bestItemHref(run, item))}`);
    }
    return lines.join('\n');
  }, [run]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionLabel>Handoff</SectionLabel>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
            } catch {
              return;
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className={`inline-flex items-center gap-1 px-1.5 py-1 rounded border transition-colors ${
            copied
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300/90'
              : 'border-white/[0.08] bg-white/[0.02] text-white/35 hover:text-cyan-200/90 hover:border-cyan-400/25'
          }`}
          title="Copy handoff block"
        >
          {copied ? <Check size={10} /> : <ClipboardCopy size={10} />}
        </button>
      </div>
      <pre className="text-[9.5px] font-mono text-white/35 whitespace-pre-wrap break-all leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/25 mb-2">
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'amber';
}) {
  return (
    <div className="flex justify-between gap-3 py-0.5 text-[11px] font-mono">
      <span className="text-white/30 truncate">{label}</span>
      <span className={tone === 'amber' ? 'text-amber-300/80' : 'text-white/60'}>{value}</span>
    </div>
  );
}

function LinkRow({ label, path }: { label: string; path: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[11px] font-mono text-white/30 w-10 shrink-0">{label}</span>
      <span className="text-[10px] font-mono text-white/45 truncate flex-1" title={path}>
        {path}
      </span>
      <CopyLink path={path} label={`Copy ${label} link`} compact />
    </div>
  );
}
