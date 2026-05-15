/**
 * wordmark-crt-scan: horizontal scan lines + chromatic aberration.
 * "Early-90s broadcast monitor."
 */
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

export const WordmarkCrtScan: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  // Slow saturation build over the entrance
  const saturation = interpolate(frame, [0, 2 * FPS], [0.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Scan line pattern — CSS-based for simplicity
  const scanLineOpacity = 0.025 * saturation;

  // Chromatic aberration offsets
  const caOffset = 0.8 * saturation;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>

      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {/* Red channel — shifted right */}
        {LETTERS.map((letter, i) => (
          <text key={`r-${letter}`} x={s.letterPositions[i] + caOffset} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill="#FF5346" opacity={s.letterOpacities[i] * 0.3 * saturation}
          >{letter}</text>
        ))}
        {/* Cyan channel — shifted left */}
        {LETTERS.map((letter, i) => (
          <text key={`c-${letter}`} x={s.letterPositions[i] - caOffset} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill="#00BFFF" opacity={s.letterOpacities[i] * 0.25 * saturation}
          >{letter}</text>
        ))}
        {/* Main text */}
        {LETTERS.map((letter, i) => (
          <text key={letter} x={s.letterPositions[i]} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
          >{letter}</text>
        ))}
        <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
      </svg>

      {/* Scan lines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,${scanLineOpacity}) 2px, rgba(0,0,0,${scanLineOpacity}) 4px)`,
      }} />
    </AbsoluteFill>
  );
};
