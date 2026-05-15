/** trailer-snap: wordmark slams from scale 1.4, hard ease-out, 3-frame camera shake on impact. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const SLAM_DURATION = 0.18 * FPS;
const SHAKE_START = Math.ceil(SLAM_DURATION);
const SHAKE_FRAMES = 3;

const SHAKE_OFFSETS = [
  { dx: 2, dy: -1.5 },
  { dx: -1.5, dy: 1 },
  { dx: 1, dy: -0.5 },
];

export const WordmarkTrailerSnap: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  const slamP = interpolate(frame, [0, SLAM_DURATION], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });
  const scale = interpolate(slamP, [0, 1], [1.4, 1]);
  const opacity = slamP > 0 ? 1 : 0;

  let shakeDx = 0, shakeDy = 0;
  if (frame >= SHAKE_START && frame < SHAKE_START + SHAKE_FRAMES) {
    const idx = frame - SHAKE_START;
    shakeDx = SHAKE_OFFSETS[idx].dx;
    shakeDy = SHAKE_OFFSETS[idx].dy;
  }

  // Dot lands after with impact frame
  const dotDelay = SHAKE_START + SHAKE_FRAMES + 2;
  const dotP = interpolate(frame, [dotDelay, dotDelay + 0.1 * FPS], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease),
  });

  const cx = s.totalW / 2;
  const cy = s.totalH / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        <g transform={`translate(${cx + shakeDx},${cy + shakeDy}) scale(${scale}) translate(${-cx},${-cy})`} opacity={opacity}>
          {LETTERS.map((letter, i) => (
            <text key={letter} x={s.letterPositions[i]} y={s.baseline}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream}
            >{letter}</text>
          ))}
        </g>
        {dotP > 0 && (
          <circle cx={s.dotCx + shakeDx} cy={s.dotCy + shakeDy} r={s.dotR * interpolate(dotP, [0, 1], [1.3, 1])}
            fill={COLORS.hotMic} opacity={dotP}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
};
