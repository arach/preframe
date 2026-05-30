'use client';

import { PlugZap, RotateCw } from 'lucide-react';
import { useCatalog } from '../Provider';

export function CatalogOffline() {
  const { serviceStatus, retry } = useCatalog();
  const checking = serviceStatus === 'checking';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white/40">
        <PlugZap size={20} />
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
          Preframe service unreachable
        </div>
        <p className="text-[13px] leading-relaxed text-white/60">
          The catalog backend at <span className="font-mono text-white/70">localhost:3100</span> isn&apos;t
          responding. Start it from <span className="font-mono text-white/70">~/dev/preframe</span> with{' '}
          <span className="font-mono text-white/70">bun dev</span>, then retry.
        </p>
      </div>

      <button
        type="button"
        onClick={retry}
        disabled={checking}
        className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCw size={12} className={checking ? 'animate-spin' : undefined} />
        {checking ? 'Checking…' : 'Retry'}
      </button>
    </div>
  );
}
