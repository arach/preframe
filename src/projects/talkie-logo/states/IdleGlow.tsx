/**
 * idle-glow: opacity oscillates 0.55↔0.78 on mm-a-breath curve. NO scale.
 * Two sub-variants: no-dot and white-dot.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS, COLORS, MONO, tGeom, breathEnvelope } from './shared';

const CYCLE_MS = 4800;
const CYCLE_FRAMES = (CYCLE_MS / 1000) * FPS;
const OPACITY_LOW = 0.55;
const OPACITY_HIGH = 0.78;
export const IDLE_GLOW_FRAMES = Math.ceil(CYCLE_FRAMES * 2.5);

function IdleGlowBase({ showDot }: { showDot: boolean }) {
  const frame = useCurrentFrame();
  const g = tGeom(600);
  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;
  const rawScale = breathEnvelope(phase);
  const normalized = (rawScale - 0.92) / (1.06 - 0.92);
  const opacity = OPACITY_LOW + normalized * (OPACITY_HIGH - OPACITY_LOW);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        {showDot && (
          <circle
            cx={g.stemCx}
            cy={g.dotCy}
            r={g.dotR}
            fill={COLORS.studioCream}
            opacity={opacity}
          />
        )}
        <text
          x={g.anchorX}
          y={g.baseline}
          textAnchor="middle"
          fontFamily={MONO}
          fontWeight={400}
          fontSize={g.size * 0.78}
          fill={COLORS.studioCream}
        >
          t
        </text>
      </svg>
    </AbsoluteFill>
  );
}

export const IdleGlowNoDot: React.FC = () => <IdleGlowBase showDot={false} />;
export const IdleGlowWhiteDot: React.FC = () => <IdleGlowBase showDot={true} />;
export const IdleGlow = IdleGlowWhiteDot;
