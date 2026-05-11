/**
 * GlassPanel — glass morphism UI panel for the Hermes aesthetic.
 *
 * Inspired by the Hermes reel's cinematic glass overlays: frosted dark glass,
 * teal-tinted borders, holographic border shimmer, inner highlight.
 *
 * The panel optionally applies chromatic aberration to its contents via the
 * HERMES_CA_FILTER_ID SVG filter that HermesEffects injects into the document.
 * Mount <HermesEffects /> in the same Remotion composition to enable CA.
 *
 * Usage:
 *   <GlassPanel x={100} y={200} w={480} h={280}>
 *     <text>content</text>
 *   </GlassPanel>
 *
 *   <GlassPanel x={100} y={200} w={480} h={280} tint="teal" shimmer frame={frame} fps={fps} />
 */

import React from 'react'
import { HERMES_CA_FILTER_ID } from './HermesEffects'

export type GlassTint = 'neutral' | 'teal' | 'orange' | 'deep'

export interface GlassPanelProps {
  x: number
  y: number
  w: number
  h: number
  r?: number           // corner radius, default 16
  tint?: GlassTint     // panel color mood, default 'neutral'
  shimmer?: boolean    // holographic border shimmer, default false
  ca?: boolean         // apply chromatic aberration, default false
  frame?: number       // required if shimmer=true (drives animation)
  fps?: number         // required if shimmer=true
  opacity?: number     // overall panel opacity, default 1
  children?: React.ReactNode
}

const TINT_CONFIGS: Record<GlassTint, { bg: string; border: string; topHighlight: string }> = {
  neutral: {
    bg:           'rgba(10, 18, 24, 0.60)',
    border:       'rgba(255, 255, 255, 0.10)',
    topHighlight: 'rgba(255, 255, 255, 0.06)',
  },
  teal: {
    bg:           'rgba(4, 26, 28, 0.68)',
    border:       'rgba(0, 210, 185, 0.28)',
    topHighlight: 'rgba(0, 220, 195, 0.10)',
  },
  orange: {
    bg:           'rgba(28, 14, 4, 0.68)',
    border:       'rgba(240, 120, 40, 0.28)',
    topHighlight: 'rgba(240, 140, 60, 0.10)',
  },
  deep: {
    bg:           'rgba(6, 8, 18, 0.82)',
    border:       'rgba(100, 140, 255, 0.18)',
    topHighlight: 'rgba(140, 170, 255, 0.08)',
  },
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  x, y, w, h,
  r = 16,
  tint = 'neutral',
  shimmer = false,
  ca = false,
  frame = 0,
  fps = 30,
  opacity = 1,
  children,
}) => {
  const cfg = TINT_CONFIGS[tint]

  // Holographic border: rotating conic gradient at 14°/s
  const shimmerAngle = shimmer ? (frame / fps) * 14 : 0

  const caStyle = ca ? { filter: `url(#${HERMES_CA_FILTER_ID})` } : {}

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        opacity,
        overflow: 'hidden',
        ...caStyle,
      }}
    >
      {/* Glass base */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          background: cfg.bg,
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          border: shimmer ? 'none' : `1px solid ${cfg.border}`,
          boxSizing: 'border-box',
        }}
      />

      {/* Inner top highlight — subtle light from above */}
      <div
        style={{
          position: 'absolute',
          left: 1, right: 1, top: 1,
          height: Math.min(h * 0.22, 60),
          borderRadius: `${r - 1}px ${r - 1}px 0 0`,
          background: `linear-gradient(to bottom, ${cfg.topHighlight}, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Holographic shimmer border */}
      {shimmer && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: r,
            padding: 1,
            background: `conic-gradient(from ${shimmerAngle}deg,
              hsl(175,100%,65%), hsl(200,100%,65%), hsl(250,100%,65%),
              hsl(310,100%,65%), hsl(20,100%,65%),  hsl(60,100%,65%),
              hsl(130,100%,65%), hsl(175,100%,65%))`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: 0.45,
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* Content layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}
