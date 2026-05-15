/**
 * Idle — one calm static state.
 * studioCream t-glyph + studioCream dot (when present), both full opacity.
 * No envelopes, no scaling, no animation. Pure ready/alert.
 */
import { AbsoluteFill } from 'remotion';
import { COLORS, MONO, tGeom } from './shared';

export const IDLE_FRAMES = 300; // 5s @ 60fps

function IdleBase({ showDot }: { showDot: boolean }) {
  const g = tGeom(600);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${g.size}`} style={{ height: g.size, width: 'auto' }}>
        {showDot && (
          <circle
            cx={g.stemCx}
            cy={g.dotCy}
            r={g.dotR}
            fill={COLORS.studioCream}
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

export const IdleNoDot: React.FC = () => <IdleBase showDot={false} />;
export const IdleWithDot: React.FC = () => <IdleBase showDot={true} />;
