'use client';

import { useState } from 'react';
import { ExternalLink, Layers } from 'lucide-react';
import { useCatalog } from '../Provider';
import { FramePreview } from './FramePreview';
import type { CompositionFrame } from '../../lib/types';

export function FramesView() {
  const { data } = useCatalog();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const frames = data?.frames ?? [];

  const selected = frames.find(f => f.id === selectedId) ?? null;
  if (selected) {
    return <FramePreview frame={selected} onBack={() => setSelectedId(null)} />;
  }

  if (!frames.length) {
    return (
      <div className="flex h-full items-center justify-center text-white/20 text-[12px] font-mono tracking-wider uppercase">
        No frames yet
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto frame-scrollbar p-6">
      <div className="mb-6">
        <h1 className="text-[13px] font-mono uppercase tracking-[0.15em] text-white/60 mb-1">Frames</h1>
        <p className="text-[11px] text-white/30">Reusable visual treatments applied on top of raw footage.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {frames.map(frame => (
          <FrameCard key={frame.id} frame={frame} onOpen={() => setSelectedId(frame.id)} />
        ))}
      </div>
    </div>
  );
}

function FrameCard({ frame, onOpen }: { frame: CompositionFrame; onOpen: () => void }) {
  const textSlots = frame.slots.filter(s => s.type === 'text' && s.required !== false);
  const boolSlots = frame.slots.filter(s => s.type === 'boolean');

  return (
    <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] hover:bg-white/[0.03] transition-colors p-4 cursor-pointer" onClick={onOpen}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] text-white/80 font-medium">{frame.name}</span>
            <EngineBadge engine={frame.engine} />
          </div>
          <div className="text-[10px] font-mono text-white/25">{frame.id}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          {frame.previewUrl && (
            <a
              href={frame.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/70 border border-white/[0.08] hover:border-white/20 rounded-sm transition-colors"
            >
              <ExternalLink size={10} />
              Preview
            </a>
          )}
          {frame.hyperframesPath && (
            <a
              href={`/composer?frame=${frame.id}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300/70 hover:text-cyan-200 border border-cyan-400/20 hover:border-cyan-400/40 rounded-sm transition-colors"
            >
              <Layers size={10} />
              Compose
            </a>
          )}
        </div>
      </div>

      {frame.description && (
        <p className="text-[11px] text-white/40 mb-3 leading-relaxed">{frame.description}</p>
      )}

      {frame.tags && frame.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {frame.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white/25 border border-white/[0.06] rounded-sm">
              {tag}
            </span>
          ))}
        </div>
      )}

      {frame.slots.length > 0 && (
        <div className="border-t border-white/[0.04] pt-3">
          <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/20 mb-2">
            {frame.slots.length} Slot{frame.slots.length !== 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            {textSlots.map(slot => (
              <SlotPill key={slot.key} label={slot.label} kind="text" />
            ))}
            {boolSlots.map(slot => (
              <SlotPill key={slot.key} label={slot.label} kind="toggle" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EngineBadge({ engine }: { engine: CompositionFrame['engine'] }) {
  if (engine === 'both') {
    return (
      <div className="flex gap-1">
        <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-emerald-300/70 border border-emerald-400/20 rounded-sm">HF</span>
        <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-pink-300/70 border border-pink-400/20 rounded-sm">Remotion</span>
      </div>
    );
  }
  if (engine === 'remotion') {
    return <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-pink-300/70 border border-pink-400/20 rounded-sm">Remotion</span>;
  }
  return <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-emerald-300/70 border border-emerald-400/20 rounded-sm">HyperFrames</span>;
}

function SlotPill({ label, kind }: { label: string; kind: 'text' | 'toggle' }) {
  return (
    <span className={`px-2 py-0.5 text-[9px] font-mono rounded-sm ${
      kind === 'text'
        ? 'text-sky-300/50 bg-sky-400/[0.06] border border-sky-400/15'
        : 'text-white/30 bg-white/[0.03] border border-white/[0.06]'
    }`}>
      {label}
    </span>
  );
}
