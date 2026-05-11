/**
 * HermesEffects — cinematic overlay layer for Remotion compositions.
 *
 * Translates the hyperframes-toolkit holographic + chromatic-flow WebGL shaders
 * into frame-accurate React/SVG for use anywhere inside a Remotion AbsoluteFill.
 *
 * Effects (all driven by `useCurrentFrame`, zero CSS animations):
 *   1. Film grain      — feTurbulence noise, seed advances per frame
 *   2. Scanlines       — moving lit band + static 3px grid texture
 *   3. Holographic     — rotating conic rainbow (approximates the GLSL iridescent shimmer)
 *   4. Teal grade      — screen-blend teal highlight lift
 *   5. Orange grade    — multiply-blend amber shadow warmth
 *   6. Vignette        — radial edge darkening
 *   7. CA filter defs  — SVG <filter> for chromatic aberration; use `caFilterId` on child elements
 *
 * Usage:
 *   <AbsoluteFill>
 *     <YourContent />
 *     <HermesEffects />                    // defaults — drop anywhere
 *     <HermesEffects holoIntensity={0.4} tealStrength={0.15} />
 *   </AbsoluteFill>
 *
 *   // Applying CA to a specific element:
 *   import { HERMES_CA_FILTER_ID } from './HermesEffects'
 *   <div style={{ filter: `url(#${HERMES_CA_FILTER_ID})` }}>...</div>
 */

import React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'

export const HERMES_CA_FILTER_ID = 'hermes-ca'
export const HERMES_GRAIN_FILTER_ID = 'hermes-grain'

export interface HermesConfig {
  /** 0–1. Rainbow shimmer intensity. Default 0.28. */
  holoIntensity?: number
  /** Degrees per second the conic gradient rotates. Default 20. */
  holoSpeed?: number
  /** Chromatic aberration max pixel shift at frame edges. Default 3.5. */
  chromaShift?: number
  /** 0–1. Film grain strength. Default 0.20. */
  grainIntensity?: number
  /** 0–1. Moving scanline band opacity. Default 0.55. */
  scanlineOpacity?: number
  /** 0–1. Static scanline grid opacity. Default 0.07. */
  scanlineGridOpacity?: number
  /** px/frame. Scanline travel speed. Default 2.5 (matches existing compositions). */
  scanlineSpeed?: number
  /** 0–1. Teal screen-blend highlight grade strength. Default 0.10. */
  tealStrength?: number
  /** 0–1. Orange multiply-blend shadow warmth. Default 0.07. */
  orangeStrength?: number
  /** 0–1. Vignette edge darkening. Default 0.48. */
  vignetteStrength?: number
}

export const HermesEffects: React.FC<HermesConfig> = ({
  holoIntensity    = 0.28,
  holoSpeed        = 20,
  chromaShift      = 3.5,
  grainIntensity   = 0.20,
  scanlineOpacity  = 0.55,
  scanlineGridOpacity = 0.07,
  scanlineSpeed    = 2.5,
  tealStrength     = 0.10,
  orangeStrength   = 0.07,
  vignetteStrength = 0.48,
}) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  // ── Holographic: conic gradient angle from frame
  // Matches the GLSL: hue = fract(angle/(2π) + dist*0.8 + time*0.05*angle_speed)
  // We drive rotation at holoSpeed°/s which approximates the continuous hue sweep.
  const holoAngle = (frame / fps) * holoSpeed

  // ── Chromatic aberration: 4-second sine breathing (from chromatic-flow)
  const caPeriod = 4 * fps
  const caPhase  = (frame % caPeriod) / caPeriod   // 0…1
  // peaks at 0.25 and 0.75 (same as chromatic-flow's 0→max→0→max→0 bake)
  const caShift  = chromaShift * (0.35 + 0.65 * Math.abs(Math.sin(caPhase * Math.PI * 2)))

  // ── Scanline
  const scanlineY = (frame * scanlineSpeed) % height

  // ── Film grain: per-frame seed so each frame is unique noise
  const grainSeed = (frame * 7 + 31) & 0xffff

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* ── SVG filter defs (zero-size, invisible) ──────────────────────── */}
      <svg width={0} height={0} style={{ position: 'absolute', overflow: 'visible' }}>
        <defs>
          {/* Chromatic aberration: radial R/B channel split (from chromatic-flow GLSL) */}
          <filter
            id={HERMES_CA_FILTER_ID}
            x="-8%" y="-8%" width="116%" height="116%"
            colorInterpolationFilters="sRGB"
          >
            {/* Extract R-only */}
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              in="SourceGraphic"
              result="rOnly"
            />
            <feOffset in="rOnly" dx={caShift} dy="0" result="rShifted" />
            {/* Extract G-only (no shift) */}
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              in="SourceGraphic"
              result="gOnly"
            />
            {/* Extract B-only */}
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              in="SourceGraphic"
              result="bOnly"
            />
            <feOffset in="bOnly" dx={-caShift} dy="0" result="bShifted" />
            {/* Additive recombine via screen blend (correct for single-channel sources) */}
            <feBlend in="rShifted" in2="gOnly" mode="screen" result="rg" />
            <feBlend in="rg" in2="bShifted" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* ── Film grain ───────────────────────────────────────────────────── */}
      <svg
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: 'soft-light',
          opacity: grainIntensity,
        }}
      >
        <defs>
          <filter id={HERMES_GRAIN_FILTER_ID} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.62 0.65"
              numOctaves="3"
              seed={grainSeed}
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          width={width}
          height={height}
          filter={`url(#${HERMES_GRAIN_FILTER_ID})`}
          fill="white"
        />
      </svg>

      {/* ── Scanline grid texture ────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.055) 0px, rgba(0,0,0,0.055) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply',
          opacity: scanlineGridOpacity,
        }}
      />

      {/* ── Moving scanline band ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: scanlineY,
          height: 2,
          background:
            'linear-gradient(to right, transparent 0%, rgba(180,255,240,0.22) 20%, rgba(255,255,255,0.48) 50%, rgba(180,255,240,0.22) 80%, transparent 100%)',
          boxShadow: '0 0 14px 6px rgba(0,220,200,0.10)',
          mixBlendMode: 'screen',
          opacity: scanlineOpacity,
        }}
      />

      {/* ── Holographic shimmer ───────────────────────────────────────────── */}
      {/* Approximates the GLSL iridescent overlay: rotating hue mapped by polar angle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `conic-gradient(from ${holoAngle}deg at 50% 50%,
            hsl(175,100%,72%), hsl(200,100%,70%), hsl(240,100%,72%),
            hsl(290,100%,70%), hsl(330,100%,72%), hsl(15,100%,70%),
            hsl(45,100%,72%),  hsl(90,100%,70%),  hsl(140,100%,72%),
            hsl(175,100%,72%))`,
          mixBlendMode: 'screen',
          opacity: holoIntensity * 0.42,
        }}
      />
      {/* Radial fade: stronger rainbow toward center, matching the dist modulation */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.72) 100%)',
          mixBlendMode: 'multiply',
          opacity: holoIntensity * 0.9,
          // This masks the holo shimmer to be stronger in the centre (like dist modulation)
        }}
      />

      {/* ── Teal color grade — highlights ────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgb(0, 168, 148)',
          mixBlendMode: 'screen',
          opacity: tealStrength,
        }}
      />

      {/* ── Orange warmth — shadow fill ───────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgb(210, 88, 20)',
          mixBlendMode: 'multiply',
          opacity: orangeStrength,
        }}
      />

      {/* ── Vignette ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,${vignetteStrength}) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  )
}
