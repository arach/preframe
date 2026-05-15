/**
 * processing-tape-flow: two fixed dots with a thin tape line sweeping
 * between them. The line suggests tape transport from reel to reel.
 * 2.4s base cycle with asymmetric easing (slow start, faster middle, ease at end).
 */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FPS, COLORS, MONO, tGeom } from './shared';

const CYCLE_MS = 2400;
const CYCLE_FRAMES = (CYCLE_MS / 1000) * FPS; // 144 frames
const DOT_SPREAD = 1.8;
export const PROCESSING_TAPE_FLOW_FRAMES = Math.ceil(CYCLE_FRAMES * 4); // ~4 cycles

export const ProcessingTapeFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const g = tGeom(600);
  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;

  const spread = g.dotR * DOT_SPREAD;
  const leftCx = g.stemCx - spread * 0.5;
  const rightCx = g.stemCx + spread * 0.5;

  // Tape line sweeps left→right on first half, right→left on second half
  // Asymmetric easing: cubic ease for organic feel
  let tapeX: number;
  let tapeOpacity: number;
  if (phase < 0.5) {
    const p = phase / 0.5; // 0→1
    const eased = Easing.bezier(0.25, 0.1, 0.25, 1)(p);
    tapeX = leftCx + (rightCx - leftCx) * eased;
    // Fade in at start, full in middle, fade as approaching right
    tapeOpacity = interpolate(p, [0, 0.15, 0.85, 1], [0, 0.9, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else {
    const p = (phase - 0.5) / 0.5; // 0→1
    const eased = Easing.bezier(0.25, 0.1, 0.25, 1)(p);
    tapeX = rightCx + (leftCx - rightCx) * eased;
    tapeOpacity = interpolate(p, [0, 0.15, 0.85, 1], [0, 0.9, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  // Dots have subtle scale modulation — receiving reel swells slightly
  const receiverSwell = 1.08;
  const senderShrink = 0.92;
  let leftDotScale: number;
  let rightDotScale: number;
  if (phase < 0.5) {
    const p = phase / 0.5;
    leftDotScale = interpolate(p, [0, 1], [1, senderShrink]);
    rightDotScale = interpolate(p, [0, 1], [1, receiverSwell]);
  } else {
    const p = (phase - 0.5) / 0.5;
    leftDotScale = interpolate(p, [0, 1], [senderShrink, 1]);
    rightDotScale = interpolate(p, [0, 1], [receiverSwell, 1]);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        {/* Left reel dot */}
        <circle
          cx={leftCx}
          cy={g.dotCy}
          r={g.dotR * leftDotScale}
          fill={COLORS.cassetteOrange}
        />
        {/* Right reel dot */}
        <circle
          cx={rightCx}
          cy={g.dotCy}
          r={g.dotR * rightDotScale}
          fill={COLORS.cassetteOrange}
        />
        {/* Tape transport line */}
        <line
          x1={tapeX - g.dotR * 0.3}
          y1={g.dotCy}
          x2={tapeX + g.dotR * 0.3}
          y2={g.dotCy}
          stroke={COLORS.cassetteOrange}
          strokeWidth={1.5}
          opacity={tapeOpacity}
          strokeLinecap="round"
        />
        {/* Connecting tape line between reels (thin, subtle) */}
        <line
          x1={leftCx}
          y1={g.dotCy}
          x2={rightCx}
          y2={g.dotCy}
          stroke={COLORS.cassetteOrange}
          strokeWidth={0.8}
          opacity={0.15}
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
