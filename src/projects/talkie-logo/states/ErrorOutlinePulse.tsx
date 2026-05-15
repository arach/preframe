/**
 * error-outline-pulse: square renders as outline only (no fill).
 * mm-f-breath stroke-width + opacity envelope. 4.4s cycle.
 * Quieter than jitter. Communicates "off-register" without urgency.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS, COLORS, MONO, tGeom, outlineBreathEnvelope } from './shared';

const CYCLE_MS = 4400;
const CYCLE_FRAMES = Math.round((CYCLE_MS / 1000) * FPS); // 264 frames
export const ERROR_OUTLINE_PULSE_FRAMES = Math.ceil(CYCLE_FRAMES * 2.5);

export const ErrorOutlinePulse: React.FC = () => {
  const frame = useCurrentFrame();
  const g = tGeom(600);

  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;
  const env = outlineBreathEnvelope(phase);

  const squareSize = g.dotR * 2;
  // Scale stroke width for the SVG coordinate space (g.size=600 context)
  const strokeW = env.strokeWidth * 2.5; // ~1.5–4.6 px in SVG space

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        <rect
          x={g.stemCx - g.dotR}
          y={g.dotCy - g.dotR}
          width={squareSize}
          height={squareSize}
          fill="none"
          stroke={COLORS.cautionYellow}
          strokeWidth={strokeW}
          opacity={env.opacity}
        />
        <text
          x={g.anchorX}
          y={g.baseline}
          textAnchor="middle"
          fontFamily={MONO}
          fontWeight={400}
          fontSize={g.size * 0.78}
          fill={COLORS.studioCream}
        >
          t
        </text>
      </svg>
    </AbsoluteFill>
  );
};
