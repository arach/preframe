/**
 * error-wink: yellow square collapses on a 3-axis asymmetric event every ~3s.
 * Borrowed from mm-b-wink. Reads as "this state is trying to fix itself."
 * The skew is the tell — not a pulse, not a bounce.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS, COLORS, MONO, tGeom, winkEnvelope } from './shared';

const CYCLE_MS = 3200;
const CYCLE_FRAMES = Math.round((CYCLE_MS / 1000) * FPS); // 192 frames
export const ERROR_WINK_FRAMES = Math.ceil(CYCLE_FRAMES * 3.5); // ~3.5 cycles

export const ErrorWink: React.FC = () => {
  const frame = useCurrentFrame();
  const g = tGeom(600);

  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;
  const w = winkEnvelope(phase);

  const squareSize = g.dotR * 2;
  const cx = g.stemCx;
  const cy = g.dotCy;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        <g transform={`translate(${cx}, ${cy + w.translateY})`}>
          <rect
            x={-g.dotR * w.scaleX}
            y={-g.dotR * w.scaleY}
            width={squareSize * w.scaleX}
            height={squareSize * w.scaleY}
            fill={COLORS.cautionYellow}
            transform={`skewY(${w.skewY})`}
          />
        </g>
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
