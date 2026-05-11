'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Clapperboard, Film, Layers3, MessageSquare, Play } from 'lucide-react';
import type {
  CommandOption,
  EmbedSurface,
  HudsonApp,
  SearchConfig,
  StatusColor,
} from 'hudsonkit';
import { resolveVideoSrc } from '@/lib/media';
import type { Video } from '@/lib/types';
import { CatalogProvider, useCatalog } from '../Provider';
import { usePlayer } from '../PlayerContext';

type PlayerView = 'watch' | 'review' | 'effects';

export const preframePlayerEmbedSurface: EmbedSurface = {
  id: 'player',
  name: 'Preframe Player',
  slot: PreframePlayerEmbedContent,
  sizing: { mode: 'responsive', aspectRatio: '16/9', minHeight: 520 },
  interactive: true,
  chromeless: false,
  themeMode: 'inherit',
};

export const preframePlayerEmbedApp: HudsonApp = {
  id: 'preframe-player',
  name: 'Preframe Player',
  description: 'Embeddable Preframe player with watch, review, and effects views',
  mode: 'panel',
  icon: <Film size={12} />,
  Provider: CatalogProvider,
  leftPanel: {
    title: 'Playlist',
    icon: <Clapperboard size={12} />,
  },
  rightPanel: {
    title: 'Surface',
    icon: <Layers3 size={12} />,
  },
  slots: {
    Content: PreframePlayerEmbedContent,
    LeftPanel: PreframePlayerEmbedLeftPanel,
    Inspector: PreframePlayerEmbedInspector,
  },
  hooks: {
    useCommands: usePlayerEmbedCommands,
    useStatus: usePlayerEmbedStatus,
    useSearch: usePlayerEmbedSearch,
    useNavCenter: usePlayerEmbedNavCenter,
    useNavActions: usePlayerEmbedNavActions,
    useLayoutMode: () => 'panel',
  },
  exports: {
    embeds: [preframePlayerEmbedSurface],
  },
};

function playableVideos(videos: Video[]): Video[] {
  return videos.filter(video => Boolean(resolveVideoSrc(video)));
}

function pickVideo(videos: Video[], selected: Video | null): Video | null {
  if (selected && resolveVideoSrc(selected)) return selected;
  return videos.find(video => video.stage === 'final') ?? videos[0] ?? null;
}

function useEmbedVideo() {
  const { data, filteredVideos, selectedVideo } = useCatalog();
  const videos = useMemo(
    () => playableVideos(filteredVideos.length ? filteredVideos : data?.videos ?? []),
    [data?.videos, filteredVideos],
  );
  const video = useMemo(() => pickVideo(videos, selectedVideo), [selectedVideo, videos]);
  const src = video ? resolveVideoSrc(video) : null;

  return { video, src, videos };
}

export function PreframePlayerEmbedContent() {
  const { loading } = useCatalog();
  const { video, src } = useEmbedVideo();
  const player = usePlayer();
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<PlayerView>('watch');
  const currentMedia = player.media;
  const loadMedia = player.loadMedia;
  const attachStage = player.attachStage;

  useEffect(() => {
    if (!video || !src) return;
    const current = currentMedia;
    if (current?.kind === 'video' && current.video.id === video.id) return;
    loadMedia({ kind: 'video', video, src });
  }, [currentMedia, loadMedia, src, video]);

  useEffect(() => {
    return attachStage(stageRef.current, { priority: 70, controls: true });
  }, [attachStage]);

  if (loading) {
    return (
      <EmbedCenter>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/25">
          Loading player surface
        </span>
      </EmbedCenter>
    );
  }

  if (!video || !src) {
    return (
      <EmbedCenter>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/25">
          No playable media
        </span>
      </EmbedCenter>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-black/20">
      <div className="shrink-0 border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-300/60">
              preframe.player
            </div>
            <h1 className="truncate text-[14px] font-medium text-white/90">{video.id}</h1>
          </div>
          <div className="flex items-center overflow-hidden rounded-sm border border-white/[0.08]">
            <ViewButton active={view === 'watch'} onClick={() => setView('watch')} icon={<Play size={11} />}>
              Watch
            </ViewButton>
            <ViewButton active={view === 'review'} onClick={() => setView('review')} icon={<MessageSquare size={11} />}>
              Review
            </ViewButton>
            <ViewButton active={view === 'effects'} onClick={() => setView('effects')} icon={<Layers3 size={11} />}>
              Effects
            </ViewButton>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]">
        <div className="min-h-0 p-4">
          <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(220px,0.35fr)] gap-4 max-[900px]:grid-cols-1">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-white/[0.08] bg-black">
              <div ref={stageRef} className="grid min-h-0 flex-1 place-items-center bg-black" />
            </div>
            <ViewPanel view={view} video={video} />
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.06] px-4 py-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
            <span className="text-emerald-300/70">enabled</span>
            <span>watch</span>
            <span>review</span>
            <span>effects</span>
            <span className="ml-auto text-white/25">AI revise/render held outside embed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  children,
  icon,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-8 items-center gap-1.5 border-r border-white/[0.08] px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors last:border-r-0 ${
        active
          ? 'bg-cyan-400/[0.1] text-cyan-200'
          : 'text-white/35 hover:bg-white/[0.04] hover:text-white/70'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ViewPanel({ view, video }: { view: PlayerView; video: Video }) {
  if (view === 'review') {
    return (
      <Panel title="Review">
        <Note time="00:14">Hold the beat before the UI transition.</Note>
        <Note time="00:18">Soften the motion into the frame detail.</Note>
        <Note time="general">Keep player controls readable before agent actions appear.</Note>
      </Panel>
    );
  }

  if (view === 'effects') {
    return (
      <Panel title="Effects">
        {['film grade', 'glass pass', 'scan pulse', 'lattice frame'].map((effect, index) => (
          <div
            key={effect}
            className={`rounded-sm border px-3 py-2 ${
              index === 0
                ? 'border-emerald-300/25 bg-emerald-300/[0.06] text-emerald-100/80'
                : 'border-white/[0.08] bg-white/[0.025] text-white/45'
            }`}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.16em]">{effect}</div>
            <div className="mt-1 text-[11px] text-white/35">
              Treatment pass for the same source clip.
            </div>
          </div>
        ))}
      </Panel>
    );
  }

  return (
    <Panel title="Watch">
      <Metric label="Source" value={video.app || 'Preframe'} />
      <Metric label="Stage" value={video.stage || 'source'} />
      <Metric label="Resolution" value={video.resolution || 'video'} />
      <Metric label="Duration" value={`${Math.round(video.duration || 0)}s`} />
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="min-h-0 overflow-auto rounded-sm border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">{title}</div>
      <div className="grid gap-2">{children}</div>
    </aside>
  );
}

function Note({ time, children }: { time: string; children: ReactNode }) {
  return (
    <div className="border-l border-cyan-300/35 pl-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200/70">{time}</div>
      <div className="mt-1 text-[12px] leading-relaxed text-white/55">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-white/[0.06] bg-black/20 px-3 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/28">{label}</span>
      <span className="truncate text-right font-mono text-[11px] text-white/65">{value}</span>
    </div>
  );
}

export function PreframePlayerEmbedLeftPanel() {
  const { openVideo } = useCatalog();
  const { video, videos } = useEmbedVideo();

  return (
    <div className="space-y-2 p-2">
      {videos.slice(0, 12).map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => openVideo(item.id)}
          className={`w-full rounded-sm border px-2.5 py-2 text-left transition-colors ${
            item.id === video?.id
              ? 'border-cyan-300/35 bg-cyan-300/[0.08] text-cyan-100/85'
              : 'border-white/[0.06] bg-white/[0.02] text-white/45 hover:border-white/[0.14] hover:text-white/75'
          }`}
        >
          <div className="truncate font-mono text-[10px] uppercase tracking-[0.12em]">{item.id}</div>
          <div className="mt-1 truncate text-[11px] text-white/30">{item.app || 'Preframe'}</div>
        </button>
      ))}
    </div>
  );
}

export function PreframePlayerEmbedInspector() {
  return (
    <div className="space-y-3 p-3">
      <InspectorSection title="Surface">
        <Metric label="id" value="player" />
        <Metric label="app" value="preframe-player" />
        <Metric label="sizing" value="responsive 16/9" />
      </InspectorSection>
      <InspectorSection title="Enabled">
        <Capability label="watch" active />
        <Capability label="review" active />
        <Capability label="effects" active />
        <Capability label="AI revise" />
        <Capability label="render queue" />
      </InspectorSection>
    </div>
  );
}

function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">{title}</div>
      <div className="grid gap-1.5">{children}</div>
    </section>
  );
}

function Capability({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      <span className={active ? 'text-emerald-300/70' : 'text-white/20'}>
        {active ? 'on' : 'off'}
      </span>
    </div>
  );
}

function usePlayerEmbedCommands(): CommandOption[] {
  const { setFilter } = useCatalog();
  return useMemo(
    () => [
      { id: 'embed:finals', label: 'Player: Final Clips', action: () => setFilter('final') },
      { id: 'embed:curated', label: 'Player: Curated Clips', action: () => setFilter('curated') },
      { id: 'embed:all', label: 'Player: All Clips', action: () => setFilter('all') },
    ],
    [setFilter],
  );
}

function usePlayerEmbedStatus(): { label: string; color: StatusColor } {
  const { loading } = useCatalog();
  const { videos } = useEmbedVideo();
  if (loading) return { label: 'loading player', color: 'amber' };
  return { label: `${videos.length} clips`, color: 'emerald' };
}

function usePlayerEmbedSearch(): SearchConfig {
  const { search, setSearch } = useCatalog();
  return {
    value: search,
    onChange: setSearch,
    placeholder: 'Search clips...',
  };
}

function usePlayerEmbedNavCenter(): ReactNode {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
      embed surface / player
    </span>
  );
}

function usePlayerEmbedNavActions(): ReactNode {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300/65">
      watch · review · effects
    </span>
  );
}

function EmbedCenter({ children }: { children: ReactNode }) {
  return <div className="grid h-full place-items-center bg-black/20">{children}</div>;
}
