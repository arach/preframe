/**
 * wordmark-ink-bloom: letters reveal via a growing circular mask from each
 * letter's centroid. feTurbulence on the mask edge for ink-on-paper irregularity.
 * Hot Mic dot blooms last from a single point.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const BLOOM_STAGGER = 0.14 * FPS;   // slightly slower than standard entrance
const BLOOM_DURATION = 0.35 * FPS;   // each letter blooms over ~350ms

export const WordmarkInkBloom: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  // Each letter gets a circular mask that grows from its center
  const cellWidths = [600, 600, 600, 600, 340, 600];
  const letterCenters = s.letterPositions.map((x, i) =>
    x + (cellWidths[i] * s.u) * 0.5
  );
  const letterCenterY = s.baseline - s.wordmarkSize * 0.35; // approximate visual center

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>

      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        <defs>
          <filter id="ink-edge" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" seed={42} result="turb" />
            <feDisplacementMap in="SourceGraphic" in2="turb" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {LETTERS.map((_, i) => {
            const bloomStart = i * BLOOM_STAGGER;
            const progress = interpolate(frame, [bloomStart, bloomStart + BLOOM_DURATION], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              easing: Easing.out(Easing.ease),
            });
            const maxR = s.wordmarkSize * 0.7; // big enough to reveal full letter
            return (
              <clipPath key={`bloom-${i}`} id={`bloom-${i}`}>
                <circle
                  cx={letterCenters[i]}
                  cy={letterCenterY}
                  r={maxR * progress}
                  filter={progress > 0.1 && progress < 0.9 ? 'url(#ink-edge)' : undefined}
                />
              </clipPath>
            );
          })}

          {/* Dot bloom */}
          {(() => {
            const dotBloomStart = LETTERS.length * BLOOM_STAGGER + 0.05 * FPS;
            const dotProgress = interpolate(frame, [dotBloomStart, dotBloomStart + 0.25 * FPS], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              easing: Easing.out(Easing.ease),
            });
            return (
              <clipPath id="bloom-dot">
                <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR * 2 * dotProgress} />
              </clipPath>
            );
          })()}
        </defs>

        {LETTERS.map((letter, i) => (
          <text key={letter} x={s.letterPositions[i]} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} clipPath={`url(#bloom-${i})`}
          >{letter}</text>
        ))}

        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR}
          fill={COLORS.hotMic} opacity={s.dotOpacity}
          clipPath="url(#bloom-dot)"
        />
      </svg>
    </AbsoluteFill>
  );
};
