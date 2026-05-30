'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { defaultsFor } from './defaults';
import type { FramePreset, Layer, LayerType } from './types';

interface DesignerState {
  preset: FramePreset;
  selectedId: string | null;
  presetList: Array<{ name: string; title?: string; description?: string }>;
  dirty: boolean;
  showSafeArea: boolean;
}

interface DesignerActions {
  addLayer: (type: LayerType) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  toggleVisibility: (id: string) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  updateProps: (id: string, patch: Record<string, unknown>) => void;
  loadPreset: (name: string) => Promise<void>;
  savePreset: (name?: string) => Promise<void>;
  resetCanvas: () => void;
  setShowSafeArea: (show: boolean) => void;
  refreshPresetList: () => Promise<void>;
}

type DesignerContextValue = DesignerState & DesignerActions;

const DesignerContext = createContext<DesignerContextValue | null>(null);

const STARTER: FramePreset = {
  name: 'untitled',
  title: 'Untitled frame',
  canvas: { width: 1920, height: 1080 },
  layers: [],
};

function nextId(): string {
  return `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function FrameDesignerProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<FramePreset>(STARTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [presetList, setPresetList] = useState<DesignerState['presetList']>([]);
  const [dirty, setDirty] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);

  const refreshPresetList = useCallback(async () => {
    try {
      const res = await fetch('/api/presets');
      if (!res.ok) return;
      const data = await res.json();
      setPresetList(data.presets ?? []);
    } catch {
      // noop — designer keeps working without saved presets
    }
  }, []);

  useEffect(() => {
    refreshPresetList();
  }, [refreshPresetList]);

  const addLayer = useCallback((type: LayerType) => {
    const id = nextId();
    setPreset((p) => ({
      ...p,
      layers: [...p.layers, { id, type, visible: true, props: defaultsFor(type) }],
    }));
    setSelectedId(id);
    setDirty(true);
  }, []);

  const removeLayer = useCallback((id: string) => {
    setPreset((p) => ({ ...p, layers: p.layers.filter((l) => l.id !== id) }));
    setSelectedId((cur) => (cur === id ? null : cur));
    setDirty(true);
  }, []);

  const selectLayer = useCallback((id: string | null) => setSelectedId(id), []);

  const toggleVisibility = useCallback((id: string) => {
    setPreset((p) => ({
      ...p,
      layers: p.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    }));
    setDirty(true);
  }, []);

  const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
    setPreset((p) => {
      const idx = p.layers.findIndex((l) => l.id === id);
      if (idx < 0) return p;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= p.layers.length) return p;
      const next = [...p.layers];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return { ...p, layers: next };
    });
    setDirty(true);
  }, []);

  const updateProps = useCallback((id: string, patch: Record<string, unknown>) => {
    setPreset((p) => ({
      ...p,
      layers: p.layers.map((l) =>
        l.id === id ? { ...l, props: { ...l.props, ...patch } } : l,
      ),
    }));
    setDirty(true);
  }, []);

  const loadPreset = useCallback(async (name: string) => {
    const res = await fetch(`/api/presets/${encodeURIComponent(name)}`);
    if (!res.ok) {
      console.error(`Failed to load preset ${name}:`, await res.text());
      return;
    }
    const data = (await res.json()) as FramePreset;
    // Re-id layers defensively so we never end up with collisions if the
    // file was hand-edited.
    const layers = (data.layers ?? []).map((l) => ({ ...l, id: l.id || nextId() }));
    setPreset({ ...data, layers });
    setSelectedId(null);
    setDirty(false);
  }, []);

  const savePreset = useCallback(
    async (name?: string) => {
      const target = name ?? preset.name;
      const payload: FramePreset = {
        ...preset,
        name: target,
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch(`/api/presets/${encodeURIComponent(target)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error('Failed to save preset:', await res.text());
        return;
      }
      setPreset(payload);
      setDirty(false);
      refreshPresetList();
    },
    [preset, refreshPresetList],
  );

  const resetCanvas = useCallback(() => {
    setPreset(STARTER);
    setSelectedId(null);
    setDirty(false);
  }, []);

  const value = useMemo<DesignerContextValue>(
    () => ({
      preset,
      selectedId,
      presetList,
      dirty,
      showSafeArea,
      addLayer,
      removeLayer,
      selectLayer,
      toggleVisibility,
      moveLayer,
      updateProps,
      loadPreset,
      savePreset,
      resetCanvas,
      setShowSafeArea,
      refreshPresetList,
    }),
    [
      preset,
      selectedId,
      presetList,
      dirty,
      showSafeArea,
      addLayer,
      removeLayer,
      selectLayer,
      toggleVisibility,
      moveLayer,
      updateProps,
      loadPreset,
      savePreset,
      resetCanvas,
      refreshPresetList,
    ],
  );

  return <DesignerContext.Provider value={value}>{children}</DesignerContext.Provider>;
}

export function useFrameDesigner() {
  const v = useContext(DesignerContext);
  if (!v) throw new Error('useFrameDesigner must be used inside FrameDesignerProvider');
  return v;
}
