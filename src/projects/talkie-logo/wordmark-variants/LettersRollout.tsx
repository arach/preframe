/** letters-rollout: letters roll in from below baseline, rotating ~90°. Stagger 0.10s. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STAGGER = 0.10 * FPS;
const ANIM_DURATION = 0.30 * FPS;

export const WordmarkRollout: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => {
          const start = i * STAGGER;
          const p = interpolate(frame, [start, start + ANIM_DURATION], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease),
          });
          const translateY = (1 - p) * s.wordmarkSize * 0.8;
          const rotate = (1 - p) * 90;
          const opacity = interpolate(frame, [start, start + ANIM_DURATION * 0.3], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const cx = s.letterPositions[i] + s.wordmarkSize * 0.25;
          return (
            <g key={letter} transform={`translate(${cx},${s.baseline}) rotate(${rotate}) translate(${-cx},${-s.baseline + translateY})`} opacity={opacity}>
              <text x={s.letterPositions[i]} y={s.baseline} fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize} fill={COLORS.studioCream}>
                {letter}
              </text>
            </g>
          );
        })}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
      </svg>
    </AbsoluteFill>
  );
};
