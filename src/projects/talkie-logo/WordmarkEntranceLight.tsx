/**
 * WordmarkEntranceLight — identical to WordmarkEntrance but uses the Talkie Sans
 * variable font at weight 350 instead of Talkie-Medium (weight 500). All other params
 * (layout, kern, dot gap, timing) are identical.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing, staticFile } from 'remotion';
import { COLORS, PULSE, WORDMARK } from './tokens';

const FPS = 60;

const LETTERS = ['t', 'a', 'l', 'k', 'i', 'e'] as const;
const LETTER_STAGGER = 0.12 * FPS;
const LETTER_FADE_DURATION = 0.18 * FPS;
const DOT_DELAY = LETTER_STAGGER * 6 + 0.08 * FPS;
const DOT_FADE_DURATION = 0.15 * FPS;
const SETTLE_START = DOT_DELAY + DOT_FADE_DURATION;
const HOLD_DURATION = 1.4 * FPS;
const TOTAL_DURATION = SETTLE_START + HOLD_DURATION;

export const WORDMARK_LIGHT_FRAMES = Math.ceil(TOTAL_DURATION);

const TALKIE_LIGHT_FONT = '"Talkie Sans Light", "JetBrains Mono", ui-monospace, monospace';

export const WordmarkEntranceLight: React.FC = () => {
  const frame = useCurrentFrame();
  const wordmarkSize = 156;
  const u = wordmarkSize / WORDMARK.fontUPM;
  const totalW = WORDMARK.totalAdvanceUPM * u;
  const totalH = wordmarkSize * 1.05;
  const baseline = wordmarkSize * 0.82;

  const dotCx = WORDMARK.iStemCenterUPM * u;
  const dotR = wordmarkSize * 0.075;
  const dotCy = baseline - WORDMARK.iStemTopUPM * u - dotR * 2.5;

  const cellWidths = [600, 600, 600, 600, 340, 600];
  let cumX = 0;
  const letterPositions = cellWidths.map((w) => {
    const x = cumX * u;
    cumX += w;
    return x;
  });

  const dotFadeIn = interpolate(frame, [DOT_DELAY, DOT_DELAY + DOT_FADE_DURATION], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  const pulseActive = frame > SETTLE_START;
  let dotOpacity = dotFadeIn;
  if (pulseActive && dotFadeIn >= 1) {
    const pulsePeriodFrames = (PULSE.periodMs / 1000) * FPS;
    const pulseFrame = frame - SETTLE_START;
    const phase = (pulseFrame % pulsePeriodFrames) / pulsePeriodFrames;
    dotOpacity = interpolate(
      Math.sin(phase * Math.PI * 2), [-1, 1],
      [PULSE.opacityRange[0], PULSE.opacityRange[1]],
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{`
        @font-face {
          font-family: "Talkie Sans Light";
          src: url("${staticFile('fonts/Talkie-Sans.ttf')}") format("truetype");
          font-weight: 350;
          font-style: normal;
        }
      `}</style>

      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        style={{ display: 'block', width: totalW, height: totalH }}
      >
        {LETTERS.map((letter, i) => {
          const letterStart = i * LETTER_STAGGER;
          const opacity = interpolate(
            frame, [letterStart, letterStart + LETTER_FADE_DURATION], [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) },
          );
          return (
            <text
              key={letter}
              x={letterPositions[i]}
              y={baseline}
              fontFamily={TALKIE_LIGHT_FONT}
              fontWeight={350}
              fontSize={wordmarkSize}
              fill={COLORS.studioCream}
              opacity={opacity}
            >
              {letter}
            </text>
          );
        })}

        <circle cx={dotCx} cy={dotCy} r={dotR} fill={COLORS.hotMic} opacity={dotOpacity} />
      </svg>
    </AbsoluteFill>
  );
};

/** Static final-frame version for Still render. */
export const WordmarkStaticLight: React.FC = () => {
  const wordmarkSize = 156;
  const u = wordmarkSize / WORDMARK.fontUPM;
  const totalW = WORDMARK.totalAdvanceUPM * u;
  const totalH = wordmarkSize * 1.05;
  const baseline = wordmarkSize * 0.82;
  const dotCx = WORDMARK.iStemCenterUPM * u;
  const dotR = wordmarkSize * 0.075;
  const dotCy = baseline - WORDMARK.iStemTopUPM * u - dotR * 2.5;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{`
        @font-face {
          font-family: "Talkie Sans Light";
          src: url("${staticFile('fonts/Talkie-Sans.ttf')}") format("truetype");
          font-weight: 350;
          font-style: normal;
        }
      `}</style>
      <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ display: 'block', width: totalW, height: totalH }}>
        <text x={0} y={baseline} fontFamily={TALKIE_LIGHT_FONT}
          fontWeight={350} fontSize={wordmarkSize} fill={COLORS.studioCream}>
          talkie
        </text>
        <circle cx={dotCx} cy={dotCy} r={dotR} fill={COLORS.hotMic} />
      </svg>
    </AbsoluteFill>
  );
};
