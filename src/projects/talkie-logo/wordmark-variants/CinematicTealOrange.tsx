/** teal-orange-grade: cinematic LUT — teal shadows, warm orange highlights + vignette. */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

export const WordmarkTealOrange: React.FC = () => {
  const s = useWordmarkState();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        <defs>
          <filter id="teal-orange" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1.1  0.05 -0.05 0 0.02
              -0.05 1.0  0.1  0 -0.01
              -0.1  0.05 1.15 0 0.04
              0     0    0    1 0
            " />
          </filter>
        </defs>
        <g filter="url(#teal-orange)">
          {LETTERS.map((letter, i) => (
            <text key={letter} x={s.letterPositions[i]} y={s.baseline}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
            >{letter}</text>
          ))}
          <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
        </g>
      </svg>
      {/* Film stock vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,20,30,0.35) 100%)',
      }} />
    </AbsoluteFill>
  );
};
