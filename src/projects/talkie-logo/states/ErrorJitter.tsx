/**
 * error-jitter: yellow square stays put, but every ~1.4s exhibits a 4-frame
 * micro-translation cluster (±2u on x, ±1u on y). Like a registration mark
 * that's misaligned and twitches. Between jitters: dead still.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS, COLORS, MONO, tGeom } from './shared';

const CYCLE_MS = 1400;
const CYCLE_FRAMES = Math.round((CYCLE_MS / 1000) * FPS); // 84 frames
const JITTER_FRAMES = 4; // 4 frames of micro-translation
const JITTER_START_FRAME = CYCLE_FRAMES - JITTER_FRAMES - 2; // jitter near end of cycle
export const ERROR_JITTER_FRAMES = Math.ceil(CYCLE_FRAMES * 8); // ~8 cycles = 11.2s

// Deterministic pseudo-random jitter offsets per frame within the cluster
const JITTER_OFFSETS: Array<{ dx: number; dy: number }> = [
  { dx: 2, dy: -1 },
  { dx: -1.5, dy: 1 },
  { dx: 1, dy: 0.5 },
  { dx: -2, dy: -0.8 },
];

export const ErrorJitter: React.FC = () => {
  const frame = useCurrentFrame();
  const g = tGeom(600);

  const withinCycle = frame % CYCLE_FRAMES;
  let dx = 0;
  let dy = 0;

  if (withinCycle >= JITTER_START_FRAME && withinCycle < JITTER_START_FRAME + JITTER_FRAMES) {
    const jitterIdx = withinCycle - JITTER_START_FRAME;
    const offset = JITTER_OFFSETS[jitterIdx];
    dx = offset.dx;
    dy = offset.dy;
  }

  const squareSize = g.dotR * 2;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        <rect
          x={g.stemCx - g.dotR + dx}
          y={g.dotCy - g.dotR + dy}
          width={squareSize}
          height={squareSize}
          fill={COLORS.cautionYellow}
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
