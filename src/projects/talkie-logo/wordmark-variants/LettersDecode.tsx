/** letters-decode: each letter resolves through 3-4 random characters before settling. Stagger 0.10s. Hot Mic dot snaps on last. */
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STAGGER = 0.10 * FPS;
const RANDOM_HOLD = 0.08 * FPS; // 80ms per random char
const NUM_RANDOMS = 4;
const RESOLVE_DURATION = NUM_RANDOMS * RANDOM_HOLD; // ~320ms

// Deterministic random chars per letter (seeded sequences)
const DECODE_CHARS: string[][] = [
  ['x', 'q', 'r', 'w'], // t
  ['n', 'v', 'z', 'g'], // a
  ['j', 'f', 'm', 'p'], // l
  ['b', 'u', 'd', 's'], // k
  ['o', 'c', 'y', 'h'], // i
  ['z', 'k', 'a', 'n'], // e
];

export const WordmarkDecode: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  const dotStart = LETTERS.length * STAGGER + RESOLVE_DURATION + 0.05 * FPS;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => {
          const start = i * STAGGER;
          const elapsed = frame - start;
          if (elapsed < 0) return null;

          let displayChar: string;
          if (elapsed >= RESOLVE_DURATION) {
            displayChar = letter;
          } else {
            const randomIdx = Math.min(Math.floor(elapsed / RANDOM_HOLD), NUM_RANDOMS - 1);
            displayChar = DECODE_CHARS[i][randomIdx];
          }

          return (
            <text key={i} x={s.letterPositions[i]} y={s.baseline}
              fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
              fill={COLORS.studioCream}
            >{displayChar}</text>
          );
        })}
        {/* Dot snaps on */}
        {frame >= dotStart && (
          <circle cx={s.dotCx} cy={s.dotCy} r={s.dotR} fill={COLORS.hotMic} opacity={s.dotOpacity} />
        )}
      </svg>
    </AbsoluteFill>
  );
};
