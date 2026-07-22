'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  CatalogData,
  CuratedSnippet,
  CuratedSnippetsData,
  Video,
} from '../lib/types';
import { ReviewProvider } from './ReviewContext';
import { FxProvider } from './FxContext';
import { PlayerProvider } from './PlayerContext';
import { apiClient, checkHealth } from './lib/api-client';
import {
  collectionForVideo,
  isCatalogPathname,
  parseCatalogRoute,
  pathForResource,
  pathForView,
  stripLegacyDetailParams,
  withListQuery,
} from './lib/routes';

export type ServiceStatus = 'unknown' | 'checking' | 'online' | 'offline';

const OFFLINE_BACKOFF_MS = [5_000, 10_000, 20_000, 30_000] as const;

// ---------------------------------------------------------------------------
// Lightbox state — transient UI, not URL-backed
// ---------------------------------------------------------------------------
export interface LightboxState {
  src: string;
  time: string;
  desc: string;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------
export interface CatalogContextValue {
  // Loaded data
  data: CatalogData | null;
  snippets: CuratedSnippet[];
  loading: boolean;

  // Service availability
  serviceStatus: ServiceStatus;
  retry: () => void;

  // URL-backed state
  filter: string;
  setFilter: (f: string) => void;
  search: string;
  setSearch: (q: string) => void;
  videoId: string | null;
  openVideo: (id: string) => void;
  closeVideo: () => void;
  frameIndex: number | null;
  openFrame: (idx: number) => void;
  closeFrame: () => void;
  reviewOpen: boolean;
  openReview: () => void;
  closeReview: () => void;
  snippetCategory: string;
  setSnippetCategory: (c: string) => void;
  sort: string;
  setSort: (s: string) => void;

  // Project context — anchors left panel to a "project" video
  projectId: string | null;
  projectVideo: Video | null;
  openProjectInput: (id: string) => void;
  closeProjectInput: () => void;

  // Derived
  selectedVideo: Video | null;
  filteredVideos: Video[];
  filteredSnippets: CuratedSnippet[];
  appBreakdown: Record<string, number>;
  counts: {
    total: number;
    source: number;
    wip: number;
    final: number;
    analyzed: number;
    needsWork: number;
    transcribed: number;
    reel: number;
    curated: number;
    orphans: number;
  };
  snippetCategoryCounts: Record<string, number>;

  // Actions
  refreshCatalog: () => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  deleteAudio: (id: string) => Promise<void>;

  // Pending music generations (fire-and-forget tracking)
  pendingMusicCount: number;
  notifyMusicQueued: () => void;
  notifyMusicSettled: () => void;

  // View state
  view: string | null;
  setView: (v: string | null) => void;
  pendingFiles: string[];
  setPendingFiles: (files: string[]) => void;

  // Code viewer (transient)
  viewingFile: string | null;
  openFile: (path: string) => void;
  closeFile: () => void;

  // Lightbox (transient)
  lightbox: LightboxState | null;
  openLightbox: (s: LightboxState) => void;
  closeLightbox: () => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export interface CatalogProviderProps {
  children: ReactNode;
  /** Sync view state to URL pathname. Default: auto-detect (true if pathname matches a known view). */
  standalone?: boolean;
}

export function CatalogProvider({ children, standalone }: CatalogProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Path is source of truth for view + resource identity
  const route = useMemo(() => parseCatalogRoute(pathname), [pathname]);
  const isStandalone = standalone ?? isCatalogPathname(pathname);

  const [viewState, setViewState] = useState<string | null>(isStandalone ? route.view : null);
  const view = isStandalone ? route.view : viewState;

  // Resource ids from path (RESTful); fall back to legacy query during rewrite
  const legacyVideo = searchParams.get('video');
  const legacyProject = searchParams.get('project');
  const legacyFrame = searchParams.get('frame');
  const legacyReview = searchParams.get('review') === '1';

  const videoId = route.videoId ?? legacyVideo;
  const projectId = route.projectId ?? legacyProject ?? (route.collection === 'treatments' ? route.videoId : null);
  const frameIndex =
    route.frameIndex ??
    (legacyFrame != null && legacyFrame !== '' && !Number.isNaN(Number(legacyFrame))
      ? Number(legacyFrame)
      : null);
  const reviewOpen = route.review || legacyReview;

  const setView = useCallback(
    (v: string | null) => {
      if (!isStandalone) {
        setViewState(v);
        return;
      }
      const target = pathForView(v);
      if (pathname === target) return;
      router.push(target);
    },
    [isStandalone, pathname, router],
  );

  // --- List query params ---
  const filter = searchParams.get('filter') ?? 'all';
  const search = searchParams.get('q') ?? '';
  const snippetCategory = searchParams.get('category') ?? 'all';
  const sort = searchParams.get('sort') ?? 'newest';

  const writeParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = stripLegacyDetailParams(searchParams);
      mutate(params);
      const qs = params.toString();
      // replace: filter/search tweaks shouldn't spam history
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const navigatePath = useCallback(
    (path: string, mode: 'push' | 'replace' = 'push') => {
      const url = withListQuery(path, stripLegacyDetailParams(searchParams));
      if (mode === 'replace') router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router, searchParams],
  );

  const setFilter = useCallback(
    (f: string) => {
      writeParams(p => {
        if (f === 'all') p.delete('filter');
        else p.set('filter', f);
        if (f !== 'curated') p.delete('category');
      });
    },
    [writeParams],
  );

  const setSearch = useCallback(
    (q: string) => {
      writeParams(p => {
        if (!q) p.delete('q');
        else p.set('q', q);
      });
    },
    [writeParams],
  );

  // data ref for openVideo path resolution without stale closures / dep churn
  const dataRef = useRef<CatalogData | null>(null);

  const openVideo = useCallback(
    (id: string) => {
      const video = dataRef.current?.videos.find(v => v.id === id);
      const collection = isStandalone
        ? collectionForVideo(view, video?.stage)
        : (route.collection ?? 'treatments');

      navigatePath(
        pathForResource({ collection, id }),
        'push',
      );
    },
    [isStandalone, navigatePath, route.collection, view],
  );

  const closeVideo = useCallback(() => {
    // Return to collection list
    const list =
      route.collection === 'assets' || view === 'assets'
        ? pathForView('assets')
        : pathForView(null);
    navigatePath(list, 'push');
  }, [navigatePath, route.collection, view]);

  const openProjectInput = useCallback(
    (id: string) => {
      const pid = projectId ?? videoId;
      if (!pid) {
        navigatePath(pathForResource({ collection: 'assets', id }), 'push');
        return;
      }
      navigatePath(
        pathForResource({ collection: 'treatments', id, projectId: pid }),
        'push',
      );
    },
    [navigatePath, projectId, videoId],
  );

  const closeProjectInput = useCallback(() => {
    if (projectId) {
      navigatePath(pathForResource({ collection: 'treatments', id: projectId }), 'push');
    }
  }, [navigatePath, projectId]);

  const openFrame = useCallback(
    (idx: number) => {
      if (!videoId) return;
      if (route.collection === 'assets' || view === 'assets') {
        navigatePath(
          pathForResource({ collection: 'assets', id: videoId, frameIndex: idx }),
          'replace',
        );
        return;
      }
      navigatePath(
        pathForResource({
          collection: 'treatments',
          id: videoId,
          projectId: projectId && projectId !== videoId ? projectId : undefined,
          frameIndex: idx,
        }),
        'replace',
      );
    },
    [navigatePath, projectId, route.collection, videoId, view],
  );

  const closeFrame = useCallback(() => {
    if (!videoId) return;
    if (route.collection === 'assets' || view === 'assets') {
      navigatePath(pathForResource({ collection: 'assets', id: videoId }), 'replace');
      return;
    }
    navigatePath(
      pathForResource({
        collection: 'treatments',
        id: videoId,
        projectId: projectId && projectId !== videoId ? projectId : undefined,
      }),
      'replace',
    );
  }, [navigatePath, projectId, route.collection, videoId, view]);

  const openReview = useCallback(() => {
    // Review is a treatment workflow — use project when viewing a source input
    const id = projectId && projectId === videoId
      ? videoId
      : (projectId && videoId && projectId !== videoId ? projectId : videoId);
    if (!id) return;
    navigatePath(
      pathForResource({ collection: 'treatments', id, review: true }),
      'replace',
    );
  }, [navigatePath, projectId, videoId]);

  const closeReview = useCallback(() => {
    const id = projectId ?? videoId;
    if (!id) return;
    navigatePath(pathForResource({ collection: 'treatments', id }), 'replace');
  }, [navigatePath, projectId, videoId]);

  const setSnippetCategory = useCallback(
    (c: string) => {
      writeParams(p => {
        if (c === 'all') p.delete('category');
        else p.set('category', c);
      });
    },
    [writeParams],
  );

  const setSort = useCallback(
    (s: string) => {
      writeParams(p => {
        if (s === 'newest') p.delete('sort');
        else p.set('sort', s);
      });
    },
    [writeParams],
  );

  // Rewrite legacy ?video= / ?project= / ?frame= / ?review= into RESTful paths
  useEffect(() => {
    if (!isStandalone) return;
    const qVideo = searchParams.get('video');
    if (!qVideo) return;
    // Already on a resource path — just strip legacy query keys
    if (route.videoId) {
      const cleaned = stripLegacyDetailParams(searchParams);
      const qs = cleaned.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      const cur = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      if (next !== cur) router.replace(next, { scroll: false });
      return;
    }
    const video = dataRef.current?.videos.find(v => v.id === qVideo);
    const collection = collectionForVideo(route.view, video?.stage);
    const qProject = searchParams.get('project');
    const qFrame = searchParams.get('frame');
    const qReview = searchParams.get('review') === '1';
    const frameNum =
      qFrame != null && qFrame !== '' && !Number.isNaN(Number(qFrame)) ? Number(qFrame) : null;

    let path: string;
    if (collection === 'assets') {
      path = pathForResource({ collection: 'assets', id: qVideo });
    } else if (qProject && qProject !== qVideo) {
      path = pathForResource({ collection: 'treatments', id: qVideo, projectId: qProject });
    } else if (qReview) {
      path = pathForResource({ collection: 'treatments', id: qVideo, review: true });
    } else if (frameNum != null) {
      path = pathForResource({ collection: 'treatments', id: qVideo, frameIndex: frameNum });
    } else {
      path = pathForResource({ collection: 'treatments', id: qVideo });
    }

    router.replace(withListQuery(path, stripLegacyDetailParams(searchParams)), { scroll: false });
  }, [isStandalone, pathname, route.videoId, route.view, router, searchParams]);

  // --- Data loading ---
  const [data, setData] = useState<CatalogData | null>(null);
  dataRef.current = data;
  const [snippetsData, setSnippetsData] = useState<CuratedSnippetsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('unknown');
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeTokenRef = useRef(0);

  const refreshCatalog = useCallback(async () => {
    const cacheBust = Date.now();
    const [c, s] = await Promise.all([
      apiClient.get(`/catalog-data.json?t=${cacheBust}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
      apiClient.get(`/curated-snippets.json?t=${cacheBust}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
    ]);
    if (c) setData(c);
    if (s) setSnippetsData(s);
    setLoading(false);
  }, []);

  const probe = useCallback(async () => {
    const token = ++probeTokenRef.current;
    setServiceStatus(prev => (prev === 'online' ? prev : 'checking'));
    const ok = await checkHealth();
    if (token !== probeTokenRef.current) return; // stale probe
    if (ok) {
      retryAttemptRef.current = 0;
      setServiceStatus('online');
      setLoading(true);
      try {
        await refreshCatalog();
      } catch (err) {
        console.error('Failed to load catalog', err);
        setLoading(false);
      }
    } else {
      setServiceStatus('offline');
      setLoading(false);
      const attempt = retryAttemptRef.current;
      const delay = OFFLINE_BACKOFF_MS[Math.min(attempt, OFFLINE_BACKOFF_MS.length - 1)];
      retryAttemptRef.current = attempt + 1;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        void probe();
      }, delay);
    }
  }, [refreshCatalog]);

  const retry = useCallback(() => {
    retryAttemptRef.current = 0;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    void probe();
  }, [probe]);

  useEffect(() => {
    void probe();
    return () => {
      probeTokenRef.current++; // invalidate in-flight probes
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [probe]);

  // --- Derived ---
  const snippets = snippetsData?.snippets ?? [];

  const selectedVideo = useMemo(
    () => (videoId ? data?.videos.find(v => v.id === videoId) ?? null : null),
    [data, videoId],
  );

  const projectVideo = useMemo(
    () => (projectId ? data?.videos.find(v => v.id === projectId) ?? null : null),
    [data, projectId],
  );

  const appBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    data?.videos.forEach(v => {
      m[v.app] = (m[v.app] ?? 0) + 1;
    });
    return m;
  }, [data]);

  const counts = useMemo(
    () => {
      const vs = data?.videos ?? [];
      const source = vs.filter(v => v.stage === 'source' || !v.stage);
      return {
        total: vs.length,
        source: source.length,
        wip: vs.filter(v => v.stage === 'wip').length,
        final: vs.filter(v => v.stage === 'final').length,
        analyzed: vs.filter(
          v => v.analysisStatus === 'complete' || v.analysisStatus === 'analyzed',
        ).length,
        needsWork: source.filter(
          v => v.analysisStatus === 'none' || v.analysisStatus === 'frames-only',
        ).length,
        transcribed: vs.filter(v => v.transcript || v.srt).length,
        reel: vs.filter(v => v.reelCandidate).length,
        curated: snippets.length,
        orphans: data?.orphanStoryboards?.length ?? 0,
      };
    },
    [data, snippets.length],
  );

  const snippetCategoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    snippets.forEach(s => {
      m[s.category] = (m[s.category] ?? 0) + 1;
    });
    return m;
  }, [snippets]);

  const filteredVideos = useMemo(() => {
    if (!data) return [];
    let vs = data.videos;
    if (filter !== 'all' && filter !== 'curated') {
      if (filter === 'source') {
        vs = vs.filter(v => v.stage === 'source' || !v.stage);
      } else if (filter === 'wip') {
        vs = vs.filter(v => v.stage === 'wip');
      } else if (filter === 'final') {
        vs = vs.filter(v => v.stage === 'final');
      } else if (filter === 'analyzed') {
        vs = vs.filter(
          v =>
            v.analysisStatus === 'complete' || v.analysisStatus === 'analyzed',
        );
      } else if (filter === 'needs-work') {
        vs = vs.filter(
          v =>
            (v.stage === 'source' || !v.stage) &&
            (v.analysisStatus === 'none' || v.analysisStatus === 'frames-only'),
        );
      } else if (filter === 'transcribed') {
        vs = vs.filter(v => v.transcript || v.srt);
      } else if (filter === 'reel') {
        vs = vs.filter(v => v.reelCandidate);
      } else {
        vs = vs.filter(v => v.app === filter);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      vs = vs.filter(v =>
        [v.id, v.filename, v.description, v.app, ...(v.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
    }
    const sorted = [...vs];
    switch (sort) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.capturedAt ?? 0).getTime() - new Date(b.capturedAt ?? 0).getTime());
        break;
      case 'longest':
        sorted.sort((a, b) => b.duration - a.duration);
        break;
      case 'shortest':
        sorted.sort((a, b) => a.duration - b.duration);
        break;
      case 'largest':
        sorted.sort((a, b) => b.sizeMB - a.sizeMB);
        break;
      case 'smallest':
        sorted.sort((a, b) => a.sizeMB - b.sizeMB);
        break;
      case 'name':
        sorted.sort((a, b) => a.id.localeCompare(b.id));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.capturedAt ?? 0).getTime() - new Date(a.capturedAt ?? 0).getTime());
        break;
    }
    return sorted;
  }, [data, filter, search, sort]);

  const filteredSnippets = useMemo(() => {
    let ss = snippets;
    if (search) {
      const q = search.toLowerCase();
      ss = ss.filter(s =>
        [s.id, s.source, s.description, s.category, ...s.tags]
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
    }
    if (snippetCategory !== 'all') {
      ss = ss.filter(s => s.category === snippetCategory);
    }
    return ss;
  }, [snippets, search, snippetCategory]);

  // --- Delete ---
  const deleteVideo = useCallback(async (id: string) => {
    const video = data?.videos.find(v => v.id === id);
    if (!video) return;
    // Optimistic: remove immediately so the UI responds instantly
    setData(prev => prev ? { ...prev, videos: prev.videos.filter(v => v.id !== id) } : prev);
    if (videoId === id) closeVideo();
    const videoUrl = video.videoUrl ?? (video.filename ? `/demos/${video.filename}` : null);
    if (!videoUrl) return;
    try {
      await apiClient.post(`/api/catalog/delete`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, [data, videoId, closeVideo]);

  const deleteAudio = useCallback(async (id: string) => {
    const asset = data?.audioAssets?.find(a => a.id === id);
    if (!asset) return;
    // Optimistic: remove immediately
    setData(prev => prev ? { ...prev, audioAssets: (prev.audioAssets ?? []).filter(a => a.id !== id) } : prev);
    try {
      await apiClient.post('/api/music/delete', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: asset.path }),
      });
    } catch (err) {
      console.error('Audio delete failed:', err);
    }
  }, [data]);

  // --- Pending music ---
  const [pendingMusicCount, setPendingMusicCount] = useState(0);
  const notifyMusicQueued = useCallback(() => setPendingMusicCount(c => c + 1), []);
  const notifyMusicSettled = useCallback(() => setPendingMusicCount(c => Math.max(0, c - 1)), []);

  const [pendingFiles, setPendingFiles] = useState<string[]>([]);

  // --- Code viewer ---
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const openFile = useCallback((path: string) => setViewingFile(path), []);
  const closeFile = useCallback(() => setViewingFile(null), []);

  // --- Lightbox ---
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const openLightbox = useCallback((s: LightboxState) => setLightbox(s), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      data,
      snippets,
      loading,
      serviceStatus,
      retry,
      filter,
      setFilter,
      search,
      setSearch,
      videoId,
      openVideo,
      closeVideo,
      frameIndex,
      openFrame,
      closeFrame,
      reviewOpen,
      openReview,
      closeReview,
      snippetCategory,
      setSnippetCategory,
      sort,
      setSort,
      projectId,
      projectVideo,
      openProjectInput,
      closeProjectInput,
      selectedVideo,
      filteredVideos,
      filteredSnippets,
      appBreakdown,
      counts,
      snippetCategoryCounts,
      refreshCatalog,
      deleteVideo,
      deleteAudio,
      pendingMusicCount,
      notifyMusicQueued,
      notifyMusicSettled,
      view,
      setView,
      pendingFiles,
      setPendingFiles,
      viewingFile,
      openFile,
      closeFile,
      lightbox,
      openLightbox,
      closeLightbox,
    }),
    [
      data,
      snippets,
      loading,
      serviceStatus,
      retry,
      filter,
      setFilter,
      search,
      setSearch,
      videoId,
      openVideo,
      closeVideo,
      frameIndex,
      openFrame,
      closeFrame,
      reviewOpen,
      openReview,
      closeReview,
      snippetCategory,
      setSnippetCategory,
      sort,
      setSort,
      projectId,
      projectVideo,
      openProjectInput,
      closeProjectInput,
      selectedVideo,
      filteredVideos,
      filteredSnippets,
      appBreakdown,
      counts,
      snippetCategoryCounts,
      refreshCatalog,
      deleteVideo,
      deleteAudio,
      pendingMusicCount,
      notifyMusicQueued,
      notifyMusicSettled,
      view,
      setView,
      pendingFiles,
      setPendingFiles,
      viewingFile,
      openFile,
      closeFile,
      lightbox,
      openLightbox,
      closeLightbox,
    ],
  );

  return (
    <CatalogContext.Provider value={value}>
      <PlayerProvider>
        <ReviewProvider>
          <FxProvider>{children}</FxProvider>
        </ReviewProvider>
      </PlayerProvider>
    </CatalogContext.Provider>
  );
}
