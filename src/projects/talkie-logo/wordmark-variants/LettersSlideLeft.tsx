/** letters-slide-left: each letter slides in from the right of its final position. Stagger 0.08s. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STAGGER = 0.08 * FPS;
const ANIM_DURATION = 0.22 * FPS;
const CELL_WIDTHS = [600, 600, 600, 600, 340, 600];

export const WordmarkSlideLeft: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => {
          const start = i * STAGGER;
          const p = interpolate(frame, [start, start + ANIM_DURATION], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
          });
          const travel = CELL_WIDTHS[i] * s.u * 0.5;
          const translateX = (1 - p) * travel;
          const opacity = interpolate(frame, [start, start + ANIM_DURATION * 0.4], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <text key={letter} x={s.letterPositions[i] + translateX} y={s.baseline}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream} opacity={opacity}
            >{letter}</text>
          );
        })}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
      </svg>
    </AbsoluteFill>
  );
};
