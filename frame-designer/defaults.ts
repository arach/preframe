/**
 * Frame Designer — per-layer-type schema + sensible defaults.
 *
 * Each entry pairs a kit primitive with the props the designer exposes to
 * the user and a default value for adding a fresh layer.  Adding a new
 * primitive to the designer is two lines here plus an entry in the
 * REGISTRY map in FrameDesignerComposition.tsx.
 */
import type { LayerSpec, LayerType } from './types';

export const LAYER_SPECS: Record<LayerType, LayerSpec> = {
  TacticalFrame: {
    type: 'TacticalFrame',
    label: 'Tactical Frame',
    description: '4 rails + corner labels (REC / specs / version)',
    defaultProps: {
      totalFrames: 120,
      title: 'PREFRAME',
      subtitle: 'Frame Designer',
      stats: ['1920×1080', '30fps', 'preview'],
      versionTag: 'designer · v1',
      recLabel: 'REC',
      recColor: '#7c9eb2',
      guideMargin: 28,
      widthPct: 100,
      heightPct: 100,
      topPct: 0,
      leftPct: 0,
    },
    fields: [
      { key: 'title', type: 'string' },
      { key: 'subtitle', type: 'string' },
      { key: 'stats', type: 'string[]', label: 'Stats (comma-separated)' },
      { key: 'versionTag', type: 'string' },
      { key: 'recLabel', type: 'string' },
      { key: 'recColor', type: 'color' },
      { key: 'guideMargin', type: 'number', min: 0, max: 200, step: 2 },
      { key: 'widthPct', label: 'Width %', type: 'number', min: 20, max: 150, step: 1 },
      { key: 'heightPct', label: 'Height %', type: 'number', min: 20, max: 150, step: 1 },
      { key: 'topPct', label: 'Top %', type: 'number', min: -30, max: 80, step: 1 },
      { key: 'leftPct', label: 'Left %', type: 'number', min: -30, max: 80, step: 1 },
    ],
  },

  MonitorFrame: {
    type: 'MonitorFrame',
    label: 'Monitor Frame',
    description: 'Hardware bezel wrapper (screen glow + wordmark)',
    defaultProps: {
      bezelColor: '#1d1d23',
      bezelWidth: 12,
      bezelRadius: 14,
      showStand: false,
      showScreenGlow: true,
      glowColor: 'rgba(140, 175, 200, 0.10)',
      wordmark: 'PREFRAME',
      wordmarkColor: 'rgba(255, 255, 255, 0.32)',
      monitorWidthPct: 92,
      monitorHeightPct: 78,
      monitorTopPct: 8,
      chinHeight: 28,
    },
    fields: [
      { key: 'bezelColor', type: 'color' },
      { key: 'bezelWidth', type: 'number', min: 0, max: 60, step: 1 },
      { key: 'bezelRadius', type: 'number', min: 0, max: 60, step: 1 },
      { key: 'showScreenGlow', type: 'boolean' },
      { key: 'glowColor', type: 'string' },
      { key: 'wordmark', type: 'string' },
      { key: 'wordmarkColor', type: 'string' },
      { key: 'monitorWidthPct', type: 'number', min: 50, max: 100, step: 1 },
      { key: 'monitorHeightPct', type: 'number', min: 50, max: 100, step: 1 },
      { key: 'monitorTopPct', type: 'number', min: 0, max: 30, step: 1 },
      { key: 'chinHeight', type: 'number', min: 0, max: 80, step: 1 },
    ],
  },

  PromptCard: {
    type: 'PromptCard',
    label: 'Prompt Card',
    description: 'Centered terminal card with typewriter directive',
    defaultProps: {
      statusLabel: 'preview',
      path: 'PREFRAME / DESIGNER',
      text: 'Frame designer preview — the typewriter reveal lives here.',
      accent: '#7c9eb2',
      width: 760,
      tagline: 'preframe',
      typeStart: 14,
      typeFrames: 65,
    },
    fields: [
      { key: 'statusLabel', type: 'string' },
      { key: 'path', type: 'string' },
      { key: 'text', type: 'text' },
      { key: 'accent', type: 'color' },
      { key: 'width', type: 'number', min: 300, max: 1200, step: 20 },
      { key: 'tagline', type: 'string' },
    ],
  },

  CaptionCard: {
    type: 'CaptionCard',
    label: 'Caption Card',
    description: 'Body caption with role dot + ›-prefixed text',
    defaultProps: {
      role: 'hook',
      label: 'HOOK',
      text: 'Narrative caption renders here.',
      maxWidth: 820,
    },
    fields: [
      {
        key: 'role',
        type: 'enum',
        options: ['hook', 'setup', 'development', 'payoff', 'close', 'default'],
      },
      { key: 'label', type: 'string' },
      { key: 'text', type: 'text' },
      { key: 'maxWidth', type: 'number', min: 300, max: 1200, step: 20 },
    ],
  },

  SceneLabel: {
    type: 'SceneLabel',
    label: 'Scene Label',
    description: 'Bottom-anchored act label + progress hairline',
    defaultProps: {
      label: 'ACT',
      sublabel: 'act 1 / 5',
      progress: 0.35,
      placement: 'left',
      bottom: 56,
      left: 56,
      barWidth: 120,
    },
    fields: [
      { key: 'label', type: 'string' },
      { key: 'sublabel', type: 'string' },
      { key: 'progress', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'placement', type: 'enum', options: ['left', 'center'] },
      { key: 'bottom', type: 'number', min: 0, max: 400, step: 4 },
      { key: 'left', type: 'number', min: 0, max: 800, step: 4 },
      { key: 'barWidth', type: 'number', min: 40, max: 400, step: 10 },
    ],
  },
};

export const ALL_LAYER_TYPES: LayerType[] = Object.keys(LAYER_SPECS) as LayerType[];

export function defaultsFor(type: LayerType): Record<string, unknown> {
  return JSON.parse(JSON.stringify(LAYER_SPECS[type].defaultProps));
}
