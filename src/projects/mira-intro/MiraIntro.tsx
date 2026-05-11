/**
 * MiraIntro — 10s editorial intro for the Mira control-lanes demo.
 *
 * Story beats: observe → resolve → act → record.
 *
 * Composition:
 *   1. Runtime log types in line-by-line (Space Mono, white 70%)
 *   2. Log dissolves; thin teal corner-brackets snap to form an AX target frame
 *   3. Brackets expand; "Mira" wordmark resolves inside
 *   4. Small mono tag: action.app · agent runtime
 *   5. Fade to black
 */

import React from 'react'
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from 'remotion'

const FPS = 30
export const MIRA_INTRO_FRAMES = 10 * FPS // 300

const TEAL = 'rgba(0, 210, 185, 1)'
const TEAL_SOFT = 'rgba(0, 210, 185, 0.75)'

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

// ── Beat 1: runtime log ────────────────────────────────────────────
const LOG_LINES = ['observed', 'resolved', 'acted', 'recorded']
const LOG_INTERVAL = 18 // frames between each line appearing (0.6s)
const LOG_START = 12     // frame 12 — first line
const LOG_HOLD_END = 95  // when log starts to fade out

// ── Beat 2: AX target brackets ─────────────────────────────────────
const BRACKETS_IN = 110   // start drawing corner brackets
const BRACKETS_SNAP = 130 // they snap together
const BRACKETS_HOLD_END = 175

// ── Beat 3: Mira wordmark ──────────────────────────────────────────
const WORDMARK_IN = 170
const WORDMARK_HOLD = 220

// ── Beat 4: tag ────────────────────────────────────────────────────
const TAG_IN = 215
const TAG_HOLD = 270

// ── Beat 5: fade out ───────────────────────────────────────────────
const FADE_OUT_START = 285

interface LogLineProps {
  text: string
  index: number
  frame: number
}

const LogLine: React.FC<LogLineProps> = ({ text, index, frame }) => {
  const lineStart = LOG_START + index * LOG_INTERVAL
  const fadeIn = clamp((frame - lineStart) / 8)
  const fadeOut = clamp((LOG_HOLD_END + 15 - frame) / 15)
  const opacity = Math.min(fadeIn, fadeOut)

  // Subtle slide-up
  const yOffset = interpolate(
    frame,
    [lineStart, lineStart + 12],
    [4, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  )

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${yOffset}px)`,
        fontFamily: '"Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 24,
        letterSpacing: '0.04em',
        color: 'rgba(255, 255, 255, 0.72)',
        lineHeight: 1.9,
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
      }}
    >
      <span style={{ color: TEAL_SOFT, fontSize: 22 }}>▸</span>
      <span>{text}</span>
    </div>
  )
}

// AX-style corner bracket: looks like ┌ ┐ └ ┘ with a short arm length
const CornerBracket: React.FC<{
  size?: number
  thickness?: number
  position: 'tl' | 'tr' | 'bl' | 'br'
}> = ({ size = 18, thickness = 2, position }) => {
  const arm: React.CSSProperties = { background: TEAL, position: 'absolute' }
  const horiz = { ...arm, width: size, height: thickness }
  const vert  = { ...arm, width: thickness, height: size }

  if (position === 'tl') return (<><div style={{ ...horiz, top: 0, left: 0 }} /><div style={{ ...vert, top: 0, left: 0 }} /></>)
  if (position === 'tr') return (<><div style={{ ...horiz, top: 0, right: 0 }} /><div style={{ ...vert, top: 0, right: 0 }} /></>)
  if (position === 'bl') return (<><div style={{ ...horiz, bottom: 0, left: 0 }} /><div style={{ ...vert, bottom: 0, left: 0 }} /></>)
  return (<><div style={{ ...horiz, bottom: 0, right: 0 }} /><div style={{ ...vert, bottom: 0, right: 0 }} /></>)
}

export const MiraIntro: React.FC = () => {
  const frame = useCurrentFrame()

  // ── Background fade-up from black at start
  const bgVignetteAlpha = interpolate(
    frame,
    [0, 30],
    [0.6, 0.92],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // ── Beat 2: AX bracket reveal
  // Brackets start as small pulses in corners, then snap to position by BRACKETS_SNAP
  const bracketOpacity = clamp((frame - BRACKETS_IN) / 8) * clamp((310 - frame) / 30)
  const bracketBoxW = interpolate(
    frame,
    [BRACKETS_IN, BRACKETS_SNAP, WORDMARK_IN + 20],
    [120, 380, 480],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  )
  const bracketBoxH = interpolate(
    frame,
    [BRACKETS_IN, BRACKETS_SNAP, WORDMARK_IN + 20],
    [60, 120, 150],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  )
  // After WORDMARK_HOLD, brackets fade
  const bracketFinalOpacity = bracketOpacity * clamp((WORDMARK_HOLD + 25 - frame) / 18)

  // ── Beat 3: Mira wordmark
  const wordmarkOpacity = clamp((frame - WORDMARK_IN) / 12) * clamp((FADE_OUT_START + 10 - frame) / 12)
  const wordmarkY = interpolate(
    frame,
    [WORDMARK_IN, WORDMARK_IN + 18],
    [6, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  )

  // ── Beat 4: tag
  const tagOpacity = clamp((frame - TAG_IN) / 12) * clamp((FADE_OUT_START + 10 - frame) / 12)

  // ── Beat 5: final fade
  const globalOpacity = interpolate(
    frame,
    [FADE_OUT_START, FADE_OUT_START + 14],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  )

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', opacity: globalOpacity }}>

      {/* Subtle vignette — keeps the field from feeling flat */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(8,12,18,0) 30%, rgba(0,0,0,${bgVignetteAlpha}) 100%)`,
        }}
      />

      {/* Very faint grid texture — product/runtime feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,210,185,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,210,185,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
          opacity: 0.5,
        }}
      />

      {/* ── Beat 1: runtime log (centered-left) ────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: 340,
        }}
      >
        {LOG_LINES.map((line, i) => (
          <LogLine key={line} text={line} index={i} frame={frame} />
        ))}
      </div>

      {/* ── Beat 2: AX target brackets + Beat 3: Mira wordmark ────────── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: bracketBoxW,
          height: bracketBoxH,
          opacity: bracketFinalOpacity,
        }}
      >
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />

        {/* Tiny corner label, like an AX inspector */}
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: 0,
            fontFamily: '"Space Mono", ui-monospace, monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            color: TEAL_SOFT,
            textTransform: 'uppercase',
          }}
        >
          AX · resolved
        </div>
      </div>

      {/* Wordmark sits at the same center but separately so it persists past brackets */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, calc(-50% + ${wordmarkY}px))`,
          opacity: wordmarkOpacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
            fontSize: 92,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'rgba(255, 255, 255, 0.96)',
            lineHeight: 1,
          }}
        >
          Mira
        </div>
      </div>

      {/* ── Beat 4: tag below wordmark ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 'calc(50% + 78px)',
          transform: 'translateX(-50%)',
          opacity: tagOpacity,
          fontFamily: '"Space Mono", ui-monospace, monospace',
          fontSize: 13,
          letterSpacing: '0.22em',
          color: 'rgba(255, 255, 255, 0.42)',
          textTransform: 'lowercase',
          whiteSpace: 'nowrap',
        }}
      >
        action.app · agent runtime
      </div>

    </AbsoluteFill>
  )
}
