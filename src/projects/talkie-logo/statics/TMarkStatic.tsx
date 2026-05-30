/** Static t-mark renders for icon assembly. */
import { AbsoluteFill } from 'remotion';
import { COLORS, MONO, T_GEOMETRY } from '../tokens';

const SIZE = 600;

function TMarkBase({ dotColor }: { dotColor: string }) {
  const anchorX = SIZE * T_GEOMETRY.cellCenter;
  const stemCx = anchorX + SIZE * T_GEOMETRY.stemOffsetFromAnchor;
  const baseline = SIZE * 0.86;
  const dotR = (SIZE * T_GEOMETRY.stemWidth) / 2;
  const dotCy = SIZE * 0.21;
  const viewW = SIZE * 0.62;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${viewW} ${SIZE}`} style={{ height: SIZE, width: 'auto' }}>
        <circle cx={stemCx} cy={dotCy} r={dotR} fill={dotColor} />
        <text x={anchorX} y={baseline} textAnchor="middle" fontFamily={MONO}
          fontWeight={400} fontSize={SIZE * 0.78} fill={COLORS.studioCream}>
          t
        </text>
      </svg>
    </AbsoluteFill>
  );
}

export const TMarkIdle: React.FC = () => <TMarkBase dotColor={COLORS.studioCream} />;
export const TMarkListening: React.FC = () => <TMarkBase dotColor={COLORS.hotMic} />;
