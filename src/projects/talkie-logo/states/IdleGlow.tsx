/**
 * idle-glow: dot at baseline radius, opacity oscillates 0.55↔0.78
 * on mm-a-breath curve. NO scale — pure opacity ambient glow. 4.8s cycle.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS, COLORS, MONO, tGeom, breathEnvelope } from './shared';

const CYCLE_MS = 4800;
const CYCLE_FRAMES = (CYCLE_MS / 1000) * FPS; // 288 frames
const OPACITY_LOW = 0.55;
const OPACITY_HIGH = 0.78;
export const IDLE_GLOW_FRAMES = Math.ceil(CYCLE_FRAMES * 2.5);

export const IdleGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const g = tGeom(600);
  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;
  const rawScale = breathEnvelope(phase);
  // Map breath envelope (0.92–1.06) → opacity range
  const normalized = (rawScale - 0.92) / (1.06 - 0.92);
  const opacity = OPACITY_LOW + normalized * (OPACITY_HIGH - OPACITY_LOW);

  const dotR = g.dotR * 0.78;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        <circle
          cx={g.stemCx}
          cy={g.dotCy}
          r={dotR}
          fill={COLORS.tapeTan}
          opacity={opacity}
        />
        <text
          x={g.anchorX}
          y={g.baseline}
          textAnchor="middle"
          fontFamily={MONO}
          fontWeight={400}
          fontSize={g.size * 0.78}
          fill={COLORS.tapeTan}
        >
          t
        </text>
      </svg>
    </AbsoluteFill>
  );
};
