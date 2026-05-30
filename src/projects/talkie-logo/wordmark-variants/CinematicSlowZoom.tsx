/** slow-zoom: wordmark starts at 1.08 scale, pulls back to 1.0 with focus rack (blur 4→0). */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const ZOOM_DURATION = 2.5 * FPS;

export const WordmarkSlowZoom: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  const p = interpolate(frame, [0, ZOOM_DURATION], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease),
  });
  const scale = interpolate(p, [0, 1], [1.08, 1]);
  const blur = interpolate(p, [0, 1], [4, 0]);

  const cx = s.totalW / 2;
  const cy = s.totalH / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`}
        style={{ display: 'block', width: s.totalW, height: s.totalH, filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}
      >
        <g transform={`translate(${cx},${cy}) scale(${scale}) translate(${-cx},${-cy})`}>
          {LETTERS.map((letter, i) => (
            <text key={letter} x={s.letterPositions[i]} y={s.baseline}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
            >{letter}</text>
          ))}
          <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
