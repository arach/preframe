/** letters-zoom-in: all letters fade+scale from 0.6 to 1.0 simultaneously. Hot Mic dot scales separately 0.2s after. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const ZOOM_DURATION = 0.8 * FPS; // 48 frames
const DOT_DELAY = 0.2 * FPS;
const DOT_DURATION = 0.25 * FPS;

export const WordmarkZoomIn: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  const p = interpolate(frame, [0, ZOOM_DURATION], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease),
  });
  const scale = interpolate(p, [0, 1], [0.6, 1]);
  const opacity = interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });

  const dotP = interpolate(frame, [ZOOM_DURATION + DOT_DELAY, ZOOM_DURATION + DOT_DELAY + DOT_DURATION], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease),
  });
  const dotScale = interpolate(dotP, [0, 1], [0.4, 1]);
  const dotOpacityIn = interpolate(dotP, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });

  const cx = s.totalW / 2;
  const cy = s.totalH / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        <g transform={`translate(${cx},${cy}) scale(${scale}) translate(${-cx},${-cy})`} opacity={opacity}>
          {LETTERS.map((letter, i) => (
            <text key={letter} x={s.letterPositions[i]} y={s.baseline}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream}
            >{letter}</text>
          ))}
        </g>
        {dotP > 0 && (
          <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR * dotScale}
            fill={COLORS.hotMic} opacity={dotOpacityIn > 0 ? Math.max(dotOpacityIn, s.dotOpacity) : 0}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
};
