// Talkie brand tokens — mirrored from narrative-studio/_brand/tokens.ts
// Locked values, do not modify.

export const MONO =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const COLORS = {
  studioCream: '#F4EFE6',
  ribbonBlack: '#0E0D0A',
  hotMic: '#FF5346',
  cassetteOrange: '#E68A3C',
  cautionYellow: '#E8C547',
  tapeTan: '#7A6E5C',
} as const;

export const T_GEOMETRY = {
  cellCenter: 0.31,
  stemOffsetFromAnchor: -0.034,
  stemWidth: 0.08,
  crossY: 0.469,
  crossbarLeft: 0.115,
  crossbarRight: 0.4825,
} as const;

export const PULSE = {
  frequencyHz: 1.0,
  periodMs: 1000,
  opacityRange: [0.55, 1.0] as const,
  easing: 'ease-in-out' as const,
} as const;

// Wordmark font metrics (UPM 1000, matches Talkie-Medium.ttf v5)
export const WORDMARK = {
  font: 'var(--font-talkie), "JetBrains Mono", ui-monospace, monospace',
  iStemCenterUPM: 2445,
  totalAdvanceUPM: 3340,
  iStemTopUPM: 550,
  fontUPM: 1000,
} as const;
