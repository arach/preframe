'use client';

import { useCallback, useEffect, useState } from 'react';

type Status = 'idle' | 'online' | 'offline' | 'starting';

export function RemotionStatusPill() {
  const [status, setStatus] = useState<Status>('idle');

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/remotion/status', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data.running ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  }, []);

  // Single check on mount
  useEffect(() => { check(); }, [check]);

  // Fast poll while starting — stops when online or after 90s
  useEffect(() => {
    if (status !== 'starting') return;
    const id = setInterval(async () => {
      const res = await fetch('/api/remotion/status', { cache: 'no-store' });
      const d = await res.json();
      if (d.running) setStatus('online');
    }, 1500);
    const giveUp = setTimeout(() => setStatus('offline'), 90_000);
    return () => { clearInterval(id); clearTimeout(giveUp); };
  }, [status]);

  const handleStart = async () => {
    setStatus('starting');
    await fetch('/api/remotion/start', { method: 'POST' });
  };

  if (status === 'idle') return null;

  if (status === 'online') {
    return (
      <a
        href="http://localhost:3000"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-emerald-400/60 hover:text-emerald-300/80 transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
        Remotion
      </a>
    );
  }

  if (status === 'starting') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-amber-400/60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse" />
        Starting…
      </div>
    );
  }

  // offline
  return (
    <button
      onClick={handleStart}
      className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-pink-300/50 hover:text-pink-200 border border-pink-400/15 hover:border-pink-400/30 rounded-sm transition-colors"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-pink-400/30" />
      Remotion · Start
    </button>
  );
}
