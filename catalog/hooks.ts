'use client';

import { createElement, useMemo, type MouseEvent, type ReactNode } from 'react';
import type { CommandOption, SearchConfig, StatusColor } from 'hudsonkit';
import { useCatalog } from './Provider';

// ---------------------------------------------------------------------------
// useCommands — filters + navigation shortcuts
// ---------------------------------------------------------------------------
export function useCatalogCommands(): CommandOption[] {
  const { setFilter, closeVideo, videoId } = useCatalog();

  return useMemo<CommandOption[]>(
    () => [
      { id: 'filter:all', label: 'Show All Treatments', action: () => setFilter('all') },
      { id: 'filter:curated', label: 'Show Curated Snippets', action: () => setFilter('curated') },
      { id: 'filter:analyzed', label: 'Filter: Analyzed', action: () => setFilter('analyzed') },
      { id: 'filter:needs-work', label: 'Filter: Needs Work', action: () => setFilter('needs-work') },
      { id: 'filter:transcribed', label: 'Filter: Transcribed', action: () => setFilter('transcribed') },
      { id: 'filter:reel', label: 'Filter: Reel Candidates', action: () => setFilter('reel') },
      ...(videoId
        ? [{ id: 'nav:back', label: 'Back to Catalog', action: closeVideo, shortcut: 'Esc' }]
        : []),
    ],
    [setFilter, closeVideo, videoId],
  );
}

// ---------------------------------------------------------------------------
// useStatus — total count + state color
// ---------------------------------------------------------------------------
export function useCatalogStatus(): { label: string; color: StatusColor } {
  const { loading, filteredVideos, data, filter, filteredSnippets, view, serviceStatus } = useCatalog();
  if (serviceStatus === 'offline') return { label: 'offline', color: 'red' };
  if (serviceStatus === 'checking' || serviceStatus === 'unknown') return { label: 'connecting…', color: 'amber' };
  if (loading) return { label: 'loading…', color: 'amber' };
  if (filter === 'curated') {
    return { label: `${filteredSnippets.length} snippets`, color: 'emerald' };
  }
  if (view === 'assets') {
    const source = (data?.videos ?? []).filter(v => v.stage === 'source' || !v.stage);
    return { label: `${source.length} assets`, color: 'emerald' };
  }
  if (view === 'queue') {
    return { label: 'queue', color: 'emerald' };
  }
  if (view === 'runs') {
    return { label: 'runs', color: 'emerald' };
  }
  const finals = filteredVideos.filter(v => v.stage === 'final');
  return { label: `${finals.length} treatments`, color: 'emerald' };
}

// ---------------------------------------------------------------------------
// useSearch — nav-bar search input wiring
// ---------------------------------------------------------------------------
export function useCatalogSearch(): SearchConfig {
  const { search, setSearch } = useCatalog();
  return {
    value: search,
    onChange: setSearch,
    placeholder: 'Search treatments, assets, tags…',
  };
}

// ---------------------------------------------------------------------------
// useNavCenter — breadcrumb for view + detail
// ---------------------------------------------------------------------------
const VIEW_LABELS: Record<string, string> = {
  runs: 'Runs',
  queue: 'Queue',
  assets: 'Assets',
  music: 'Music',
  logos: 'Logos',
  frames: 'Frames',
  fx: 'FX Browser',
  prompts: 'Prompts',
  settings: 'Settings',
  new: 'New composition',
  'new-music': 'New music',
};

export function useCatalogNavCenter(): ReactNode | null {
  const { selectedVideo, closeVideo, view, setView, runSlug } = useCatalog();

  if (view === 'runs' && runSlug) {
    return createElement(
      'div',
      { className: 'flex items-center gap-1.5 min-w-0' },
      createElement(
        'a',
        {
          href: '/runs',
          onClick: (e: MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            setView('runs');
          },
          className:
            'text-[10px] font-mono text-neutral-400 hover:text-neutral-200 tracking-wider uppercase transition-colors shrink-0',
        },
        'Runs',
      ),
      createElement('span', { className: 'text-neutral-600 text-[10px] font-mono' }, '/'),
      createElement(
        'span',
        {
          className: 'text-[10px] font-mono text-neutral-300 tracking-wide truncate max-w-[28vw]',
          title: runSlug,
        },
        runSlug,
      ),
    );
  }

  if (selectedVideo) {
    const parent = view === 'assets' ? 'Assets' : 'Treatments';
    const parentHref = view === 'assets' ? '/assets' : '/treatments';
    return createElement(
      'div',
      { className: 'flex items-center gap-1.5 min-w-0' },
      createElement(
        'a',
        {
          href: parentHref,
          onClick: (e: MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            closeVideo();
          },
          className:
            'text-[10px] font-mono text-neutral-400 hover:text-neutral-200 tracking-wider uppercase transition-colors shrink-0',
        },
        parent,
      ),
      createElement('span', { className: 'text-neutral-600 text-[10px] font-mono' }, '/'),
      createElement(
        'span',
        {
          className: 'text-[10px] font-mono text-neutral-300 tracking-wide truncate max-w-[28vw]',
          title: selectedVideo.id,
        },
        selectedVideo.id,
      ),
    );
  }

  if (view && VIEW_LABELS[view]) {
    return createElement(
      'div',
      { className: 'flex items-center gap-1.5' },
      createElement(
        'a',
        {
          href: '/treatments',
          onClick: (e: MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            setView(null);
          },
          className:
            'text-[10px] font-mono text-neutral-500 hover:text-neutral-300 tracking-wider uppercase transition-colors',
        },
        'Preframe',
      ),
      createElement('span', { className: 'text-neutral-700 text-[10px] font-mono' }, '/'),
      createElement(
        'span',
        { className: 'text-[10px] font-mono text-neutral-300 tracking-wider uppercase' },
        VIEW_LABELS[view],
      ),
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// useNavActions — resolution/duration chip when in detail view
// ---------------------------------------------------------------------------
export function useCatalogNavActions(): ReactNode | null {
  const { selectedVideo } = useCatalog();
  if (!selectedVideo) return null;
  return createElement(
    'span',
    { className: 'text-[11px] font-mono text-neutral-400' },
    `${selectedVideo.resolution} · ${Math.round(selectedVideo.duration)}s`,
  );
}

// ---------------------------------------------------------------------------
// useLayoutMode
// ---------------------------------------------------------------------------
export function useCatalogLayoutMode(): 'canvas' | 'panel' {
  return 'panel';
}
