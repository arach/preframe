/** letters-slide-up: letters rise from below baseline, fading in. Hot Mic dot drops from above last. Stagger 0.10s. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STAGGER = 0.10 * FPS;
const ANIM_DURATION = 0.25 * FPS;

export const WordmarkSlideUp: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  const dotStart = LETTERS.length * STAGGER + 0.08 * FPS;
  const dotDuration = 0.20 * FPS;
  const dotP = interpolate(frame, [dotStart, dotStart + dotDuration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease),
  });
  const dotTranslateY = (1 - dotP) * (-s.wordmarkSize * 0.4); // drops from above
  const dotOpacity = dotP > 0 ? interpolate(dotP, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => {
          const start = i * STAGGER;
          const p = interpolate(frame, [start, start + ANIM_DURATION], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease),
          });
          const translateY = (1 - p) * s.wordmarkSize * 0.35;
          const opacity = interpolate(frame, [start, start + ANIM_DURATION * 0.5], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <text key={letter} x={s.letterPositions[i]} y={s.baseline + translateY}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream} opacity={opacity}
            >{letter}</text>
          );
        })}
        <circle cx={s.dotCx} cy={s.dotCy + dotTranslateY} r={s.dotR}
          fill={COLORS.hotMic} opacity={dotOpacity > 0 ? Math.max(dotOpacity, s.dotOpacity) : 0}
        />
      </svg>
    </AbsoluteFill>
  );
};
