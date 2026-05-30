/** title-card: wordmark fades up with small mono subtitle below. Tarantino-adjacent slate. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';
import { MONO } from '../tokens';

const FADE_DURATION = 0.6 * FPS;
const SUBTITLE_START = 0.4 * FPS;
const SUBTITLE_FADE = 0.4 * FPS;
const SUBTITLE_HOLD = 2.0 * FPS;

export const WordmarkTitleCard: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  const subtitleOpacity = interpolate(
    frame,
    [SUBTITLE_START, SUBTITLE_START + SUBTITLE_FADE, SUBTITLE_START + SUBTITLE_FADE + SUBTITLE_HOLD, SUBTITLE_START + SUBTITLE_FADE + SUBTITLE_HOLD + SUBTITLE_FADE],
    [0, 0.5, 0.5, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => (
          <text key={letter} x={s.letterPositions[i]} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
          >{letter}</text>
        ))}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
        {/* Subtitle */}
        <text
          x={s.totalW / 2} y={s.baseline + s.wordmarkSize * 0.35}
          textAnchor="middle" fontFamily={MONO} fontWeight={400}
          fontSize={s.wordmarkSize * 0.09} letterSpacing="0.24em"
          fill={COLORS.studioCream} opacity={subtitleOpacity}
        >
          A · TALKIE · INTRODUCTION
        </text>
      </svg>
    </AbsoluteFill>
  );
};
