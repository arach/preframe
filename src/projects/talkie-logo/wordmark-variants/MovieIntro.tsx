/**
 * wordmark-movie-intro: anamorphic letterbox bars + scale-from-95 entrance + vignette.
 * "Title card before the feature starts."
 */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

export const WordmarkMovieIntro: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  // Letterbox bars slide in first (0–0.5s)
  const barProgress = interpolate(frame, [0, 0.5 * FPS], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.ease),
  });
  const barHeight = 12; // % of height

  // Wordmark scale: 95% → 100% over 1.8s starting at 0.3s
  const scaleProgress = interpolate(frame, [0.3 * FPS, 2.1 * FPS], [0.95, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.ease),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>

      {/* Wordmark with scale */}
      <div style={{ transform: `scale(${scaleProgress})` }}>
        <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
          {LETTERS.map((letter, i) => (
            <text key={letter} x={s.letterPositions[i]} y={s.baseline}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
            >{letter}</text>
          ))}
          <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
        </svg>
      </div>

      {/* Letterbox bars */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: `${barHeight * barProgress}%`,
        backgroundColor: '#000',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: `${barHeight * barProgress}%`,
        backgroundColor: '#000',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        opacity: barProgress,
      }} />
    </AbsoluteFill>
  );
};
