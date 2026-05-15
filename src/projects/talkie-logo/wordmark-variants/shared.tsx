/**
 * Shared wordmark entrance base — provides letter opacities, dot state,
 * and layout constants. Each variant wraps this with its own filter/overlay.
 */
import { interpolate, useCurrentFrame, Easing, staticFile } from 'remotion';
import { COLORS, PULSE, WORDMARK } from '../tokens';

export const FPS = 60;
export const VARIANT_FRAMES = 300; // 5s — enough to read the effect

const LETTERS = ['t', 'a', 'l', 'k', 'i', 'e'] as const;
const LETTER_STAGGER = 0.12 * FPS;
const LETTER_FADE_DURATION = 0.18 * FPS;
const DOT_DELAY = LETTER_STAGGER * 6 + 0.08 * FPS;
const DOT_FADE_DURATION = 0.15 * FPS;
const SETTLE_START = DOT_DELAY + DOT_FADE_DURATION;

export const TALKIE_FONT = '"Talkie Medium", "JetBrains Mono", ui-monospace, monospace';

export interface WordmarkState {
  frame: number;
  wordmarkSize: number;
  u: number;
  totalW: number;
  totalH: number;
  baseline: number;
  dotCx: number;
  dotCy: number;
  dotR: number;
  dotOpacity: number;
  dotFadeIn: number;
  letterOpacities: number[];
  letterPositions: number[];
}

export function useWordmarkState(): WordmarkState {
  const frame = useCurrentFrame();
  const wordmarkSize = 156;
  const u = wordmarkSize / WORDMARK.fontUPM;
  const totalW = WORDMARK.totalAdvanceUPM * u;
  const totalH = wordmarkSize * 1.05;
  const baseline = wordmarkSize * 0.82;
  const dotCx = WORDMARK.iStemCenterUPM * u;
  const dotR = wordmarkSize * 0.075;
  const dotCy = baseline - WORDMARK.iStemTopUPM * u - dotR * 1.4;

  const cellWidths = [600, 600, 600, 600, 340, 600];
  let cumX = 0;
  const letterPositions = cellWidths.map((w) => {
    const x = cumX * u;
    cumX += w;
    return x;
  });

  const letterOpacities = LETTERS.map((_, i) => {
    const start = i * LETTER_STAGGER;
    return interpolate(frame, [start, start + LETTER_FADE_DURATION], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    });
  });

  const dotFadeIn = interpolate(frame, [DOT_DELAY, DOT_DELAY + DOT_FADE_DURATION], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  let dotOpacity = dotFadeIn;
  if (frame > SETTLE_START && dotFadeIn >= 1) {
    const pulsePeriodFrames = (PULSE.periodMs / 1000) * FPS;
    const pulseFrame = frame - SETTLE_START;
    const phase = (pulseFrame % pulsePeriodFrames) / pulsePeriodFrames;
    dotOpacity = interpolate(Math.sin(phase * Math.PI * 2), [-1, 1], [PULSE.opacityRange[0], PULSE.opacityRange[1]]);
  }

  return { frame, wordmarkSize, u, totalW, totalH, baseline, dotCx, dotCy, dotR, dotOpacity, dotFadeIn, letterOpacities, letterPositions };
}

export function fontFaceStyle() {
  return `
    @font-face {
      font-family: "Talkie Medium";
      src: url("${staticFile('fonts/Talkie-Medium.ttf')}") format("truetype");
      font-weight: 500;
      font-style: normal;
    }
  `;
}

export { COLORS, LETTERS };
