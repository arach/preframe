/**
 * TacticalFrame — corner-HUD overlay for the body of a reel.
 *
 * Draws four hairline guide rails (top/bottom/left/right) inset from the
 * edges, plus four corner labels:
 *   top-left:    title  —  subtitle
 *   top-right:   tech specs (e.g., "1944×1350  50fps  scout")
 *   bottom-left: version / build tag
 *   bottom-right: REC indicator (solid dot, no blink)
 *
 * Designed to live at the BODY level — a single fade in / fade out, not a
 * per-cut lifecycle.
 */
import React from 'react';
import {
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import {
  ACCENT,
  HUD,
  HUD_DIM,
  HUD_HAIRLINE,
  MONO,
  TRACKING,
  TYPE,
} from './tokens';

export interface TacticalFrameProps {
  /** Total body duration in frames — controls the overall fade envelope. */
  totalFrames: number;
  /** Top-left primary text. */
  title: string;
  /** Top-left secondary text (after the " — " separator). */
  subtitle?: string;
  /** Right-side stats. Rendered as space-separated chips. */
  stats?: string[];
  /** Bottom-left tag (e.g., "memo reel · v1"). */
  versionTag?: string;
  /** Bottom-right label next to the solid dot. Default "REC". */
  recLabel?: string;
  /** Solid color for the bottom-right indicator dot. */
  recColor?: string;
  /** Margin from the outer edges to the guide rails. */
  guideMargin?: number;
  /**
   * Sizing rectangle within the parent container, as percentages.
   *
   * Default 100% / 100% / 0 / 0 = fill the parent (preserves the original
   * behaviour where rails hug whatever container TacticalFrame lives in —
   * the canvas, or the screen of a MonitorFrame it's nested under).
   *
   * Shrinking these lets the tactical chrome sit *inside* a smaller area
   * (e.g. centered over a monitor's screen). Growing past 100% with
   * negative top/left lets the rails overflow the parent — useful for
   * framing a smaller monitor with tactical rails on the surrounding
   * canvas.
   */
  widthPct?: number;
  heightPct?: number;
  topPct?: number;
  leftPct?: number;
}

export const TacticalFrame: React.FC<TacticalFrameProps> = ({
  totalFrames,
  title,
  subtitle,
  stats,
  versionTag,
  recLabel = 'REC',
  recColor = ACCENT,
  guideMargin = 28,
  widthPct = 100,
  heightPct = 100,
  topPct = 0,
  leftPct = 0,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 18, totalFrames - 14, totalFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );

  const cornerStyle: React.CSSProperties = {
    position: 'absolute',
    fontFamily: MONO,
    fontSize: TYPE.hudCorner,
    letterSpacing: TRACKING.uppercaseTight,
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPct}%`,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        opacity,
        pointerEvents: 'none',
      }}
    >
      {/* Guide rails */}
      <div style={{ position: 'absolute', top: guideMargin, left: guideMargin, right: guideMargin, height: 1, background: HUD_HAIRLINE }} />
      <div style={{ position: 'absolute', bottom: guideMargin, left: guideMargin, right: guideMargin, height: 1, background: HUD_HAIRLINE }} />
      <div style={{ position: 'absolute', top: guideMargin, bottom: guideMargin, left: guideMargin, width: 1, background: HUD_HAIRLINE }} />
      <div style={{ position: 'absolute', top: guideMargin, bottom: guideMargin, right: guideMargin, width: 1, background: HUD_HAIRLINE }} />

      {/* Top-left: title — subtitle */}
      <div style={{ ...cornerStyle, top: guideMargin + 8, left: guideMargin + 10, gap: 10 }}>
        <span style={{ fontWeight: 600, color: '#d8d8e0' }}>{title}</span>
        {subtitle && (
          <>
            <span style={{ color: HUD_DIM, opacity: 0.6 }}>—</span>
            <span style={{ color: HUD }}>{subtitle}</span>
          </>
        )}
      </div>

      {/* Top-right: stats */}
      {stats && stats.length > 0 && (
        <div style={{ ...cornerStyle, top: guideMargin + 8, right: guideMargin + 10, gap: 12, color: HUD }}>
          {stats.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
      )}

      {/* Bottom-left: version tag */}
      {versionTag && (
        <div style={{ ...cornerStyle, bottom: guideMargin + 8, left: guideMargin + 10, color: HUD }}>
          {versionTag}
        </div>
      )}

      {/* Bottom-right: REC indicator (solid) */}
      <div style={{ ...cornerStyle, bottom: guideMargin + 8, right: guideMargin + 10, gap: 6, color: HUD }}>
        <span style={{ color: recColor, fontSize: 7, lineHeight: 1 }}>●</span>
        <span>{recLabel}</span>
      </div>
    </div>
  );
};
