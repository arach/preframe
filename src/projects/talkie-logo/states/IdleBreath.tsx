/**
 * idle-breath: dot breathes on mm-a-breath envelope at ~3% amplitude.
 * r=dotR*0.78, opacity 0.65 baseline. 5.5s cycle.
 * At 1m: barely moving. At 30cm: perceptible rhythm.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS, COLORS, MONO, tGeom, breathEnvelope } from './shared';

const CYCLE_MS = 5500;
const CYCLE_FRAMES = (CYCLE_MS / 1000) * FPS; // 330 frames
const AMPLITUDE = 0.03; // 3% scale amplitude (centered on 1.0)
export const IDLE_BREATH_FRAMES = Math.ceil(CYCLE_FRAMES * 2.5); // ~2.5 cycles

export const IdleBreath: React.FC = () => {
  const frame = useCurrentFrame();
  const g = tGeom(600);
  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;
  const rawScale = breathEnvelope(phase);
  // Compress: raw range is ~0.92–1.06 (14% swing). We want 3%.
  // Normalize to 0–1, then remap to 1 ± amplitude/2.
  const normalized = (rawScale - 0.92) / (1.06 - 0.92);
  const scale = 1 + (normalized - 0.5) * AMPLITUDE * 2;

  const dotR = g.dotR * 0.78;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        <circle
          cx={g.stemCx}
          cy={g.dotCy}
          r={dotR * scale}
          fill={COLORS.tapeTan}
          opacity={0.65}
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
