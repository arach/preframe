/** letters-cascade-fall: letters fall from random heights with gravity (mm-a-drop envelope). Hot Mic dot lands last with smaller bounce. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { useWordmarkState, fontFaceStyle, TALKIE_FONT, COLORS, LETTERS, FPS } from './shared';

const STAGGER = 0.12 * FPS;
const FALL_DURATION = 0.35 * FPS;
const BOUNCE_FRAMES = 8;

// Deterministic "random" start heights per letter (seeded)
const START_HEIGHTS = [0.5, 0.7, 0.4, 0.65, 0.55, 0.6]; // as fraction of wordmarkSize

/** Gravity drop envelope — quadratic fall with squash on landing */
function gravityDrop(t: number): { translateY: number; scaleY: number; scaleX: number } {
  if (t <= 0) return { translateY: -1, scaleY: 1, scaleX: 1 };
  if (t < 0.7) {
    // Free fall: quadratic
    const p = t / 0.7;
    return { translateY: -1 + p * p, scaleY: 1, scaleX: 1 };
  }
  if (t < 0.78) {
    // Squash
    const sp = (t - 0.7) / 0.08;
    return { translateY: 0, scaleY: interpolate(sp, [0, 1], [1, 0.93]), scaleX: interpolate(sp, [0, 1], [1, 1.06]) };
  }
  if (t < 1) {
    // Release
    const rp = (t - 0.78) / 0.22;
    const e = Easing.out(Easing.ease)(rp);
    return { translateY: 0, scaleY: interpolate(e, [0, 1], [0.93, 1]), scaleX: interpolate(e, [0, 1], [1.06, 1]) };
  }
  return { translateY: 0, scaleY: 1, scaleX: 1 };
}

export const WordmarkCascadeFall: React.FC = () => {
  const s = useWordmarkState();
  const frame = useCurrentFrame();

  const dotStart = LETTERS.length * STAGGER + 0.1 * FPS;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <style>{fontFaceStyle()}</style>
      <svg viewBox={`0 0 ${s.totalW} ${s.totalH}`} style={{ display: 'block', width: s.totalW, height: s.totalH }}>
        {LETTERS.map((letter, i) => {
          const start = i * STAGGER;
          const t = interpolate(frame, [start, start + FALL_DURATION], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const drop = gravityDrop(t);
          const dropDist = START_HEIGHTS[i] * s.wordmarkSize;
          const translateY = drop.translateY * dropDist;
          const opacity = t > 0 ? 1 : 0;
          return (
            <g key={letter} transform={`translate(0, ${translateY})`}>
              <text x={s.letterPositions[i]} y={s.baseline}
                fontFamily={TALKIE_FONT} fontWeight={500} fontSize={s.wordmarkSize}
                fill={COLORS.studioCream} opacity={opacity}
              >{letter}</text>
            </g>
          );
        })}
        {/* Dot falls last with smaller bounce */}
        {(() => {
          const dt = interpolate(frame, [dotStart, dotStart + FALL_DURATION * 0.7], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const drop = gravityDrop(dt);
          const translateY = drop.translateY * s.wordmarkSize * 0.35;
          return (
            <circle cx={s.dotCx} cy={s.dotCy + translateY} r={s.dotR}
              fill={COLORS.hotMic} opacity={dt > 0 ? 1 : 0}
            />
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
};
