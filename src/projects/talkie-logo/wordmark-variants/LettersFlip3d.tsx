/** letters-flip-3d: each letter does a 90° Y-axis rotation via scaleX trick. Stagger 0.14s. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STAGGER = 0.14 * FPS;
const FLIP_DURATION = 0.28 * FPS;
const CELL_WIDTHS = [600, 600, 600, 600, 340, 600];

export const WordmarkFlip3d: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => {
          const start = i * STAGGER;
          const p = interpolate(frame, [start, start + FLIP_DURATION], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
          });
          // scaleX: 0 (edge-on) → 1 (face-on). Simulate Y-axis rotation.
          const scaleX = Math.abs(Math.sin(p * Math.PI * 0.5));
          const opacity = p > 0 ? 1 : 0;
          const cx = s.letterPositions[i] + CELL_WIDTHS[i] * s.u * 0.5;
          return (
            <g key={letter} transform={`translate(${cx},0) scale(${scaleX},1) translate(${-cx},0)`} opacity={opacity}>
              <text x={s.letterPositions[i]} y={s.baseline}
                fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
                fill={COLORS.studioCream}
              >{letter}</text>
            </g>
          );
        })}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
      </svg>
    </AbsoluteFill>
  );
};
