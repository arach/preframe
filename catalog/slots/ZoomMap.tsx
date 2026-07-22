'use client';

/**
 * Secondary zoom map — full-frame source with the active viewport drawn on top.
 * Not a full timeline editor; helps answer "why is it zoomed here?" while scrubbing.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Eye, EyeOff } from 'lucide-react';
import type { ReviewNote } from '../../lib/types';
import {
  scaleAtLocalTime,
  viewportFromZoom,
  zoomFromRect,
  type PlanClipZoom,
  type ZoomSpec,
} from '../../lib/zoom-map';

export interface ZoomMapModel {
  /** Source video URL (full frame) */
  src: string | null;
  /** Current time on the source / review video (seconds) */
  currentTime: number;
  /** Active zoom (composition plan or derived from note) */
  zoom: ZoomSpec | null;
  /** Local time within the zoomed clip (for ramp) */
  localTime?: number;
  label?: string;
  /** Review zoom notes to show as secondary rects */
  noteRects?: Array<{ rect: { x: number; y: number; w: number; h: number }; label?: string }>;
}

export function ZoomMapPanel({
  model,
  compact = false,
}: {
  model: ZoomMapModel;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(true);

  const effectiveScale = useMemo(() => {
    if (!model.zoom) return 1;
    const local = model.localTime ?? model.currentTime;
    return scaleAtLocalTime(model.zoom, local);
  }, [model.zoom, model.localTime, model.currentTime]);

  const viewport = useMemo(() => {
    if (!model.zoom || effectiveScale <= 1.01) return null;
    return viewportFromZoom({ ...model.zoom, scale: effectiveScale });
  }, [model.zoom, effectiveScale]);

  // Keep map video in sync (pause + seek)
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !model.src) return;
    el.pause();
    if (Math.abs(el.currentTime - model.currentTime) > 0.12) {
      try {
        el.currentTime = model.currentTime;
      } catch {
        /* ignore seek race */
      }
    }
  }, [model.currentTime, model.src]);

  if (!model.src) return null;

  return (
    <div
      className={`shrink-0 border-t border-white/[0.06] bg-black/50 ${
        compact ? '' : ''
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Crosshair size={11} className="text-amber-300/70" />
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/40">
          Zoom map
        </span>
        {model.label && (
          <span className="text-[10px] font-mono text-white/35 truncate max-w-[40%]">
            {model.label}
          </span>
        )}
        {model.zoom && (
          <span className="text-[10px] font-mono text-amber-200/70 tabular-nums">
            ×{effectiveScale.toFixed(2)} · origin{' '}
            {(model.zoom.originX > 1 ? model.zoom.originX / 100 : model.zoom.originX).toFixed(2)},
            {(model.zoom.originY > 1 ? model.zoom.originY / 100 : model.zoom.originY).toFixed(2)}
            {model.zoom.startAtSec != null ? ` · t+${model.zoom.startAtSec}s` : ''}
          </span>
        )}
        {!model.zoom && !model.noteRects?.length && (
          <span className="text-[10px] font-mono text-white/25">no active zoom</span>
        )}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="ml-auto p-1 rounded-sm text-white/35 hover:text-white/70 hover:bg-white/[0.04]"
          title={open ? 'Hide map' : 'Show map'}
        >
          {open ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 flex gap-3 items-start">
          <div
            className="relative bg-black border border-white/[0.08] rounded-sm overflow-hidden"
            style={{ width: compact ? 200 : 280, aspectRatio: '16 / 9' }}
          >
            <video
              ref={videoRef}
              src={model.src}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-contain"
            />
            {/* Full-frame grid hint */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
            </div>
            {/* Active viewport */}
            {viewport && (
              <div
                className="absolute border-2 border-amber-400 bg-amber-400/10 pointer-events-none rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                style={{
                  left: `${viewport.x * 100}%`,
                  top: `${viewport.y * 100}%`,
                  width: `${viewport.w * 100}%`,
                  height: `${viewport.h * 100}%`,
                }}
                title="Visible window after zoom"
              >
                <span className="absolute -top-4 left-0 text-[9px] font-mono text-amber-300/90 whitespace-nowrap">
                  viewport
                </span>
              </div>
            )}
            {/* Note rects (desired zoom regions) */}
            {model.noteRects?.map((n, i) => (
              <div
                key={i}
                className="absolute border border-dashed border-cyan-400/70 bg-cyan-400/5 pointer-events-none"
                style={{
                  left: `${n.rect.x * 100}%`,
                  top: `${n.rect.y * 100}%`,
                  width: `${n.rect.w * 100}%`,
                  height: `${n.rect.h * 100}%`,
                }}
                title={n.label || 'note'}
              />
            ))}
          </div>

          <div className="flex-1 min-w-0 text-[10px] font-mono text-white/40 space-y-1.5 py-0.5 leading-relaxed">
            <p className="text-white/50">
              Full frame with the crop that the zoom is actually showing (amber).
            </p>
            {viewport && model.zoom && (
              <p>
                At this time the viewer only sees ~{Math.round(viewport.w * 100)}%×
                {Math.round(viewport.h * 100)}% of the source around (
                {(model.zoom.originX > 1 ? model.zoom.originX / 100 : model.zoom.originX).toFixed(2)},
                {(model.zoom.originY > 1 ? model.zoom.originY / 100 : model.zoom.originY).toFixed(2)}
                ).
              </p>
            )}
            {model.noteRects && model.noteRects.length > 0 && (
              <p className="text-cyan-300/50">
                Dashed cyan = review zoom notes (requested emphasis regions).
              </p>
            )}
            <p className="text-white/28">
              Pause · scrub · compare · talk about it in Craft. Prefer ×1.12–1.35 for UI demos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Build a map model from review notes near the playhead. */
export function modelFromReviewNotes(
  src: string | null,
  currentTime: number,
  notes: ReviewNote[],
): ZoomMapModel {
  const near = notes.filter(
    n =>
      n.kind === 'zoom' &&
      n.rect &&
      n.time != null &&
      Math.abs((n.time as number) - currentTime) < 2.5,
  );
  const primary = near[0];
  let zoom: ZoomSpec | null = null;
  if (primary?.rect) {
    zoom = zoomFromRect(primary.rect);
  }
  return {
    src,
    currentTime,
    zoom,
    label: primary ? `note @ ${primary.time?.toFixed(1)}s` : undefined,
    noteRects: notes
      .filter(n => n.kind === 'zoom' && n.rect)
      .map(n => ({
        rect: n.rect!,
        label: n.comment || 'zoom',
      })),
  };
}

/** Build a map model from composition plan clips at composition time t. */
export function modelFromPlanClips(
  compositionTime: number,
  clips: PlanClipZoom[],
  resolveSrc: (src: string) => string | null,
): ZoomMapModel | null {
  if (!clips.length) return null;
  const active =
    clips.find(c => {
      const start = c.timelineStartSec ?? 0;
      return compositionTime >= start && compositionTime < start + c.duration;
    }) ?? null;
  if (!active) {
    return {
      src: null,
      currentTime: 0,
      zoom: null,
      label: 'outside clips',
    };
  }
  const local = compositionTime - (active.timelineStartSec ?? 0);
  const sourceTime = active.startFrom + local;
  return {
    src: resolveSrc(active.src),
    currentTime: sourceTime,
    localTime: local,
    zoom: active.zoom ?? null,
    label: active.label,
  };
}
