/**
 * processing-pulse-pair: two dots on mm-a-breath envelope, 180deg out of phase.
 * One inhales while the other exhales. Mass-conservation without symmetric oscillation.
 * 3.6s cycle. Dots sit side-by-side at fixed positions (no horizontal movement).
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS, COLORS, MONO, tGeom, breathEnvelope } from './shared';

const CYCLE_MS = 3600;
const CYCLE_FRAMES = (CYCLE_MS / 1000) * FPS; // 216 frames
const DOT_SPREAD = 1.6; // distance between dot centers as multiple of dotR
export const PROCESSING_PULSE_PAIR_FRAMES = Math.ceil(CYCLE_FRAMES * 3); // ~3 cycles

export const ProcessingPulsePair: React.FC = () => {
  const frame = useCurrentFrame();
  const g = tGeom(600);
  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;

  // Left dot: on-phase. Right dot: 180deg (0.5) offset.
  const leftScale = breathEnvelope(phase);
  const rightScale = breathEnvelope((phase + 0.5) % 1);

  // Compress to a tighter amplitude range for the indicator context
  // Raw: 0.92–1.06. We want visible but not dramatic.
  const compress = (s: number) => 0.7 + ((s - 0.92) / (1.06 - 0.92)) * 0.6;

  const spread = g.dotR * DOT_SPREAD;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        <circle
          cx={g.stemCx - spread * 0.5}
          cy={g.dotCy}
          r={g.dotR * compress(leftScale)}
          fill={COLORS.cassetteOrange}
        />
        <circle
          cx={g.stemCx + spread * 0.5}
          cy={g.dotCy}
          r={g.dotR * compress(rightScale)}
          fill={COLORS.cassetteOrange}
        />
        <text
          x={g.anchorX}
          y={g.baseline}
          textAnchor="middle"
          fontFamily={MONO}
          fontWeight={500}
          fontSize={g.size * 0.78}
          fill={COLORS.studioCream}
        >
          t
        </text>
      </svg>
    </AbsoluteFill>
  );
};
