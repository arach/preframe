'use client';

import { useCallback, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import type { RunItemRole, RunStatus } from '../../lib/runs';

/**
 * Copy a Preframe path as an absolute URL against the current origin.
 *
 * Runs persist host-independent paths on purpose; the hostname is only ever
 * attached at the moment a human asks for a shareable link, which is why this
 * lives in the UI and not in the stored document.
 */
export function CopyLink({
  path,
  label = 'Copy link',
  compact = false,
}: {
  path: string;
  label?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    const url =
      typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [path]);

  return (
    <button
      type="button"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        void copy();
      }}
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded border transition-colors ${
        compact ? 'px-1.5 py-1' : 'px-2 py-1'
      } ${
        copied
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300/90'
          : 'border-white/[0.08] bg-white/[0.02] text-white/35 hover:text-cyan-200/90 hover:border-cyan-400/25'
      }`}
    >
      {copied ? <Check size={10} /> : <Link2 size={10} />}
      {!compact && (
        <span className="text-[9px] font-mono uppercase tracking-[0.12em]">
          {copied ? 'Copied' : 'Link'}
        </span>
      )}
    </button>
  );
}

const STATUS_TONE: Record<RunStatus, string> = {
  draft: 'border-white/[0.10] bg-white/[0.04] text-white/45',
  active: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200/85',
  review: 'border-amber-400/25 bg-amber-400/10 text-amber-200/85',
  delivered: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200/85',
  archived: 'border-white/[0.08] bg-white/[0.02] text-white/25',
};

export function StatusPill({ status }: { status: RunStatus }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[8.5px] font-mono uppercase tracking-[0.14em] ${
        STATUS_TONE[status] ?? STATUS_TONE.draft
      }`}
    >
      {status}
    </span>
  );
}

const ROLE_TONE: Partial<Record<RunItemRole, string>> = {
  final: 'text-emerald-300/70',
  variant: 'text-cyan-300/60',
  score: 'text-violet-300/65',
  source: 'text-white/40',
  composition: 'text-amber-300/60',
  logo: 'text-pink-300/60',
  validation: 'text-white/35',
};

export function RoleChip({ role }: { role: RunItemRole }) {
  return (
    <span
      className={`text-[8.5px] font-mono uppercase tracking-[0.16em] ${
        ROLE_TONE[role] ?? 'text-white/30'
      }`}
    >
      {role}
    </span>
  );
}

export function PendingChip() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-amber-400/25 bg-amber-400/[0.07] text-amber-200/80 text-[8.5px] font-mono uppercase tracking-[0.14em]">
      pending
    </span>
  );
}

export function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-white/[0.07] bg-white/[0.02] text-white/38 text-[9px] font-mono tracking-wide">
      {children}
    </span>
  );
}
