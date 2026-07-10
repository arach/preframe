'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Film, FolderOpen, Upload, Send, FileVideo, Loader2, Music, Plus, Search, X, Sparkles, Wand2 } from 'lucide-react';
import type { IdeateResult } from '../../lib/inference';
import { useCatalog } from '../Provider';
import { formatDuration, type AudioAsset, type CompositionEngine, type Video } from '../../lib/types';
import { apiClient } from '../lib/api-client';
import { FX_PARAMS } from './FxParams';

type CompositionMode = 'video' | 'video-music' | 'music';

interface QueuedSource {
  path: string;
  type: 'file' | 'folder';
  mediaKind: 'video' | 'audio';
  label?: string;
  catalogId?: string;
  file?: File;
}

const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac']);

const EFFECT_SHORTLIST = [
  { id: 'film-grade', name: 'Film Grade' },
  { id: 'bloom-halation', name: 'Bloom' },
  { id: 'dark-neon', name: 'Dark Neon' },
  { id: 'motion-smear', name: 'Motion Smear' },
  { id: 'grid-glitch', name: 'Grid Glitch' },
  { id: 'scan-pulse', name: 'Scan Pulse' },
  { id: 'gesture-trail', name: 'Gesture Trail' },
  { id: 'lattice-intro', name: 'Lattice Intro' },
] as const;

const ALL_EFFECT_IDS = Array.from(new Set([
  ...EFFECT_SHORTLIST.map(effect => effect.id),
  ...Object.keys(FX_PARAMS),
])).sort();

function mediaKindForPath(path: string): QueuedSource['mediaKind'] {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return AUDIO_EXTENSIONS.has(extension) ? 'audio' : 'video';
}

function normalizePublicPath(path: string): string {
  return path.replace(/^\/+/, '');
}

function videoAssetPath(video: Video): string {
  return normalizePublicPath(video.demosPath || video.videoUrl || `demos/${video.filename}`);
}

function generateCompositionId(): string {
  return `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugifyCompositionName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function ingestSource(source: QueuedSource): Promise<string> {
  if (!source.file) return source.path;

  const form = new FormData();
  form.append('file', source.file);
  const res = await apiClient.post('/api/catalog/ingest', { body: form });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to ingest ${source.path}`);
  }
  return data.path || `demos/${source.file.name}`;
}

const DEFAULT_VIDEO_PROMPT =
  'Create a polished 30 second product demo. Give the important interaction moments breathing room, use tactical labels sparingly, and emphasize the user action clearly.';

const DEFAULT_SOUNDTRACK_PROMPT =
  'Japanese hip hop, Tokyo night drive, tight trap drums, warm 808 bass, shamisen plucks, sparse koto accents, confident product demo energy, complete 30 second hook with intro and outro';

const DEFAULT_SOUNDTRACK_LYRICS = `[Intro]
Mouse up, words wake

[Hook]
Te no naka de flow, click kara go
Kotoba ga hashiru, screen ni glow
Review, confirm, then enter the zone
Mouse dake de send, Lattices control

[Outro]
Click up, send now
Flow locks in, lights down`;

export function NewComposition({ initialMode }: { initialMode?: CompositionMode }) {
  const { data, setView, pendingFiles, setPendingFiles } = useCatalog();
  const [mode, setMode] = useState<CompositionMode>(() => initialMode ?? (pendingFiles.length > 0 ? 'video-music' : 'video'));
  const [sources, setSources] = useState<QueuedSource[]>(() =>
    pendingFiles.map(f => ({ path: f, type: 'file' as const, mediaKind: mediaKindForPath(f) }))
  );
  const [prompt, setPrompt] = useState(DEFAULT_VIDEO_PROMPT);
  const [name, setName] = useState('');
  const [musicPrompt, setMusicPrompt] = useState(DEFAULT_SOUNDTRACK_PROMPT);
  const [musicLyrics, setMusicLyrics] = useState(DEFAULT_SOUNDTRACK_LYRICS);
  const [lyricsResult, setLyricsResult] = useState<Record<string, unknown> | null>(null);
  const [engine, setEngine] = useState<CompositionEngine>('remotion');
  const [preferredEffects, setPreferredEffects] = useState<string[]>([]);
  const [otherEffect, setOtherEffect] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingLyrics, setGeneratingLyrics] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ideatePrompt, setIdeatePrompt] = useState('');
  const [ideating, setIdeating] = useState(false);
  const [ideateResult, setIdeateResult] = useState<IdeateResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingFiles.length > 0) setPendingFiles([]);
  }, [pendingFiles.length, setPendingFiles]);

  const addSources = useCallback((newSources: QueuedSource[]) => {
    if (newSources.length === 0) return;
    setSources(prev => {
      const existing = new Set(prev.map(source => source.path));
      return [...prev, ...newSources.filter(source => !existing.has(source.path))];
    });
    if (mode === 'music' && newSources.some(source => source.mediaKind === 'video')) setMode('video');
  }, [mode]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    addSources(Array.from(files).map(f => ({
      path: f.name,
      type: 'file' as const,
      mediaKind: mediaKindForPath(f.name),
      label: f.name,
      file: f,
    })));
  }, [addSources]);

  const addCatalogVideo = useCallback((video: Video) => {
    addSources([{
      path: videoAssetPath(video),
      type: 'file',
      mediaKind: 'video',
      label: video.id,
      catalogId: video.id,
    }]);
  }, [addSources]);

  const addCatalogAudio = useCallback((asset: AudioAsset) => {
    addSources([{
      path: normalizePublicPath(asset.path),
      type: 'file',
      mediaKind: 'audio',
      label: asset.songTitle || asset.id,
      catalogId: asset.id,
    }]);
  }, [addSources]);

  const removeSource = useCallback((idx: number) => {
    setSources(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const catalogPayload = e.dataTransfer.getData('application/x-preframe-asset');
    if (catalogPayload) {
      try {
        const source = JSON.parse(catalogPayload) as QueuedSource;
        if (source.path && (source.mediaKind === 'video' || source.mediaKind === 'audio')) {
          addSources([{ ...source, type: 'file' }]);
          return;
        }
      } catch {
        // Fall through to normal file handling.
      }
    }

    const items = e.dataTransfer.items;
    const newSources: QueuedSource[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry?.();
      const file = items[i].getAsFile();
      if (entry) {
        newSources.push({
          path: entry.name,
          type: entry.isDirectory ? 'folder' : 'file',
          mediaKind: mediaKindForPath(entry.name),
          label: entry.name,
          file: entry.isDirectory ? undefined : file ?? undefined,
        });
      } else if (file) {
        newSources.push({
          path: file.name,
          type: 'file',
          mediaKind: mediaKindForPath(file.name),
          label: file.name,
          file,
        });
      }
    }
    if (newSources.length > 0) {
      addSources(newSources);
    }
  }, [addSources]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setError(null);
    const compositionId = slugifyCompositionName(name) || generateCompositionId();

    if (mode === 'music') {
      if (!musicPrompt.trim()) return;
      setSubmitting(true);
      try {
        const res = await apiClient.post(`/api/compositions/${encodeURIComponent(compositionId)}/jobs`, {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'music-generate',
            prompt: musicPrompt.trim(),
            params: {
              name: name.trim() || undefined,
              soundtrack: {
                enabled: true,
                title: name.trim() || undefined,
                lyrics: instrumental ? undefined : musicLyrics.trim(),
                lyricsResult: instrumental ? undefined : lyricsResult ?? undefined,
                instrumental,
                model: 'music-2.6',
              },
            },
          }),
        });
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Music queue failed');

        setSubmitted('music');
        setTimeout(() => setView('queue'), 900);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!sources.some(source => source.mediaKind === 'video') || !prompt.trim()) return;
    setSubmitting(true);
    try {
      const ingested = await Promise.all(sources.map(async source => ({
        source,
        path: await ingestSource(source),
      })));
      const clipPaths = ingested.filter(item => item.source.mediaKind === 'video').map(item => item.path);
      const audioPaths = ingested.filter(item => item.source.mediaKind === 'audio').map(item => item.path);
      const withGeneratedMusic = mode === 'video-music' && audioPaths.length === 0;

      const res = await apiClient.post(`/api/compositions/${compositionId}/jobs`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'generate',
          prompt: prompt.trim(),
          inputs: { clips: clipPaths, audio: audioPaths },
          params: {
            name: name.trim() || undefined,
            engine,
            preferredEffects,
            soundtrack: withGeneratedMusic
              ? {
                  enabled: true,
                  model: 'music-2.6',
                  prompt: musicPrompt.trim(),
                  lyrics: musicLyrics.trim(),
                  lyricsResult: lyricsResult ?? undefined,
                  instrumental,
                  showLyricCaptions: !instrumental,
                }
              : undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Composition queue failed');
      setSubmitted('video');
      setTimeout(() => setView('queue'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [mode, name, musicPrompt, musicLyrics, lyricsResult, instrumental, engine, preferredEffects, sources, prompt, submitting, setView]);

  const handleGenerateLyrics = useCallback(async () => {
    if (!musicPrompt.trim() || instrumental) return;
    setGeneratingLyrics(true);
    setError(null);
    try {
      const res = await apiClient.post('/api/music/lyrics', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: musicLyrics.trim() ? 'edit' : 'write_full_song',
          prompt: musicLyrics.trim()
            ? `Revise or expand these lyrics for the music prompt. Avoid making only a tiny hook unless the prompt explicitly asks for one.\n\n${musicPrompt.trim()}`
            : musicPrompt.trim(),
          lyrics: musicLyrics.trim() || undefined,
          title: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lyrics generation failed');
      if (typeof data.lyrics === 'string') setMusicLyrics(data.lyrics);
      if (!name.trim() && typeof data.song_title === 'string') setName(data.song_title);
      setLyricsResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingLyrics(false);
    }
  }, [musicPrompt, musicLyrics, instrumental, name]);

  const handleIdeate = useCallback(async () => {
    if (!ideatePrompt.trim() || ideating) return;
    setIdeating(true);
    setError(null);
    try {
      const res = await apiClient.post('/api/inference', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'music-ideate', prompt: ideatePrompt.trim() }),
      });
      const data = await res.json() as IdeateResult & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Ideation failed');
      setIdeateResult(data);
      if (data.musicPrompt) setMusicPrompt(data.musicPrompt);
      if (data.lyrics) setMusicLyrics(data.lyrics);
      if (!name.trim() && data.title) setName(data.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIdeating(false);
    }
  }, [ideatePrompt, ideating, name]);

  const needsSource = mode !== 'music';
  const selectedVideoCount = sources.filter(source => source.mediaKind === 'video').length;
  const selectedAudioCount = sources.filter(source => source.mediaKind === 'audio').length;
  const useGeneratedSoundtrack = mode === 'video-music' && selectedAudioCount === 0;
  const canSubmit = mode === 'music'
    ? !!musicPrompt.trim() && !submitting
    : selectedVideoCount > 0 && !!prompt.trim() && !submitting;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="text-[14px] text-emerald-400/80 font-mono">
          {submitted === 'music' ? 'Music queued' : 'Composition queued'}
        </div>
        <div className="text-[11px] text-white/30 font-mono">
          Opening queue...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
        <button onClick={() => setView(null)} className="text-white/30 hover:text-white/60 transition-colors">
          <ArrowLeft size={14} />
        </button>
        <h1 className="text-[14px] font-medium text-white/90">New Composition</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full grid grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-r border-white/[0.06] bg-white/[0.01] p-4 flex flex-col gap-3">
            <ModeButton mode="video" active={mode === 'video'} title="Video" detail="Render a video from clips" icon={<Film size={14} />} onClick={() => setMode('video')} />
            <ModeButton mode="video-music" active={mode === 'video-music'} title="Video + Music" detail="Analyze clips, render, add MiniMax" icon={<Sparkles size={14} />} onClick={() => setMode('video-music')} />
            <ModeButton mode="music" active={mode === 'music'} title="Music" detail="Generate a reusable track" icon={<Music size={14} />} onClick={() => setMode('music')} />
          </aside>

          <main className="min-h-0 overflow-y-auto frame-scrollbar">
            <div className="px-6 py-6 grid grid-cols-[minmax(0,1fr)_320px] gap-6">
              <section className="flex flex-col gap-6 min-w-0">
                <Field label={mode === 'music' ? 'Track Name' : 'Composition Name'}>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Optional - auto-generated if blank"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2.5 text-[13px] text-white/80 font-mono placeholder:text-white/15 outline-none focus:border-cyan-400/30 transition-colors"
                  />
                </Field>

                {needsSource && (
                  <Field label="Build With">
                    <div className="inline-flex rounded-sm border border-white/[0.08] bg-white/[0.02] p-1">
                      <label
                        className={`px-3 py-1.5 rounded-sm border text-[10px] font-mono transition-colors ${engine === 'remotion' ? 'bg-cyan-400/[0.11] text-cyan-300 border-cyan-400/25' : 'text-white/35 border-transparent hover:text-white/60'}`}
                      >
                        <input
                          type="radio"
                          name="composition-engine"
                          value="remotion"
                          checked={engine === 'remotion'}
                          onChange={() => setEngine('remotion')}
                          className="sr-only"
                        />
                        Remotion
                      </label>
                      <label
                        className={`px-3 py-1.5 rounded-sm border text-[10px] font-mono transition-colors ${engine === 'hyperframes' ? 'bg-cyan-400/[0.11] text-cyan-300 border-cyan-400/25' : 'text-white/35 border-transparent hover:text-white/60'}`}
                      >
                        <input
                          type="radio"
                          name="composition-engine"
                          value="hyperframes"
                          checked={engine === 'hyperframes'}
                          onChange={() => setEngine('hyperframes')}
                          className="sr-only"
                        />
                        Hyperframes
                      </label>
                    </div>
                    <span className="ml-3 text-[10px] font-mono text-white/25">
                      {engine === 'remotion' ? 'React composition' : 'HTML + GSAP'}
                    </span>
                  </Field>
                )}

                {needsSource && (
                  <Field label="Composition Assets">
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleDrop}
                      className="min-h-28 border-2 border-dashed border-white/[0.08] hover:border-cyan-400/20 rounded-sm p-3 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-white/35">
                          Selected · {selectedVideoCount} video{selectedVideoCount !== 1 ? 's' : ''} · {selectedAudioCount} music
                        </div>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-cyan-400/60 hover:text-cyan-300"
                        >
                          <Upload size={10} /> Browse files
                        </button>
                      </div>

                      {sources.length === 0 ? (
                        <div className="h-20 flex items-center justify-center text-center text-[11px] font-mono text-white/22">
                          Drag catalog assets here, or click them below.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          {sources.map((source, index) => (
                            <div key={`${source.path}-${index}`} className="flex items-center gap-2 px-2.5 py-2 bg-white/[0.025] border border-white/[0.055] rounded-sm min-w-0">
                              {source.type === 'folder' ? (
                                <FolderOpen size={12} className="text-white/25 shrink-0" />
                              ) : source.mediaKind === 'audio' ? (
                                <Music size={12} className="text-violet-300/60 shrink-0" />
                              ) : (
                                <FileVideo size={12} className="text-cyan-300/55 shrink-0" />
                              )}
                              <span className="text-[11px] font-mono text-white/60 truncate flex-1" title={source.path}>
                                {source.label || source.path}
                              </span>
                              <button type="button" onClick={() => removeSource(index)} className="text-white/20 hover:text-white/50 transition-colors shrink-0" title="Remove asset">
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <input ref={fileRef} type="file" multiple accept=".mp4,.mov,.mkv,.avi,.webm,.m4v,.mxf,.prores,.ts,.flv,.mp3,.wav,.aac,.m4a,.ogg,.flac,.png,.jpg,.jpeg,.webp,.svg,.gif,.json,.srt,.vtt" className="hidden" onChange={e => addFiles(e.target.files)} />

                    <AssetLibraryPicker
                      videos={data?.videos ?? []}
                      audioAssets={data?.audioAssets ?? []}
                      selectedPaths={new Set(sources.map(source => source.path))}
                      onAddVideo={addCatalogVideo}
                      onAddAudio={addCatalogAudio}
                    />
                  </Field>
                )}

                {needsSource && (
                  <Field label="Video Instructions">
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      rows={7}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2.5 text-[13px] text-white/80 font-mono placeholder:text-white/15 outline-none focus:border-cyan-400/30 transition-colors resize-none leading-relaxed"
                    />
                  </Field>
                )}

                {needsSource && (
                  <Field label="Effect Preferences">
                    <div className="flex flex-wrap gap-1.5">
                      {EFFECT_SHORTLIST.map(effect => {
                        const selected = preferredEffects.includes(effect.id);
                        return (
                          <button
                            key={effect.id}
                            type="button"
                            onClick={() => setPreferredEffects(current => selected
                              ? current.filter(id => id !== effect.id)
                              : [...current, effect.id])}
                            className={`px-2.5 py-1.5 rounded-sm border text-[10px] font-mono transition-colors ${
                              selected
                                ? 'bg-violet-400/[0.1] border-violet-400/30 text-violet-300'
                                : 'bg-white/[0.02] border-white/[0.065] text-white/38 hover:text-white/65 hover:border-white/[0.14]'
                            }`}
                          >
                            {effect.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        list="composition-effect-options"
                        value={otherEffect}
                        onChange={event => setOtherEffect(event.target.value)}
                        onKeyDown={event => {
                          if (event.key !== 'Enter') return;
                          event.preventDefault();
                          const effect = otherEffect.trim();
                          if (effect && !preferredEffects.includes(effect)) setPreferredEffects(current => [...current, effect]);
                          setOtherEffect('');
                        }}
                        placeholder="Add another registered effect…"
                        className="flex-1 bg-white/[0.025] border border-white/[0.07] rounded-sm px-2.5 py-1.5 text-[10px] font-mono text-white/60 placeholder:text-white/18 outline-none focus:border-violet-400/25"
                      />
                      <datalist id="composition-effect-options">
                        {ALL_EFFECT_IDS.map(effect => <option key={effect} value={effect} />)}
                      </datalist>
                      <button
                        type="button"
                        disabled={!otherEffect.trim()}
                        onClick={() => {
                          const effect = otherEffect.trim();
                          if (effect && !preferredEffects.includes(effect)) setPreferredEffects(current => [...current, effect]);
                          setOtherEffect('');
                        }}
                        className="px-2.5 py-1.5 rounded-sm border border-violet-400/20 text-[9px] font-mono uppercase tracking-wider text-violet-300/65 disabled:opacity-30"
                      >
                        Add
                      </button>
                    </div>
                    {preferredEffects.some(id => !EFFECT_SHORTLIST.some(effect => effect.id === id)) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {preferredEffects.filter(id => !EFFECT_SHORTLIST.some(effect => effect.id === id)).map(effect => (
                          <button
                            key={effect}
                            type="button"
                            onClick={() => setPreferredEffects(current => current.filter(id => id !== effect))}
                            className="flex items-center gap-1 px-2 py-1 rounded-sm bg-violet-400/[0.08] border border-violet-400/20 text-[9px] font-mono text-violet-300/70"
                            title="Remove effect preference"
                          >
                            {effect} <X size={9} />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-[10px] font-mono text-white/25">
                      Optional guidance, not a hard allow-list. The planner can still choose another effect when the brief calls for it.
                    </div>
                  </Field>
                )}

                {(useGeneratedSoundtrack || mode === 'music') && (
                  <Field label="Vibe / Concept">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ideatePrompt}
                        onChange={e => setIdeatePrompt(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleIdeate(); }}
                        placeholder="e.g. late night Tokyo drive, lo-fi melancholy with hope…"
                        className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2.5 text-[13px] text-white/80 font-mono placeholder:text-white/15 outline-none focus:border-cyan-400/30 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleIdeate}
                        disabled={!ideatePrompt.trim() || ideating}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-sm border text-[11px] font-mono uppercase tracking-wider transition-colors ${
                          ideatePrompt.trim() && !ideating
                            ? 'bg-violet-400/[0.1] border-violet-400/25 text-violet-300 hover:bg-violet-400/[0.15]'
                            : 'bg-white/[0.02] border-white/[0.06] text-white/22 cursor-not-allowed'
                        }`}
                      >
                        <Wand2 size={11} />
                        {ideating ? 'Ideating…' : 'Ideate'}
                      </button>
                    </div>
                    {ideateResult && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ideateResult.genre && <IdeateTag>{ideateResult.genre}</IdeateTag>}
                        {ideateResult.mood && <IdeateTag>{ideateResult.mood}</IdeateTag>}
                        {ideateResult.bpm && <IdeateTag>{ideateResult.bpm} BPM</IdeateTag>}
                        {ideateResult.instruments && <IdeateTag>{ideateResult.instruments}</IdeateTag>}
                      </div>
                    )}
                  </Field>
                )}

                {(useGeneratedSoundtrack || mode === 'music') && (
                  <Field label={mode === 'music' ? 'Music Prompt' : 'Soundtrack Prompt'}>
                    <textarea
                      value={musicPrompt}
                      onChange={e => setMusicPrompt(e.target.value)}
                      rows={5}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2.5 text-[13px] text-white/80 font-mono outline-none focus:border-cyan-400/30 transition-colors resize-none leading-relaxed"
                    />
                    <label className="flex items-center gap-2 text-[11px] font-mono text-white/45 mt-3">
                      <input
                        type="checkbox"
                        checked={instrumental}
                        onChange={e => setInstrumental(e.target.checked)}
                        className="accent-cyan-300"
                      />
                      Instrumental
                    </label>
                    {!instrumental && (
                      <>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateLyrics}
                            disabled={generatingLyrics || !musicPrompt.trim()}
                            className={`px-3 py-1.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                              !generatingLyrics && musicPrompt.trim()
                                ? 'bg-cyan-400/[0.08] border-cyan-400/25 text-cyan-300 hover:bg-cyan-400/[0.13]'
                                : 'bg-white/[0.02] border-white/[0.06] text-white/22 cursor-not-allowed'
                            }`}
                          >
                            {generatingLyrics ? 'Writing...' : musicLyrics.trim() ? 'Revise Lyrics' : 'Generate Lyrics'}
                          </button>
                          {typeof lyricsResult?.style_tags === 'string' && (
                            <span className="text-[10px] font-mono text-white/35 truncate">
                              {lyricsResult.style_tags}
                            </span>
                          )}
                        </div>
                        <textarea
                          value={musicLyrics}
                          onChange={e => { setMusicLyrics(e.target.value); setLyricsResult(null); }}
                          rows={8}
                          className="mt-3 w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-3 py-2.5 text-[12px] text-white/75 font-mono outline-none focus:border-cyan-400/30 transition-colors resize-none leading-relaxed"
                        />
                      </>
                    )}
                  </Field>
                )}

                {mode === 'video-music' && selectedAudioCount > 0 && (
                  <div className="rounded-sm border border-violet-400/20 bg-violet-400/[0.05] px-3 py-2.5 text-[11px] font-mono text-violet-200/60">
                    Using {selectedAudioCount} selected music asset{selectedAudioCount !== 1 ? 's' : ''}. MiniMax soundtrack generation is disabled for this composition.
                  </div>
                )}
              </section>

              <aside className="min-w-0">
                <div className="sticky top-6 rounded border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/25 mb-3">
                    {mode === 'music' && submitting ? 'Generating' : 'Ready'}
                  </div>
                  <div className="flex flex-col gap-2 text-[11px] font-mono text-white/45 mb-4">
                    <span>Mode: {mode === 'video-music' ? 'Video + Music' : mode === 'music' ? 'Music' : 'Video'}</span>
                    {needsSource && <span>Videos: {selectedVideoCount}</span>}
                    {needsSource && <span>Music: {selectedAudioCount}</span>}
                    {mode !== 'music' && <span>Engine: {engine}</span>}
                    {needsSource && <span>Effects: {preferredEffects.length || 'auto'}</span>}
                    {(useGeneratedSoundtrack || mode === 'music') && <span>Model: music-2.6</span>}
                  </div>
                  {error && (
                    <div className="mb-3 rounded bg-red-400/[0.08] border border-red-400/20 px-3 py-2 text-[11px] font-mono text-red-300/75">
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm text-[12px] font-mono uppercase tracking-wider transition-all ${
                      canSubmit
                        ? 'bg-cyan-400/[0.1] border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/[0.15]'
                        : 'bg-white/[0.02] border border-white/[0.06] text-white/20 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    {submitting ? (mode === 'music' ? 'Generating Music...' : 'Creating...') : mode === 'music' ? 'Generate Music' : 'Create'}
                  </button>
                  {mode === 'music' && submitting && (
                    <div className="mt-3 text-[10px] leading-relaxed font-mono text-violet-300/60" role="status">
                      Adding the track to Queue…
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  title,
  detail,
  icon,
  onClick,
}: {
  mode: CompositionMode;
  active: boolean;
  title: string;
  detail: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded border px-3 py-3 transition-colors ${
        active
          ? 'bg-cyan-400/[0.08] border-cyan-400/25'
          : 'bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1]'
      }`}
    >
      <div className="flex items-center gap-2 text-[12px] text-white/80">
        <span className={active ? 'text-cyan-300/80' : 'text-white/30'}>{icon}</span>
        {title}
      </div>
      <div className="text-[10px] font-mono text-white/32 mt-1.5 leading-snug">{detail}</div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/25 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function IdeateTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 rounded bg-violet-400/[0.07] border border-violet-400/20 text-[10px] font-mono text-violet-300/70">
      {children}
    </span>
  );
}

function AssetLibraryPicker({
  videos,
  audioAssets,
  selectedPaths,
  onAddVideo,
  onAddAudio,
}: {
  videos: Video[];
  audioAssets: AudioAsset[];
  selectedPaths: Set<string>;
  onAddVideo: (video: Video) => void;
  onAddAudio: (asset: AudioAsset) => void;
}) {
  const [kind, setKind] = useState<'video' | 'audio'>('video');
  const [search, setSearch] = useState('');
  const [showAllVideos, setShowAllVideos] = useState(false);
  const query = search.trim().toLowerCase();

  const visibleVideos = useMemo(() => videos.filter(video => {
    const analyzed = video.analysisStatus === 'complete' || video.analysisStatus === 'analyzed';
    if (!showAllVideos && !analyzed) return false;
    if (!query) return true;
    return [video.id, video.filename, video.app, ...(video.tags ?? [])]
      .join(' ')
      .toLowerCase()
      .includes(query);
  }), [videos, query, showAllVideos]);

  const visibleAudio = useMemo(() => audioAssets.filter(asset => {
    if (!query) return true;
    return [asset.id, asset.songTitle, asset.app, asset.prompt]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  }), [audioAssets, query]);

  const beginDrag = (event: React.DragEvent, source: QueuedSource) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-preframe-asset', JSON.stringify(source));
    event.dataTransfer.setData('text/plain', source.path);
  };

  return (
    <div className="mt-3 rounded-sm border border-white/[0.07] bg-white/[0.012] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
        <div className="inline-flex rounded-sm bg-white/[0.025] p-0.5">
          <button
            type="button"
            onClick={() => setKind('video')}
            className={`px-2.5 py-1 rounded-sm text-[9px] font-mono uppercase tracking-wider ${kind === 'video' ? 'bg-cyan-400/[0.1] text-cyan-300' : 'text-white/30'}`}
          >
            Videos
          </button>
          <button
            type="button"
            onClick={() => setKind('audio')}
            className={`px-2.5 py-1 rounded-sm text-[9px] font-mono uppercase tracking-wider ${kind === 'audio' ? 'bg-violet-400/[0.1] text-violet-300' : 'text-white/30'}`}
          >
            Music
          </button>
        </div>
        <div className="relative flex-1">
          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={`Search ${kind === 'video' ? 'videos' : 'music'}…`}
            className="w-full rounded-sm border border-white/[0.06] bg-black/10 py-1.5 pl-6 pr-2 text-[10px] font-mono text-white/60 placeholder:text-white/18 outline-none focus:border-cyan-400/25"
          />
        </div>
        {kind === 'video' && (
          <button
            type="button"
            onClick={() => setShowAllVideos(value => !value)}
            className="shrink-0 text-[9px] font-mono text-white/35 hover:text-white/60"
          >
            {showAllVideos ? 'All videos' : 'Analyzed'}
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto frame-scrollbar p-1.5">
        {kind === 'video' ? (
          visibleVideos.length > 0 ? visibleVideos.map(video => {
            const path = videoAssetPath(video);
            const selected = selectedPaths.has(path);
            return (
              <button
                key={video.id}
                type="button"
                draggable={!selected}
                onDragStart={event => beginDrag(event, { path, type: 'file', mediaKind: 'video', label: video.id, catalogId: video.id })}
                onClick={() => onAddVideo(video)}
                disabled={selected}
                className={`w-full flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors ${selected ? 'bg-cyan-400/[0.055] opacity-45' : 'hover:bg-white/[0.04]'}`}
              >
                <FileVideo size={12} className="text-cyan-300/55 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white/65 truncate">{video.id}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[9px] font-mono text-white/28">
                    <span>{formatDuration(video.duration)}</span>
                    <span>{video.app}</span>
                    <span className="text-emerald-300/55">analyzed</span>
                  </div>
                </div>
                <Plus size={11} className={selected ? 'text-cyan-300/50' : 'text-white/25'} />
              </button>
            );
          }) : (
            <div className="px-3 py-8 text-center text-[10px] font-mono text-white/25">No matching analyzed videos.</div>
          )
        ) : (
          visibleAudio.length > 0 ? visibleAudio.map(asset => {
            const path = normalizePublicPath(asset.path);
            const selected = selectedPaths.has(path);
            return (
              <button
                key={asset.id}
                type="button"
                draggable={!selected}
                onDragStart={event => beginDrag(event, { path, type: 'file', mediaKind: 'audio', label: asset.songTitle || asset.id, catalogId: asset.id })}
                onClick={() => onAddAudio(asset)}
                disabled={selected}
                className={`w-full flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors ${selected ? 'bg-violet-400/[0.055] opacity-45' : 'hover:bg-white/[0.04]'}`}
              >
                <Music size={12} className="text-violet-300/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white/65 truncate">{asset.songTitle || asset.id}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[9px] font-mono text-white/28">
                    <span>{formatDuration(asset.duration)}</span>
                    {asset.model && <span>{asset.model}</span>}
                    {asset.instrumental && <span>instrumental</span>}
                  </div>
                </div>
                <Plus size={11} className={selected ? 'text-violet-300/50' : 'text-white/25'} />
              </button>
            );
          }) : (
            <div className="px-3 py-8 text-center text-[10px] font-mono text-white/25">No matching music assets.</div>
          )
        )}
      </div>
    </div>
  );
}
