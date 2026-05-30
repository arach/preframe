/**
 * wordmark-film-grain: standard entrance + procedural film grain overlay.
 * Optional warm/cool hue shift cycle. "Shot on 16mm."
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

export const WordmarkFilmGrain: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  // Hue shift: warm→cool→warm at 6s cycle, ±1.5deg
  const huePhase = (frame % (6 * FPS)) / (6 * FPS);
  const hueShift = Math.sin(huePhase * Math.PI * 2) * 1.5;

  // Grain seed changes every frame for organic noise
  const grainSeed = frame * 7 + 13;

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.ribbonBlack,
      justifyContent: 'center', alignItems: 'center',
      filter: `hue-rotate(${hueShift}deg)`,
    }}>
      <style>{fontFaceStyle()}</style>

      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => (
          <text key={letter} x={s.letterPositions[i]} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
          >{letter}</text>
        ))}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
      </svg>

      {/* Film grain — SVG noise filter */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed={grainSeed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#grain)" opacity={0.06} />
      </svg>
    </AbsoluteFill>
  );
};
