'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Code2,
  FileCode2,
  FileVideo,
  Film,
  FolderOpen,
  Gem,
  Inbox,
  LayoutTemplate,
  Music,
  Layers,
  Plus,
  Settings,
  Wand2,
} from 'lucide-react';
import { useCatalog } from '../Provider';
import { RemotionStatusPill } from './RemotionStatusPill';
import { formatDuration } from '../../lib/types';
import type { Video } from '../../lib/types';
import { apiClient } from '../lib/api-client';
import { pathForView } from '../lib/routes';

type NavId =
  | 'treatments'
  | 'queue'
  | 'assets'
  | 'music'
  | 'logos'
  | 'frames'
  | 'fx'
  | 'prompts'
  | 'settings'
  | 'new';

export function CatalogLeftPanel() {
  const {
    projectVideo,
    projectId,
    videoId,
    data,
    openProjectInput,
    closeProjectInput,
    setView,
    view,
    setPendingFiles,
  } = useCatalog();
  const [dragOver, setDragOver] = useState(false);
  const [queueBadge, setQueueBadge] = useState<{ running: number; failed: number }>({
    running: 0,
    failed: 0,
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const items = e.dataTransfer.items;
      const names: string[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) names.push(entry.name);
        else if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) names.push(file.name);
        }
      }
      if (names.length > 0) {
        setPendingFiles(names);
        setView('new');
      }
    },
    [setPendingFiles, setView],
  );

  // Light queue badge poll for nav affordances
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await apiClient.get('/api/jobs');
        if (!res.ok || cancelled) return;
        const jobs = (await res.json()) as Array<{ status?: string }>;
        if (!Array.isArray(jobs) || cancelled) return;
        setQueueBadge({
          running: jobs.filter(j => j.status === 'running').length,
          failed: jobs.filter(j => j.status === 'failed').length,
        });
      } catch {
        /* offline */
      }
    };
    void tick();
    const id = setInterval(tick, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const assetsNeeds = useMemo(() => {
    const source = (data?.videos ?? []).filter(v => v.stage === 'source' || !v.stage);
    return source.filter(
      v => !v.analysisStatus || v.analysisStatus === 'none' || v.analysisStatus === 'frames-only',
    ).length;
  }, [data]);

  if (projectVideo) {
    return (
      <ProjectPanel
        project={projectVideo}
        allVideos={data?.videos ?? []}
        isViewingInput={videoId !== projectId}
        onOpenInput={openProjectInput}
        onBackToProject={closeProjectInput}
        onExitProject={() => {
          closeProjectInput();
          setView(null);
        }}
      />
    );
  }

  const active: NavId =
    view === 'queue'
      ? 'queue'
      : view === 'assets'
        ? 'assets'
        : view === 'music'
          ? 'music'
          : view === 'logos'
            ? 'logos'
            : view === 'frames'
              ? 'frames'
              : view === 'fx'
                ? 'fx'
                : view === 'prompts'
                  ? 'prompts'
                  : view === 'settings'
                    ? 'settings'
                    : view === 'new' || view === 'new-music'
                      ? 'new'
                      : 'treatments'; // view null | treatments

  const queueBadgeLabel =
    queueBadge.running > 0
      ? String(queueBadge.running)
      : queueBadge.failed > 0
        ? String(queueBadge.failed)
        : undefined;
  const queueBadgeTone: BadgeTone | undefined =
    queueBadge.running > 0 ? 'amber' : queueBadge.failed > 0 ? 'red' : undefined;

  return (
    <div className="flex flex-col h-full py-3 select-none">
      {/* Brand / home */}
      <div className="px-3 mb-3">
        <a
          href={pathForView(null)}
          onClick={e => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            setView(null);
          }}
          className="block w-full text-left px-1 py-0.5 rounded-sm hover:bg-white/[0.03] transition-colors"
          title="Treatments"
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Preframe</div>
          <div className="text-[11px] text-white/55 mt-0.5 truncate">stage · review · ship</div>
        </a>
      </div>

      {/* Primary create */}
      <div className="px-3 mb-4">
        <a
          href={pathForView('new')}
          onClick={e => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            setView('new');
          }}
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full flex items-center justify-center gap-2 px-2.5 py-2.5 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all border ${
            dragOver
              ? 'bg-cyan-400/[0.18] border-cyan-400/50 text-cyan-100 scale-[1.01] shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
              : active === 'new'
                ? 'bg-cyan-400/[0.14] border-cyan-400/40 text-cyan-100'
                : 'bg-cyan-400/[0.07] border-cyan-400/20 text-cyan-200/90 hover:bg-cyan-400/[0.12] hover:border-cyan-400/35 hover:text-cyan-100'
          }`}
        >
          <Plus size={13} strokeWidth={2.25} />
          {dragOver ? 'Drop to compose' : 'New composition'}
        </a>
      </div>

      <nav className="flex flex-col gap-4 px-2 flex-1 min-h-0 overflow-y-auto frame-scrollbar">
        <NavSection label="Library">
          <NavItem
            icon={<Film size={14} />}
            label="Treatments"
            active={active === 'treatments'}
            href={pathForView(null)}
            onClick={() => setView(null)}
          />
          <NavItem
            icon={<Inbox size={14} />}
            label="Queue"
            active={active === 'queue'}
            href={pathForView('queue')}
            onClick={() => setView('queue')}
            badge={queueBadgeLabel}
            badgeTone={queueBadgeTone}
          />
          <NavItem
            icon={<FolderOpen size={14} />}
            label="Assets"
            active={active === 'assets'}
            href={pathForView('assets')}
            onClick={() => setView('assets')}
            badge={assetsNeeds > 0 ? String(assetsNeeds) : undefined}
            badgeTone={assetsNeeds > 0 ? 'amber' : undefined}
            hint={assetsNeeds > 0 ? `${assetsNeeds} need analysis` : undefined}
          />
        </NavSection>

        <NavSection label="Studio">
          <NavItem
            icon={<Music size={14} />}
            label="Music"
            active={active === 'music'}
            href={pathForView('music')}
            onClick={() => setView('music')}
          />
          <NavItem
            icon={<Gem size={14} />}
            label="Logos"
            active={active === 'logos'}
            href={pathForView('logos')}
            onClick={() => setView('logos')}
          />
          <NavItem
            icon={<LayoutTemplate size={14} />}
            label="Frames"
            active={active === 'frames'}
            href={pathForView('frames')}
            onClick={() => setView('frames')}
          />
          <NavItem
            icon={<Wand2 size={14} />}
            label="FX Browser"
            active={active === 'fx'}
            href={pathForView('fx')}
            onClick={() => setView('fx')}
          />
          <NavItem
            icon={<BookOpen size={14} />}
            label="Prompts"
            active={active === 'prompts'}
            href={pathForView('prompts')}
            onClick={() => setView('prompts')}
          />
        </NavSection>
      </nav>

      <div className="px-2 pt-2 mt-1 border-t border-white/[0.05]">
        <div className="px-1 pb-2">
          <RemotionStatusPill />
        </div>
        <NavItem
          icon={<Settings size={14} />}
          label="Settings"
          active={active === 'settings'}
          href={pathForView('settings')}
          onClick={() => setView('settings')}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nav primitives
// ---------------------------------------------------------------------------

function NavSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-2.5 pb-1 text-[9px] font-mono uppercase tracking-[0.16em] text-white/22">
        {label}
      </div>
      {children}
    </div>
  );
}

type BadgeTone = 'amber' | 'red' | 'cyan' | 'neutral';

function NavItem({
  icon,
  label,
  active,
  href,
  onClick,
  badge,
  badgeTone = 'neutral',
  hint,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  href: string;
  onClick: () => void;
  badge?: string;
  badgeTone?: BadgeTone;
  hint?: string;
}) {
  const badgeCls =
    badgeTone === 'amber'
      ? 'bg-amber-400/15 text-amber-300/90 border-amber-400/25'
      : badgeTone === 'red'
        ? 'bg-red-400/15 text-red-300/90 border-red-400/25'
        : badgeTone === 'cyan'
          ? 'bg-cyan-400/15 text-cyan-300/90 border-cyan-400/25'
          : 'bg-white/[0.06] text-white/50 border-white/[0.08]';

  return (
    <a
      href={href}
      onClick={e => {
        // Allow open-in-new-tab / modified clicks to use the real URL
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onClick();
      }}
      title={hint || label}
      aria-current={active ? 'page' : undefined}
      className={`group relative w-full flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-md text-[12px] transition-all ${
        active
          ? 'bg-white/[0.07] text-white/95 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
          : 'text-white/42 hover:bg-white/[0.035] hover:text-white/72'
      }`}
    >
      {/* Active rail */}
      <span
        className={`absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full transition-opacity ${
          active ? 'bg-cyan-400/80 opacity-100' : 'bg-transparent opacity-0 group-hover:opacity-40 group-hover:bg-white/20'
        }`}
      />
      <span className={`shrink-0 transition-colors ${active ? 'text-cyan-300/85' : 'text-white/28 group-hover:text-white/45'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left truncate tracking-wide">{label}</span>
      {badge != null && (
        <span
          className={`min-w-[1.25rem] h-4 px-1 inline-flex items-center justify-center rounded text-[9px] font-mono tabular-nums border ${badgeCls}`}
        >
          {badge}
        </span>
      )}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Project panel — anchored to the project video
// ---------------------------------------------------------------------------

function ProjectPanel({
  project,
  allVideos,
  isViewingInput,
  onOpenInput,
  onBackToProject,
  onExitProject,
}: {
  project: Video;
  allVideos: Video[];
  isViewingInput: boolean;
  onOpenInput: (id: string) => void;
  onBackToProject: () => void;
  onExitProject: () => void;
}) {
  const { openFile } = useCatalog();
  const isFinal = project.stage === 'final';
  const compositionId = isFinal ? inferComposition(project) : null;
  const codePath = compositionId ? inferCodePath(compositionId) : null;

  const sourceVideos = useMemo(() => {
    if (!project.app || project.app === 'other') return [];
    return allVideos
      .filter(v => v.app === project.app && (v.stage === 'source' || !v.stage) && v.id !== project.id)
      .slice(0, 12);
  }, [allVideos, project.app, project.id]);

  const audioFiles = useMemo(() => {
    if (!compositionId) return [];
    const lower = compositionId.toLowerCase();
    const tracks: string[] = [];
    if (lower.includes('hud') || lower.includes('hudson')) tracks.push('tracks/futuristic-synthwave.mp3');
    if (lower.includes('mj') || lower.includes('midjourney')) tracks.push('tracks/futuristic-synthwave.mp3');
    if (lower.includes('talkie')) tracks.push('tracks/frequency-synthwave.mp3');
    return [...new Set(tracks)];
  }, [compositionId]);

  const siblings = useMemo(() => {
    return allVideos
      .filter(v => v.app === project.app && v.stage === project.stage && v.id !== project.id)
      .slice(0, 8);
  }, [allVideos, project.app, project.stage, project.id]);

  return (
    <div className="flex flex-col h-full overflow-y-auto frame-scrollbar py-2">
      <div className="px-3 mb-2">
        <button
          type="button"
          onClick={onExitProject}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-white/35 hover:text-white/60 transition-colors"
        >
          <ArrowLeft size={10} />
          All treatments
        </button>
      </div>

      {/* Project header */}
      <div className="px-3 py-2 mb-1">
        <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/25 mb-1">Project</div>
        <div className="text-[12px] text-white/80 font-medium truncate">{project.id}</div>
        <div className="text-[10px] font-mono text-white/30 mt-0.5">
          {project.app} · {project.stage} · {formatDuration(project.duration)}
        </div>
      </div>

      {/* Back to project button */}
      {isViewingInput && (
        <div className="px-3 mb-2">
          <button
            type="button"
            onClick={onBackToProject}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300/80 hover:text-cyan-200 bg-cyan-400/[0.04] hover:bg-cyan-400/[0.08] border border-cyan-400/15 rounded-md transition-colors"
          >
            <ArrowLeft size={10} />
            Back to {project.id}
          </button>
        </div>
      )}

      {/* Code */}
      {isFinal && compositionId && (
        <div className="mt-2">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white/25 flex items-center gap-1.5">
            <Code2 size={10} />
            Code
          </div>
          <div className="px-3 py-1">
            <div className="text-[11px] text-white/60 font-mono truncate mb-0.5">{compositionId}</div>
            {codePath && (
              <button
                type="button"
                onClick={() => {
                  const path = codePath.endsWith('/') ? codePath + 'index.tsx' : codePath;
                  openFile(path);
                }}
                className="flex items-center gap-1 text-[10px] text-cyan-400/50 hover:text-cyan-300 font-mono transition-colors"
              >
                <FileCode2 size={9} />
                <span className="truncate">{codePath}</span>
                <ChevronRight size={9} className="shrink-0" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Source videos */}
      {sourceVideos.length > 0 && (
        <div className="mt-3">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white/25 flex items-center gap-1.5">
            <FileVideo size={10} />
            Source Videos · {sourceVideos.length}
          </div>
          {sourceVideos.map(v => (
            <InputRow key={v.id} label={v.id} meta={formatDuration(v.duration)} onClick={() => onOpenInput(v.id)} />
          ))}
        </div>
      )}

      {/* Audio */}
      {audioFiles.length > 0 && (
        <div className="mt-3">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white/25 flex items-center gap-1.5">
            <Music size={10} />
            Audio
          </div>
          {audioFiles.map(f => (
            <div key={f} className="px-3 py-1.5 text-[10px] font-mono text-white/40 truncate">
              {f}
            </div>
          ))}
        </div>
      )}

      {/* Related */}
      {siblings.length > 0 && (
        <div className="mt-3">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white/25 flex items-center gap-1.5">
            <Layers size={10} />
            Related · {siblings.length}
          </div>
          {siblings.map(v => (
            <InputRow key={v.id} label={v.id} meta={formatDuration(v.duration)} onClick={() => onOpenInput(v.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function InputRow({ label, meta, onClick }: { label: string; meta: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/[0.03] rounded-sm transition-colors"
    >
      <span className="text-[11px] text-white/50 truncate flex-1">{label}</span>
      <span className="text-[9px] font-mono text-white/20 shrink-0">{meta}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferComposition(video: Video): string | null {
  if (video.composition) return video.composition;
  if (!video.videoUrl) return null;
  const filename = video.videoUrl.split('/').pop();
  if (!filename) return null;
  return filename.replace(/\.mp4$/i, '');
}

function inferCodePath(compositionId: string): string | null {
  const lower = compositionId.toLowerCase();
  if (lower.includes('audit')) return 'src/projects/audit-demo/AuditDemo.tsx';
  if (lower.includes('hostai')) return 'src/projects/hostai-montage/HostAIMontage.tsx';
  if (lower.includes('hudsonhighlight') || lower.includes('hudson-highlight'))
    return 'src/projects/hudson-highlight/HudsonHighlightReel.tsx';
  if (lower.includes('lattices')) return 'src/projects/lattices-highlight/LatticesUIHighlight.tsx';
  if (lower.includes('hud')) return 'src/HUDExperimentVideo.tsx';
  if (lower.includes('amp') || lower.includes('amplink')) return 'src/DemoVideo.tsx';
  if (lower.includes('scout')) return 'src/FullVideo.tsx';
  if (lower.includes('talkie')) return 'src/TalkieThumbnail.tsx';
  if (lower.includes('quote')) return 'src/QuoteVideo.tsx';
  if (lower.includes('montage')) return 'src/VideoMontage.tsx';
  return 'src/Root.tsx';
}
