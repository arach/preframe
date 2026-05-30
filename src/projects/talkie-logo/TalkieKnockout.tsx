/**
 * TalkieKnockout — Mark B: the t-glyph with a square knockout cut from the
 * crossbar intersection. The negative space IS the mark.
 *
 * Blink variant: mm-b-blink kinetics (fast descent, shut hold, slow re-open).
 * 5200ms cycle, ~310ms event at ~94% of cycle.
 */
import { AbsoluteFill, useCurrentFrame, Easing, interpolate } from 'remotion';
import { COLORS, MONO, T_GEOMETRY } from './tokens';

const FPS = 60;
const BLINK_CYCLE_MS = 5200;
const BLINK_CYCLE_FRAMES = (BLINK_CYCLE_MS / 1000) * FPS; // 312 frames

export const KNOCKOUT_BLINK_FRAMES = Math.ceil(BLINK_CYCLE_FRAMES * 2); // ~10.4s, 2 full cycles
export const KNOCKOUT_STATIC_FRAMES = 1; // single frame for Still

/**
 * mm-b-blink envelope — returns scaleY for the knockout square.
 * Keyframes (from marks/motion/page.tsx):
 *   0–92%: scaleY(1)
 *   93.7%: scaleY(0.10) — shut, fast descent
 *   94.5%: scaleY(0.10) — shut hold
 *   98.0%: scaleY(0.92) — opening, near-done
 *   99.2–100%: scaleY(1)
 */
function blinkScaleY(t: number): number {
  // t is 0–1 within one cycle
  if (t <= 0.92) return 1;
  if (t <= 0.937) {
    // Fast descent: 92% → 93.7% = 1.7% of cycle
    const p = (t - 0.92) / (0.937 - 0.92);
    // ease-out on descent (fast start)
    return 1 - 0.9 * Easing.out(Easing.ease)(p);
  }
  if (t <= 0.945) return 0.10; // shut hold
  if (t <= 0.98) {
    // Slow re-open: 94.5% → 98% = 3.5% of cycle
    const p = (t - 0.945) / (0.98 - 0.945);
    return 0.10 + 0.82 * Easing.out(Easing.ease)(p);
  }
  if (t <= 0.992) {
    // Final settle: 98% → 99.2%
    const p = (t - 0.98) / (0.992 - 0.98);
    return 0.92 + 0.08 * Easing.out(Easing.ease)(p);
  }
  return 1;
}

function KnockoutBase({ animate }: { animate: boolean }) {
  const frame = useCurrentFrame();

  // Glyph fills ~70% of the 2160 canvas → effective glyph size ~1512
  // But we use SVG viewBox scaling — render at size=600, viewBox handles the rest
  const size = 600;
  const anchorX = size * T_GEOMETRY.cellCenter;
  const stemCx = anchorX + size * T_GEOMETRY.stemOffsetFromAnchor;
  const baseline = size * 0.86;
  const crossY = size * T_GEOMETRY.crossY;
  const stemW = size * T_GEOMETRY.stemWidth;
  const viewW = size * 0.62;

  // Knockout square: stemWidth * 0.7 (matching marks/page.tsx exactly)
  const knockoutW = stemW * 0.7;
  const kx = stemCx - knockoutW / 2;
  const ky = crossY - knockoutW / 2;

  // Blink animation
  let scaleY = 1;
  if (animate) {
    const cyclePhase = (frame % BLINK_CYCLE_FRAMES) / BLINK_CYCLE_FRAMES;
    scaleY = blinkScaleY(cyclePhase);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg
        viewBox={`0 0 ${viewW} ${size}`}
        style={{ height: '70%', width: 'auto', display: 'block' }}
      >
        <defs>
          <mask id="knockout-mask">
            {/* White = visible, black = cut */}
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={kx}
              y={ky}
              width={knockoutW}
              height={knockoutW}
              fill="black"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transform: `scaleY(${scaleY})`,
              }}
            />
          </mask>
        </defs>

        <text
          x={anchorX}
          y={baseline}
          textAnchor="middle"
          fontFamily={MONO}
          fontWeight={400}
          fontSize={size * 0.78}
          fill={COLORS.studioCream}
          mask="url(#knockout-mask)"
        >
          t
        </text>
      </svg>
    </AbsoluteFill>
  );
}

/** Static knockout — open state, no blink. */
export const TalkieKnockoutStatic: React.FC = () => <KnockoutBase animate={false} />;

/** Animated knockout with mm-b-blink cycle. */
export const TalkieKnockoutBlink: React.FC = () => <KnockoutBase animate={true} />;
