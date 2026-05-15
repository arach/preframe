import { interpolate, Easing } from 'remotion';
import { COLORS, MONO, T_GEOMETRY } from '../tokens';

export const FPS = 60;

// Re-export for convenience
export { COLORS, MONO, T_GEOMETRY };

export interface TMarkGeometry {
  size: number;
  viewW: number;
  anchorX: number;
  stemCx: number;
  baseline: number;
  dotR: number;
  dotCy: number;
}

export function tGeom(size = 600): TMarkGeometry {
  const viewW = size * 0.62;
  const anchorX = size * T_GEOMETRY.cellCenter;
  const stemCx = anchorX + size * T_GEOMETRY.stemOffsetFromAnchor;
  const baseline = size * 0.86;
  const dotR = (size * T_GEOMETRY.stemWidth) / 2;
  const dotCy = size * 0.12;
  return { size, viewW, anchorX, stemCx, baseline, dotR, dotCy };
}

/**
 * mm-a-breath envelope — asymmetric tidal respiration.
 * Input: t in [0, 1] (phase within one cycle).
 * Returns scale factor (centered around 1.0).
 *
 * Keyframe stops from the design vocabulary:
 *   0%=0.92, 4%=0.925, 10%=0.95, 20%=1.00, 30%=1.055,
 *   35%=1.06 (plateau), 46%=1.035, 60%=1.00, 72%=0.965,
 *   82%=0.93, 100%=0.92
 */
export function breathEnvelope(t: number): number {
  const stops = [
    [0, 0.92], [0.04, 0.925], [0.10, 0.95], [0.20, 1.00],
    [0.30, 1.055], [0.35, 1.06], [0.46, 1.035], [0.60, 1.00],
    [0.72, 0.965], [0.82, 0.93], [1.0, 0.92],
  ] as const;
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      const seg = (clamped - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
      return stops[i][1] + seg * (stops[i + 1][1] - stops[i][1]);
    }
  }
  return stops[stops.length - 1][1];
}

/**
 * mm-f-breath envelope — stroke-width and opacity on respiratory curve.
 * Returns { strokeWidth, opacity }.
 */
export function outlineBreathEnvelope(t: number): { strokeWidth: number; opacity: number } {
  const swStops = [
    [0, 0.60], [0.04, 0.62], [0.10, 0.72], [0.20, 1.05],
    [0.30, 1.80], [0.35, 1.85], [0.46, 1.55], [0.60, 1.10],
    [0.72, 0.85], [0.82, 0.66], [1.0, 0.60],
  ] as const;
  const opStops = [
    [0, 0.60], [0.04, 0.61], [0.10, 0.68], [0.20, 0.82],
    [0.30, 1.00], [0.35, 1.00], [0.46, 0.94], [0.60, 0.82],
    [0.72, 0.72], [0.82, 0.63], [1.0, 0.60],
  ] as const;
  return {
    strokeWidth: lerpStops(swStops, t),
    opacity: lerpStops(opStops, t),
  };
}

function lerpStops(stops: readonly (readonly [number, number])[], t: number): number {
  const c = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    if (c >= stops[i][0] && c <= stops[i + 1][0]) {
      const seg = (c - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
      return stops[i][1] + seg * (stops[i + 1][1] - stops[i][1]);
    }
  }
  return stops[stops.length - 1][1];
}

/**
 * mm-b-wink envelope — asymmetric 3-axis collapse.
 * Returns { scaleY, scaleX, skewY, translateY }.
 * Event occupies ~8% of cycle at the end (92–100%).
 */
export function winkEnvelope(t: number): {
  scaleY: number; scaleX: number; skewY: number; translateY: number;
} {
  if (t < 0.92) return { scaleY: 1, scaleX: 1, skewY: 0, translateY: 0 };
  const stops = [
    [0.92, { scaleY: 1, scaleX: 1, skewY: 0, translateY: 0 }],
    [0.936, { scaleY: 0.10, scaleX: 1.22, skewY: -6, translateY: 0.8 }],
    [0.948, { scaleY: 0.10, scaleX: 1.20, skewY: -6, translateY: 0.8 }],
    [0.970, { scaleY: 0.55, scaleX: 1.08, skewY: -3, translateY: 0.3 }],
    [0.990, { scaleY: 1, scaleX: 1, skewY: 0, translateY: 0 }],
    [1.000, { scaleY: 1, scaleX: 1, skewY: 0, translateY: 0 }],
  ] as const;
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      const seg = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
      const a = stops[i][1];
      const b = stops[i + 1][1];
      return {
        scaleY: a.scaleY + seg * (b.scaleY - a.scaleY),
        scaleX: a.scaleX + seg * (b.scaleX - a.scaleX),
        skewY: a.skewY + seg * (b.skewY - a.skewY),
        translateY: a.translateY + seg * (b.translateY - a.translateY),
      };
    }
  }
  return { scaleY: 1, scaleX: 1, skewY: 0, translateY: 0 };
}
