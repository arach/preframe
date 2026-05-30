/** letters-wipe-vertical: each letter reveals via top-to-bottom clip-path wipe. Stagger 0.10s. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STAGGER = 0.10 * FPS;
const WIPE_DURATION = 0.25 * FPS;

export const WordmarkWipeVertical: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        <defs>
          {LETTERS.map((_, i) => {
            const start = i * STAGGER;
            const p = interpolate(frame, [start, start + WIPE_DURATION], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease),
            });
            return (
              <clipPath key={`wipe-${i}`} id={`wipe-${i}`}>
                <rect x={0} y={0} width={s.totalW} height={s.totalH * p} />
              </clipPath>
            );
          })}
        </defs>
        {LETTERS.map((letter, i) => (
          <text key={letter} x={s.letterPositions[i]} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} clipPath={`url(#wipe-${i})`}
          >{letter}</text>
        ))}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
      </svg>
    </AbsoluteFill>
  );
};
