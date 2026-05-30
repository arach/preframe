import { AbsoluteFill, interpolate, useCurrentFrame, Easing, staticFile } from 'remotion';
import { COLORS, PULSE, WORDMARK } from './tokens';

const FPS = 60;

// Timing
const LETTERS = ['t', 'a', 'l', 'k', 'i', 'e'] as const;
const LETTER_STAGGER = 0.12 * FPS;     // 7.2 frames between each letter start
const LETTER_FADE_DURATION = 0.18 * FPS; // 10.8 frames to fade in
const DOT_DELAY = LETTER_STAGGER * 6 + 0.08 * FPS; // dot arrives after 'e' + small gap
const DOT_FADE_DURATION = 0.15 * FPS;
const SETTLE_START = DOT_DELAY + DOT_FADE_DURATION; // ~1.0s in
const HOLD_DURATION = 1.4 * FPS; // hold assembled wordmark
const TOTAL_DURATION = SETTLE_START + HOLD_DURATION;

export const WORDMARK_ENTRANCE_FRAMES = Math.ceil(TOTAL_DURATION); // ~144 frames = 2.4s

const TALKIE_FONT = '"Talkie Medium", "JetBrains Mono", ui-monospace, monospace';

export const WordmarkEntrance: React.FC = () => {
  const frame = useCurrentFrame();
  const wordmarkSize = 156;
  const u = wordmarkSize / WORDMARK.fontUPM;
  const totalW = WORDMARK.totalAdvanceUPM * u;
  const totalH = wordmarkSize * 1.05;
  const baseline = wordmarkSize * 0.82;

  // Dot positioning (above dotless i stem)
  const dotCx = WORDMARK.iStemCenterUPM * u;
  const dotR = wordmarkSize * 0.075;
  const dotCy = baseline - WORDMARK.iStemTopUPM * u - dotR * 2.5;

  // Individual letter opacities
  // We use per-character <text> elements for sequential fade-in
  // Letter advances in UPM (approximate from total / 6, but using real cell widths)
  const cellWidths = [600, 600, 600, 600, 340, 600]; // t,a,l,k,i,e in UPM
  let cumX = 0;
  const letterPositions = cellWidths.map((w) => {
    const x = cumX * u;
    cumX += w;
    return x;
  });

  // Dot opacity: fade in, then pulse
  const dotFadeIn = interpolate(frame, [DOT_DELAY, DOT_DELAY + DOT_FADE_DURATION], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  // 1.0Hz pulse after dot has settled
  const pulseActive = frame > SETTLE_START;
  let dotOpacity = dotFadeIn;
  if (pulseActive && dotFadeIn >= 1) {
    const pulsePeriodFrames = (PULSE.periodMs / 1000) * FPS;
    const pulseFrame = frame - SETTLE_START;
    const phase = (pulseFrame % pulsePeriodFrames) / pulsePeriodFrames;
    dotOpacity = interpolate(
      Math.sin(phase * Math.PI * 2),
      [-1, 1],
      [PULSE.opacityRange[0], PULSE.opacityRange[1]],
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      {/* Load Talkie Medium font */}
      <style>{`
        @font-face {
          font-family: "Talkie Medium";
          src: url("${staticFile('fonts/Talkie-Medium.ttf')}") format("truetype");
          font-weight: 500;
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
            frame,
            [letterStart, letterStart + LETTER_FADE_DURATION],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.inOut(Easing.ease),
            },
          );
          return (
            <text
              key={letter}
              x={letterPositions[i]}
              y={baseline}
              fontFamily={TALKIE_FONT}
              fontWeight={500}
              fontSize={wordmarkSize}
              fill={COLORS.studioCream}
              opacity={opacity}
            >
              {letter}
            </text>
          );
        })}

        {/* Hot Mic dot — arrives last, above dotless i */}
        <circle
          cx={dotCx}
          cy={dotCy}
          r={dotR}
          fill={COLORS.hotMic}
          opacity={dotOpacity}
        />
      </svg>
    </AbsoluteFill>
  );
};
