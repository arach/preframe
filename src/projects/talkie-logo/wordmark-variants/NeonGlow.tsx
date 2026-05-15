/**
 * wordmark-neon-glow: Gaussian blur glow behind letters,
 * Hot Mic dot gets stronger glow. Glow opacity tied to 1.0Hz pulse.
 * "Diner sign at 3am" — restrained, not casino.
 */
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';
import { PULSE } from '../tokens';

export const WordmarkNeonGlow: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  // Glow pulse synced to dot's 1.0Hz
  const pulsePeriodFrames = (PULSE.periodMs / 1000) * FPS;
  const pulsePhase = (frame % pulsePeriodFrames) / pulsePeriodFrames;
  const glowPulse = interpolate(Math.sin(pulsePhase * Math.PI * 2), [-1, 1], [0.3, 0.7]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>

      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        <defs>
          <filter id="text-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow layer */}
        <g filter="url(#text-glow)" opacity={glowPulse}>
          {LETTERS.map((letter, i) => (
            <text key={`g-${letter}`} x={s.letterPositions[i]} y={s.baseline}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
            >{letter}</text>
          ))}
        </g>

        {/* Main text (sharp) */}
        {LETTERS.map((letter, i) => (
          <text key={letter} x={s.letterPositions[i]} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
          >{letter}</text>
        ))}

        {/* Dot with stronger glow */}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR * 1.8}
          fill={COLORS.hotMic} opacity={s.dotOpacity * glowPulse * 0.4}
          filter="url(#dot-glow)"
        />
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
      </svg>
    </AbsoluteFill>
  );
};
