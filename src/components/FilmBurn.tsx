import React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'

const GRAIN_FILTER_ID = 'filmburn-grain'

export interface FilmBurnConfig {
  grainStrength?: number
  vignetteAmount?: number
  tint?: 'warm' | 'cool' | 'none'
  burnIn?: number
  scratchIntensity?: number
}

export const FilmBurn: React.FC<FilmBurnConfig> = ({
  grainStrength = 0.30,
  vignetteAmount = 0.55,
  tint = 'warm',
  burnIn = 1,
  scratchIntensity = 0.08,
}) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  const grainSeed = (frame * 13 + 47) & 0xffff

  // Scratch drifts slowly left-to-right using a low-frequency sine
  const scratchX = 50 + 40 * Math.sin(frame * 0.018 + 1.3)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 100,
        opacity: burnIn,
      }}
    >
      {/* Film grain — coarser, softer noise than HermesEffects */}
      <svg
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: 'overlay',
          opacity: grainStrength,
        }}
      >
        <defs>
          <filter id={GRAIN_FILTER_ID} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.42 0.44"
              numOctaves="4"
              seed={grainSeed}
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} filter={`url(#${GRAIN_FILTER_ID})`} fill="white" />
      </svg>

      {/* Vignette — heavier than HermesEffects, more oval */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,${vignetteAmount}) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Warm tint — amber shadows */}
      {tint === 'warm' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgb(200,120,40)',
            mixBlendMode: 'multiply',
            opacity: 0.12,
          }}
        />
      )}

      {/* Cool tint — desaturated blue-grey */}
      {tint === 'cool' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgb(60,80,120)',
            mixBlendMode: 'screen',
            opacity: 0.08,
          }}
        />
      )}

      {/* Vertical scratch line */}
      {scratchIntensity > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${scratchX}%`,
            width: 1,
            background: `linear-gradient(to bottom,
              transparent 0%,
              rgba(255,245,220,${scratchIntensity * 0.6}) 15%,
              rgba(255,245,220,${scratchIntensity}) 40%,
              rgba(255,245,220,${scratchIntensity * 0.7}) 70%,
              transparent 100%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  )
}
