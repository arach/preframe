/** letters-stamp: each letter punches down from above with hard arrival + bounce. Stagger 0.12s. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STAGGER = 0.12 * FPS;
const DROP_DURATION = 0.08 * FPS; // fast drop
const BOUNCE_DURATION = 0.14 * FPS;

export const WordmarkStamp: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => {
          const start = i * STAGGER;
          const dropEnd = start + DROP_DURATION;
          const bounceEnd = dropEnd + BOUNCE_DURATION;

          let translateY: number;
          let scaleY = 1;
          if (frame < start) {
            translateY = -s.wordmarkSize * 0.6;
          } else if (frame < dropEnd) {
            // Hard drop — linear, no easing
            const p = (frame - start) / DROP_DURATION;
            translateY = (-s.wordmarkSize * 0.6) * (1 - p);
          } else if (frame < bounceEnd) {
            translateY = 0;
            const bp = (frame - dropEnd) / BOUNCE_DURATION;
            if (bp < 0.15) scaleY = 0.92; // 2-frame squash
            else scaleY = interpolate(bp, [0.15, 1], [0.92, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.ease) });
          } else {
            translateY = 0;
          }
          const opacity = frame >= start ? 1 : 0;
          return (
            <text key={letter} x={s.letterPositions[i]} y={s.baseline + translateY}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream} opacity={opacity}
              transform={scaleY !== 1 ? `scale(1,${scaleY})` : undefined}
              style={{ transformOrigin: `${s.letterPositions[i]}px ${s.baseline}px` }}
            >{letter}</text>
          );
        })}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
      </svg>
    </AbsoluteFill>
  );
};
