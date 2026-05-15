/**
 * wordmark-glitch: one glitch event per entrance — 3-frame chromatic split
 * + horizontal slice offset, then snap back. "VHS register." Sparse, not sustained.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const GLITCH_START = Math.round(1.4 * FPS); // 84 — after most letters are in
const GLITCH_FRAMES = 3;

export const WordmarkGlitch: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  const inGlitch = frame >= GLITCH_START && frame < GLITCH_START + GLITCH_FRAMES;
  const glitchFrame = inGlitch ? frame - GLITCH_START : -1;

  // Glitch offsets per frame
  const sliceOffsets = [
    { dx: 3, dy: 0, sliceY: 0.4, sliceH: 0.15 },
    { dx: -4, dy: 1, sliceY: 0.3, sliceH: 0.2 },
    { dx: 2, dy: -1, sliceY: 0.5, sliceH: 0.12 },
  ];
  const glitch = glitchFrame >= 0 ? sliceOffsets[glitchFrame] : null;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>

      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {glitch && (
          <>
            {/* Chromatic split — red channel shifted */}
            {LETTERS.map((letter, i) => (
              <text key={`r-${letter}`} x={s.letterPositions[i] + glitch.dx * 0.8} y={s.baseline + glitch.dy}
                fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
                fill="#FF5346" opacity={s.letterOpacities[i] * 0.5}
              >{letter}</text>
            ))}
            {/* Cyan channel shifted opposite */}
            {LETTERS.map((letter, i) => (
              <text key={`c-${letter}`} x={s.letterPositions[i] - glitch.dx * 0.6} y={s.baseline - glitch.dy}
                fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
                fill="#00BFFF" opacity={s.letterOpacities[i] * 0.4}
              >{letter}</text>
            ))}
          </>
        )}

        {/* Main text */}
        {LETTERS.map((letter, i) => (
          <text key={letter}
            x={s.letterPositions[i] + (glitch && i >= 2 && i <= 4 ? glitch.dx : 0)}
            y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} opacity={s.letterOpacities[i]}
          >{letter}</text>
        ))}

        <circle cx={s.dotCx + (glitch ? glitch.dx * 0.5 : 0)} cy={s.dotCy}
          r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity}
        />
      </svg>

      {/* Horizontal slice displacement during glitch */}
      {glitch && (
        <div style={{
          position: 'absolute',
          left: glitch.dx * 2,
          top: `${glitch.sliceY * 100}%`,
          width: '100%',
          height: `${glitch.sliceH * 100}%`,
          backgroundColor: 'rgba(255,83,70,0.03)',
          pointerEvents: 'none',
        }} />
      )}
    </AbsoluteFill>
  );
};
