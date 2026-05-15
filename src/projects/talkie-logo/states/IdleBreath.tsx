/**
 * idle-breath: dot breathes on mm-a-breath envelope at ~3% amplitude.
 * Two sub-variants: no-dot (pure ready/alert) and white-dot (armed but not capturing).
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { FPS, COLORS, MONO, tGeom, breathEnvelope } from './shared';

const CYCLE_MS = 5500;
const CYCLE_FRAMES = (CYCLE_MS / 1000) * FPS;
const AMPLITUDE = 0.03;
export const IDLE_BREATH_FRAMES = Math.ceil(CYCLE_FRAMES * 2.5);

function IdleBreathBase({ showDot }: { showDot: boolean }) {
  const frame = useCurrentFrame();
  const g = tGeom(600);
  const phase = (frame % CYCLE_FRAMES) / CYCLE_FRAMES;
  const rawScale = breathEnvelope(phase);
  const normalized = (rawScale - 0.92) / (1.06 - 0.92);
  const scale = 1 + (normalized - 0.5) * AMPLITUDE * 2;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        {showDot && (
          <circle
            cx={g.stemCx}
            cy={g.dotCy}
            r={g.dotR * scale}
            fill={COLORS.studioCream}
            opacity={0.75}
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

export const IdleBreathNoDot: React.FC = () => <IdleBreathBase showDot={false} />;
export const IdleBreathWhiteDot: React.FC = () => <IdleBreathBase showDot={true} />;
// Keep legacy export for backwards compat with entry file
export const IdleBreath = IdleBreathWhiteDot;
