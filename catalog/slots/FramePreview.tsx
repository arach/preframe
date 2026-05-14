'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Play, Pause, Square } from 'lucide-react';
import { useCatalog } from '../Provider';
import type { CompositionFrame } from '../../lib/types';
import { apiClient } from '../lib/api-client';

// ---------------------------------------------------------------------------
// Spec shape matching composition-frame.html
// ---------------------------------------------------------------------------
interface OverlaySpec {
  brackets:   { enabled: boolean; color: string; opacity: number; edges: boolean };
  caption:    { enabled: boolean; text: string; accent: boolean };
  lowerThird: { enabled: boolean; title: string; subtitle: string };
  tagline:    { enabled: boolean; text: string };
  grid:       { enabled: boolean };
  safeArea:   { enabled: boolean };
  timecode:   { enabled: boolean };
  labels:     Array<{ enabled: boolean; text: string; pos: string }>;
}

function defaultSpec(): OverlaySpec {
  return {
    brackets:   { enabled: true, color: '#4ade80', opacity: 0.85, edges: false },
    caption:    { enabled: false, text: '', accent: true },
    lowerThird: { enabled: false, title: '', subtitle: '' },
    tagline:    { enabled: false, text: '' },
    grid:       { enabled: false },
    safeArea:   { enabled: false },
    timecode:   { enabled: false },
    labels:     [],
  };
}

// ---------------------------------------------------------------------------

interface FramePreviewProps {
  frame: CompositionFrame;
  onBack: () => void;
}

export function FramePreview({ frame, onBack }: FramePreviewProps) {
  const { data } = useCatalog();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [spec, setSpec] = useState<OverlaySpec>(defaultSpec);
  const [videoSrc, setVideoSrc] = useState('');
  const [playing, setPlaying] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['brackets', 'lowerThird']));
  const [remotionUp, setRemotionUp] = useState<boolean | null>(null);

  const videos = (data?.videos ?? []).filter(v => v.videoUrl);

  // One-time Remotion server check
  useEffect(() => {
    if (frame.engine !== 'remotion' && frame.engine !== 'both') return;
    apiClient.get('/api/remotion/status', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setRemotionUp(d.running))
      .catch(() => setRemotionUp(false));
  }, [frame.engine]);

  const startRemotion = async () => {
    setRemotionUp(null); // "starting" state
    await apiClient.post('/api/remotion/start');
    // Poll until up
    const poll = setInterval(async () => {
      const r = await apiClient.get('/api/remotion/status', { cache: 'no-store' });
      const d = await r.json();
      if (d.running) { setRemotionUp(true); clearInterval(poll); }
    }, 1500);
    setTimeout(() => clearInterval(poll), 60_000);
  };

  // Post spec to overlay whenever spec or iframe readiness changes
  const pushSpec = useCallback((s: OverlaySpec, animate = true) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'composition-spec', spec: JSON.parse(JSON.stringify(s)), animate },
      '*',
    );
  }, []);

  useEffect(() => {
    if (iframeReady) pushSpec(spec, false);
  }, [iframeReady, spec, pushSpec]);

  // Auto-select first video
  useEffect(() => {
    if (!videoSrc && videos.length) setVideoSrc(videos[0].videoUrl!);
  }, [videos, videoSrc]);

  // Sync video playback
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = videoSrc;
    v.load();
    if (playing) v.play().catch(() => {});
  }, [videoSrc]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play().catch(() => {}); setPlaying(true); }
  };

  const patchSpec = useCallback(<K extends keyof OverlaySpec>(
    zone: K,
    patch: Partial<OverlaySpec[K]>,
  ) => {
    setSpec(prev => {
      const next = { ...prev, [zone]: { ...prev[zone], ...patch } } as OverlaySpec;
      pushSpec(next);
      return next;
    });
  }, [pushSpec]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isOpen = (id: string) => openSections.has(id);

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
        >
          <ArrowLeft size={11} />
          Frames
        </button>
        <span className="text-white/10">/</span>
        <span className="text-[11px] font-mono text-white/60">{frame.name}</span>
        <EngineBadge engine={frame.engine} />
      </div>

      {/* Body: preview + controls */}
      <div className="flex flex-1 min-h-0">
        {/* Preview pane */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#080808] p-6 gap-4">
          <div className="relative w-full max-w-3xl">
            <div className="relative aspect-video w-full bg-black rounded-sm overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                loop
                playsInline
              />
              {frame.hyperframesPath ? (
                <iframe
                  ref={iframeRef}
                  src={frame.hyperframesPath}
                  className="absolute inset-0 w-full h-full border-0 bg-transparent pointer-events-none"
                  onLoad={() => {
                    setIframeReady(false);
                    setTimeout(() => setIframeReady(true), 300);
                  }}
                  allow="autoplay"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : frame.remotionComponent ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-pink-300/40">{frame.remotionComponent}</span>
                  {remotionUp === true && (
                    <a
                      href={`http://localhost:3000/#/comp/${frame.remotionComponent}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-pink-300/70 border border-pink-400/20 hover:border-pink-400/40 hover:text-pink-200 rounded-sm transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400/60" />
                      Open in Remotion Studio →
                    </a>
                  )}
                  {remotionUp === false && (
                    <button
                      onClick={startRemotion}
                      className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/70 border border-white/10 hover:border-white/25 rounded-sm transition-colors"
                    >
                      Remotion offline — Start Studio
                    </button>
                  )}
                  {remotionUp === null && (
                    <span className="text-[10px] font-mono text-amber-400/50 animate-pulse">Starting…</span>
                  )}
                </div>
              ) : null}
            </div>

            {/* Playback bar */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={togglePlay}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/70 border border-white/[0.08] hover:border-white/20 rounded-sm transition-colors"
              >
                {playing ? <Pause size={10} /> : <Play size={10} />}
                {playing ? 'Pause' : 'Play'}
              </button>
              {playing && (
                <button
                  onClick={() => { videoRef.current?.pause(); videoRef.current && (videoRef.current.currentTime = 0); setPlaying(false); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white/30 hover:text-white/50 border border-white/[0.06] rounded-sm transition-colors"
                >
                  <Square size={9} />
                  Stop
                </button>
              )}
              <div className="flex-1" />
              <select
                value={videoSrc}
                onChange={e => { setVideoSrc(e.target.value); setPlaying(false); }}
                className="text-[10px] font-mono text-white/40 bg-transparent border border-white/[0.06] rounded-sm px-2 py-1 max-w-[200px] truncate"
              >
                <option value="">— no video —</option>
                {videos.map(v => (
                  <option key={v.id} value={v.videoUrl!}>{v.id}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Controls pane */}
        <div className="w-72 border-l border-white/[0.06] overflow-y-auto frame-scrollbar shrink-0">
          <div className="p-4 flex flex-col gap-1">

            <Section id="brackets" label="Corner Brackets" active={spec.brackets.enabled} open={isOpen('brackets')} onToggle={() => toggleSection('brackets')}
              onEnable={() => patchSpec('brackets', { enabled: !spec.brackets.enabled })}>
              <div className="flex flex-col gap-2.5 py-2">
                <SlotRow label="Color">
                  <input
                    type="color"
                    value={spec.brackets.color}
                    onChange={e => patchSpec('brackets', { color: e.target.value })}
                    className="w-8 h-6 rounded-sm border border-white/10 bg-transparent cursor-pointer"
                  />
                </SlotRow>
                <SlotRow label="Opacity">
                  <input
                    type="range" min="0.1" max="1" step="0.05"
                    value={spec.brackets.opacity}
                    onChange={e => patchSpec('brackets', { opacity: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-400"
                  />
                  <span className="text-[9px] font-mono text-white/30 w-6 text-right shrink-0">{Math.round(spec.brackets.opacity * 100)}</span>
                </SlotRow>
                <Toggle label="Connect edges" value={spec.brackets.edges} onChange={v => patchSpec('brackets', { edges: v })} />
              </div>
            </Section>

            <Section id="caption" label="Caption" active={spec.caption.enabled} open={isOpen('caption')} onToggle={() => toggleSection('caption')}
              onEnable={() => patchSpec('caption', { enabled: !spec.caption.enabled })}>
              <textarea
                rows={2}
                value={spec.caption.text}
                onChange={e => patchSpec('caption', { text: e.target.value, enabled: e.target.value.length > 0 || spec.caption.enabled })}
                placeholder="Caption text…"
                className="w-full mt-2 bg-white/[0.04] border border-white/[0.08] rounded-sm px-2 py-1.5 text-[11px] text-white/70 placeholder:text-white/20 resize-none outline-none focus:border-white/20"
              />
            </Section>

            <Section id="lowerThird" label="Lower Third" active={spec.lowerThird.enabled} open={isOpen('lowerThird')} onToggle={() => toggleSection('lowerThird')}
              onEnable={() => patchSpec('lowerThird', { enabled: !spec.lowerThird.enabled })}>
              <div className="flex flex-col gap-2 mt-2">
                <input
                  value={spec.lowerThird.title}
                  onChange={e => patchSpec('lowerThird', { title: e.target.value, enabled: e.target.value.length > 0 || spec.lowerThird.enabled })}
                  placeholder="Title…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-2 py-1.5 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-white/20"
                />
                <input
                  value={spec.lowerThird.subtitle}
                  onChange={e => patchSpec('lowerThird', { subtitle: e.target.value })}
                  placeholder="Subtitle or role…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-2 py-1.5 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-white/20"
                />
              </div>
            </Section>

            <Section id="tagline" label="Tagline" active={spec.tagline.enabled} open={isOpen('tagline')} onToggle={() => toggleSection('tagline')}
              onEnable={() => patchSpec('tagline', { enabled: !spec.tagline.enabled })}>
              <input
                value={spec.tagline.text}
                onChange={e => patchSpec('tagline', { text: e.target.value, enabled: e.target.value.length > 0 || spec.tagline.enabled })}
                placeholder="e.g. STUDIO  ·  v1.0"
                className="w-full mt-2 bg-white/[0.04] border border-white/[0.08] rounded-sm px-2 py-1.5 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-white/20"
              />
            </Section>

            <div className="flex flex-col gap-1 pt-2 border-t border-white/[0.04] mt-1">
              <Toggle label="Grid" value={spec.grid.enabled} onChange={v => patchSpec('grid', { enabled: v })} />
              <Toggle label="Safe Area" value={spec.safeArea.enabled} onChange={v => patchSpec('safeArea', { enabled: v })} />
              <Toggle label="Timecode" value={spec.timecode.enabled} onChange={v => patchSpec('timecode', { enabled: v })} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
  id, label, active, open, onToggle, onEnable, children,
}: {
  id: string; label: string; active: boolean; open: boolean;
  onToggle: () => void; onEnable: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/[0.05] rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-2.5 py-2 bg-white/[0.02]">
        <button onClick={onEnable} className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-emerald-400/20 border-emerald-400/40' : 'border-white/[0.12]'}`}>
          {active && <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400/80" />}
        </button>
        <span className={`flex-1 text-[11px] font-mono uppercase tracking-wider transition-colors ${active ? 'text-white/70' : 'text-white/30'}`}>{label}</span>
        <button onClick={onToggle} className="text-white/20 hover:text-white/50 transition-colors">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

function SlotRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-white/30 w-14 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-1">{children}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-2.5 px-2.5 py-1.5 text-left hover:bg-white/[0.03] rounded-sm transition-colors w-full"
    >
      <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${value ? 'bg-emerald-400/20 border-emerald-400/40' : 'border-white/[0.12]'}`}>
        {value && <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400/80" />}
      </span>
      <span className={`text-[11px] font-mono transition-colors ${value ? 'text-white/60' : 'text-white/30'}`}>{label}</span>
    </button>
  );
}

function EngineBadge({ engine }: { engine: CompositionFrame['engine'] }) {
  if (engine === 'remotion') return <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-pink-300/70 border border-pink-400/20 rounded-sm">Remotion</span>;
  if (engine === 'both') return <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-sky-300/70 border border-sky-400/20 rounded-sm">Both</span>;
  return <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-emerald-300/70 border border-emerald-400/20 rounded-sm">HyperFrames</span>;
}
