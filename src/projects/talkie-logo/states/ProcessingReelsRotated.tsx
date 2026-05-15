/**
 * processing-twin-reels-rotated: two dots that suggest spinning tape reels.
 * Visible notch (small cutout) makes rotation legible.
 * Left reel 1.2x faster than right. Asymmetric pace: slow build, faster
 * middle, ease at end. 2.4s base cycle.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FPS, COLORS, MONO, tGeom } from './shared';

const CYCLE_MS = 2400;
const CYCLE_FRAMES = (CYCLE_MS / 1000) * FPS;
const DOT_SPREAD = 1.8;
export const PROCESSING_REELS_ROTATED_FRAMES = Math.ceil(CYCLE_FRAMES * 4);

export const ProcessingReelsRotated: React.FC = () => {
  const frame = useCurrentFrame();
  const g = tGeom(600);

  const spread = g.dotR * DOT_SPREAD;
  const leftCx = g.stemCx - spread * 0.5;
  const rightCx = g.stemCx + spread * 0.5;

  // Asymmetric rotation speed over cycle:
  // slow build (0-20%), faster middle (20-80%), ease at end (80-100%)
  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;
  const speedCurve = Easing.bezier(0.4, 0, 0.2, 1)(phase);
  const leftAngle = speedCurve * 360 * 1.2; // left is 1.2x faster
  const rightAngle = speedCurve * 360;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        {/* Left reel */}
        <g transform={`rotate(${leftAngle} ${leftCx} ${g.dotCy})`}>
          <circle cx={leftCx} cy={g.dotCy} r={g.dotR} fill={COLORS.cassetteOrange} />
          {/* Notch — small cutout circle near the edge to show rotation */}
          <circle
            cx={leftCx + g.dotR * 0.55}
            cy={g.dotCy}
            r={g.dotR * 0.22}
            fill={COLORS.ribbonBlack}
          />
        </g>

        {/* Right reel */}
        <g transform={`rotate(${-rightAngle} ${rightCx} ${g.dotCy})`}>
          <circle cx={rightCx} cy={g.dotCy} r={g.dotR} fill={COLORS.cassetteOrange} />
          <circle
            cx={rightCx + g.dotR * 0.55}
            cy={g.dotCy}
            r={g.dotR * 0.22}
            fill={COLORS.ribbonBlack}
          />
        </g>

        {/* Subtle connecting line */}
        <line
          x1={leftCx + g.dotR}
          y1={g.dotCy}
          x2={rightCx - g.dotR}
          y2={g.dotCy}
          stroke={COLORS.cassetteOrange}
          strokeWidth={0.8}
          opacity={0.12}
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
