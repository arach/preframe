/**
 * wordmark-typewriter: letters strike in with clip-path reveal + underline cursor.
 * Hot Mic dot lands with a "ding" punch (1→1.15→1 scale snap).
 */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STRIKE_DURATION = 0.05 * FPS; // ~3 frames per letter strike (fast)
const STRIKE_STAGGER = 0.12 * FPS;
const DOT_DING_START = STRIKE_STAGGER * 6 + 0.1 * FPS;
const DOT_DING_DURATION = 0.2 * FPS; // 12 frames

export const WordmarkTypewriter: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  // Cursor position tracks the next letter slot
  const cursorLetterIndex = Math.min(Math.floor(frame / STRIKE_STAGGER), LETTERS.length);
  const cursorX = cursorLetterIndex < s.letterPositions.length
    ? s.letterPositions[cursorLetterIndex]
    : s.letterPositions[s.letterPositions.length - 1] + s.wordmarkSize * 0.6;

  // Cursor blink after all letters placed
  const allLettersPlaced = frame > STRIKE_STAGGER * LETTERS.length;
  const cursorBlink = allLettersPlaced ? Math.sin(frame * 0.15) > 0 : true;

  // Dot "ding" punch
  const dingProgress = interpolate(frame, [DOT_DING_START, DOT_DING_START + DOT_DING_DURATION], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  let dotScale = 1;
  if (dingProgress > 0 && dingProgress < 1) {
    // Snap up then settle: 0→0.4 = scale up, 0.4→1 = settle back
    if (dingProgress < 0.4) {
      dotScale = 1 + 0.15 * Easing.out(Easing.ease)(dingProgress / 0.4);
    } else {
      dotScale = 1.15 - 0.15 * Easing.out(Easing.bounce)((dingProgress - 0.4) / 0.6);
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>

      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        <defs>
          {LETTERS.map((_, i) => {
            const letterStart = i * STRIKE_STAGGER;
            const revealProgress = interpolate(frame, [letterStart, letterStart + STRIKE_DURATION], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const clipX = s.letterPositions[i];
            const clipW = (i < 5 ? s.letterPositions[i + 1] - clipX : s.wordmarkSize * 0.6) * revealProgress;
            return (
              <clipPath key={`clip-${i}`} id={`strike-${i}`}>
                <rect x={clipX} y={0} width={clipW} height={s.totalH} />
              </clipPath>
            );
          })}
        </defs>

        {LETTERS.map((letter, i) => (
          <text key={letter} x={s.letterPositions[i]} y={s.baseline}
            fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
            fill={COLORS.studioCream} clipPath={`url(#strike-${i})`}
          >{letter}</text>
        ))}

        {/* Hot Mic dot with ding */}
        <circle
          cx={s.dotCx} cy={s.dotCy} r={s.dotR * dotScale}
          fill={COLORS.hotMic} opacity={s.dotOpacity}
        />

        {/* Cursor underline */}
        {cursorBlink && (
          <line
            x1={cursorX} y1={s.baseline + 4}
            x2={cursorX + s.wordmarkSize * 0.15} y2={s.baseline + 4}
            stroke={COLORS.studioCream} strokeWidth={1.5} opacity={0.6}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
};
