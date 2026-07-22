/**
 * Zoom map helpers — relate composition zoom {scale, origin} to a
 * full-frame viewport rectangle (normalized 0–1).
 *
 * Matches Remotion/CSS: scale around transform-origin, content grows,
 * the visible window shrinks to 1/scale around the origin.
 */

export interface ZoomSpec {
  scale: number;
  originX: number; // 0–1 or 0–100
  originY: number;
  startAtSec?: number;
}

export interface NormRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function normalizeOrigin(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  return v > 1 ? v / 100 : Math.max(0, Math.min(1, v));
}

/** Viewport in source space for a CSS/Remotion scale around origin. */
export function viewportFromZoom(zoom: ZoomSpec): NormRect {
  const scale = Math.max(1.001, zoom.scale || 1);
  const ox = normalizeOrigin(zoom.originX);
  const oy = normalizeOrigin(zoom.originY);
  const w = 1 / scale;
  const h = 1 / scale;
  return {
    x: ox * (1 - w),
    y: oy * (1 - h),
    w,
    h,
  };
}

/** Approximate zoom that would fill a drawn rect (for review notes). */
export function zoomFromRect(rect: NormRect): ZoomSpec {
  const w = Math.max(0.05, Math.min(1, rect.w));
  const h = Math.max(0.05, Math.min(1, rect.h));
  const scale = 1 / Math.max(w, h);
  const ox = rect.x + rect.w / 2;
  const oy = rect.y + rect.h / 2;
  return {
    scale: Math.round(scale * 100) / 100,
    originX: Math.round(ox * 1000) / 1000,
    originY: Math.round(oy * 1000) / 1000,
  };
}

export interface PlanClipZoom {
  src: string;
  label: string;
  startFrom: number;
  duration: number;
  /** Timeline start within composition (excluding intro) — filled by caller if known */
  timelineStartSec?: number;
  zoom?: ZoomSpec | null;
}

/**
 * Pull CLIPS entries (with optional zoom) out of a generated Composition.tsx.
 * Best-effort regex parse — compositions are codegen'd with a stable shape.
 */
export function parseClipsFromCompositionTsx(tsx: string): PlanClipZoom[] {
  const clips: PlanClipZoom[] = [];
  // Match each clip object block inside CLIPS = [ ... ]
  const arrayMatch = tsx.match(/const\s+CLIPS\s*=\s*\[([\s\S]*?)\n\];/);
  if (!arrayMatch) return clips;
  const body = arrayMatch[1];

  // Split roughly on top-level objects: look for `{` ... `},`
  const objRe = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = objRe.exec(body))) {
    const block = m[1];
    const src = block.match(/src:\s*["'`]([^"'`]+)["'`]/)?.[1];
    if (!src) continue;
    const label = block.match(/label:\s*["'`]([^"'`]*)["'`]/)?.[1] ?? src;
    const startFrom = parseFloat(block.match(/startFrom:\s*([0-9.]+)/)?.[1] ?? '0');
    const duration = parseFloat(block.match(/duration:\s*([0-9.]+)/)?.[1] ?? '0');
    const zoomBlock = block.match(/zoom:\s*\{([^}]+)\}/)?.[1];
    let zoom: ZoomSpec | null = null;
    if (zoomBlock) {
      const scale = parseFloat(zoomBlock.match(/scale:\s*([0-9.]+)/)?.[1] ?? '1');
      const originX = parseFloat(zoomBlock.match(/originX:\s*([0-9.]+)/)?.[1] ?? '0.5');
      const originY = parseFloat(zoomBlock.match(/originY:\s*([0-9.]+)/)?.[1] ?? '0.5');
      const startAtSec = parseFloat(zoomBlock.match(/startAtSec:\s*([0-9.]+)/)?.[1] ?? '0');
      zoom = { scale, originX, originY, startAtSec };
    }
    clips.push({
      src,
      label,
      startFrom: Number.isFinite(startFrom) ? startFrom : 0,
      duration: Number.isFinite(duration) ? duration : 0,
      zoom,
    });
  }
  return clips;
}

/** Interpolate scale at local clip time (mirrors worker ClipSegment ~0.7s ease-in). */
export function scaleAtLocalTime(zoom: ZoomSpec, localSec: number, rampSec = 0.7): number {
  const start = zoom.startAtSec ?? 0;
  if (localSec < start) return 1;
  const t = Math.min(1, (localSec - start) / Math.max(0.01, rampSec));
  // smoothstep-ish
  const ease = t * t * (3 - 2 * t);
  return 1 + (zoom.scale - 1) * ease;
}
