/**
 * PromptCard — opening directive slate.
 *
 * Centered terminal card that types out a one-sentence narrative arc to
 * frame the rest of the reel. Calm-rules:
 *   - No blinking cursor: solid block visible only while typing, gone after.
 *   - No blinking dot: status indicator is a solid color.
 *   - No moving scanline: the dim grid is the only background texture.
 *
 * Typical usage at the head of a composition:
 *   <Sequence durationInFrames={preSlateFrames}>
 *     <PromptCard
 *       statusLabel="memo reel"
 *       path="SCOUT / MEMO 30s"
 *       text="30-second walkthrough of the Scout monitoring dashboard..."
 *     />
 *   </Sequence>
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  ACCENT,
  BG,
  CREAM,
  HUD,
  HUD_DIM,
  MONO,
  TRACKING,
  TYPE,
} from './tokens';
import { TerminalCard } from './TerminalCard';

export interface PromptCardProps {
  /** Status label, shown uppercase next to the solid status dot. */
  statusLabel: string;
  /** Breadcrumb path on the right of the chrome strip. */
  path?: string;
  /** Body text that gets revealed character-by-character. */
  text: string;
  /** Solid color of the status dot + typing block. */
  accent?: string;
  /** Card width (px). */
  width?: number;
  /** Tagline shown in the footer-left. */
  tagline?: string;
  /** When typing should start (frames from sequence start). Default 18. */
  typeStart?: number;
  /** How long typing should take (frames). Default 65. */
  typeFrames?: number;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  statusLabel,
  path,
  text,
  accent = ACCENT,
  width = 760,
  tagline,
  typeStart = 18,
  typeFrames = 65,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Single fade-in, single fade-out — calm.
  const fadeIn = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 0.6 * fps, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacity = fadeIn * fadeOut;

  const cardY = interpolate(frame, [0, 0.6 * fps], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Typewriter — clamped, then static.
  const charsVisible = Math.floor(
    interpolate(frame, [typeStart, typeStart + typeFrames], [0, text.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const stillTyping = charsVisible < text.length;

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Subtle grid texture — static, no animation */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.025 * opacity,
          backgroundImage: `
            linear-gradient(rgba(160, 170, 190, 0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(160, 170, 190, 0.35) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div style={{ transform: `translateY(${cardY}px)`, opacity }}>
        <TerminalCard
          statusColor={accent}
          statusLabel={statusLabel}
          path={path}
          width={width}
          footerLeft={tagline}
          footerRight={`${charsVisible} / ${text.length} chars`}
        >
          <div
            style={{
              color: CREAM,
              fontSize: TYPE.cardBody,
              lineHeight: 1.7,
              fontWeight: 400,
              letterSpacing: '0.02em',
              fontFamily: MONO,
              minHeight: 100,
            }}
          >
            <span style={{ color: HUD_DIM }}>{'› '}</span>
            {text.slice(0, charsVisible)}
            {stillTyping && (
              <span style={{ color: accent, opacity: 0.85, fontWeight: 300 }}>▎</span>
            )}
          </div>
        </TerminalCard>
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
