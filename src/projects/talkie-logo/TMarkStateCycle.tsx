import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { COLORS, MONO, T_GEOMETRY, PULSE } from './tokens';

const FPS = 60;

// Timing in frames (at 60fps)
const STATE_HOLD = 1.75 * FPS; // 105 frames = 1.75s per state
const TRANSITION = 0.3 * FPS;  // 18 frames = 300ms transitions
const SEGMENT = STATE_HOLD + TRANSITION; // 123 frames per segment

// Full cycle: 4 states × (hold + transition) = 492 frames = 8.2s
export const T_MARK_CYCLE_FRAMES = SEGMENT * 4;

type State = 'idle' | 'listening' | 'processing' | 'error';
const STATES: State[] = ['idle', 'listening', 'processing', 'error'];

function getStateAtFrame(frame: number): { state: State; nextState: State; transition: number } {
  const looped = frame % T_MARK_CYCLE_FRAMES;
  const segmentIndex = Math.floor(looped / SEGMENT);
  const withinSegment = looped - segmentIndex * SEGMENT;

  const state = STATES[segmentIndex];
  const nextState = STATES[(segmentIndex + 1) % 4];

  const transition = withinSegment > STATE_HOLD
    ? (withinSegment - STATE_HOLD) / TRANSITION
    : 0;

  return { state, nextState, transition };
}

function stateColor(state: State): string {
  switch (state) {
    case 'idle': return COLORS.tapeTan;
    case 'listening': return COLORS.hotMic;
    case 'processing': return COLORS.cassetteOrange;
    case 'error': return COLORS.cautionYellow;
  }
}

function glyphColor(state: State): string {
  return state === 'idle' ? COLORS.tapeTan : COLORS.studioCream;
}

export const TMarkStateCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const { state, nextState, transition } = getStateAtFrame(frame);
  const t = Easing.inOut(Easing.ease)(transition);

  const size = 600;
  const viewW = size * 0.62;
  const anchorX = size * T_GEOMETRY.cellCenter;
  const stemCx = anchorX + size * T_GEOMETRY.stemOffsetFromAnchor;
  const baseline = size * 0.86;
  const dotR = (size * T_GEOMETRY.stemWidth) / 2;
  const dotCy = size * 0.12;

  // Interpolate glyph color during transition
  const currentGlyphColor = transition > 0
    ? lerpColor(glyphColor(state), glyphColor(nextState), t)
    : glyphColor(state);

  // Indicator opacity: fade out current, fade in next during transition
  const currentIndicatorOpacity = transition > 0 ? 1 - t : 1;
  const nextIndicatorOpacity = transition > 0 ? t : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg
        viewBox={`0 0 ${viewW} ${size}`}
        style={{ height: size, width: 'auto', display: 'block' }}
      >
        {/* Current state indicator */}
        <g opacity={currentIndicatorOpacity}>
          <Indicator state={state} stemCx={stemCx} dotCy={dotCy} dotR={dotR} frame={frame} />
        </g>

        {/* Next state indicator (during transition) */}
        {transition > 0 && (
          <g opacity={nextIndicatorOpacity}>
            <Indicator state={nextState} stemCx={stemCx} dotCy={dotCy} dotR={dotR} frame={frame} />
          </g>
        )}

        {/* The t glyph — static through all states */}
        <text
          x={anchorX}
          y={baseline}
          textAnchor="middle"
          fontFamily={MONO}
          fontWeight={500}
          fontSize={size * 0.78}
          fill={currentGlyphColor}
        >
          t
        </text>
      </svg>

      {/* State label */}
      <div style={{
        position: 'absolute',
        bottom: 140,
        fontFamily: MONO.replace(/"/g, ''),
        fontSize: 18,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: COLORS.tapeTan,
        opacity: transition > 0 ? 1 - t : 1,
      }}>
        {state}
      </div>
      {transition > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 140,
          fontFamily: MONO.replace(/"/g, ''),
          fontSize: 18,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: COLORS.tapeTan,
          opacity: t,
        }}>
          {nextState}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Indicator shapes per state
// ---------------------------------------------------------------------------

function Indicator({
  state,
  stemCx,
  dotCy,
  dotR,
  frame,
}: {
  state: State;
  stemCx: number;
  dotCy: number;
  dotR: number;
  frame: number;
}) {
  const color = stateColor(state);

  switch (state) {
    case 'idle':
      // Small dot, no animation, recessive
      return <circle cx={stemCx} cy={dotCy} r={dotR * 0.6} fill={color} opacity={0.5} />;

    case 'listening': {
      // 1.0Hz pulse — brand canonical motion
      const periodFrames = (PULSE.periodMs / 1000) * FPS;
      const phase = (frame % periodFrames) / periodFrames;
      const opacity = interpolate(
        Math.sin(phase * Math.PI * 2),
        [-1, 1],
        [PULSE.opacityRange[0], PULSE.opacityRange[1]],
      );
      return <circle cx={stemCx} cy={dotCy} r={dotR} fill={color} opacity={opacity} />;
    }

    case 'processing': {
      // Twin reels — "one becomes two becomes one" at 2.4s cycle
      const reelPeriod = 2.4 * FPS; // 144 frames
      const reelPhase = (frame % reelPeriod) / reelPeriod;
      // Mass-conservation: one dot splits into two, merges back
      const spread = Math.sin(reelPhase * Math.PI * 2) * dotR * 2.5;
      const scale = interpolate(Math.abs(spread), [0, dotR * 2.5], [1, 0.65]);
      return (
        <g>
          <circle
            cx={stemCx - spread * 0.5}
            cy={dotCy}
            r={dotR * scale}
            fill={color}
          />
          <circle
            cx={stemCx + spread * 0.5}
            cy={dotCy}
            r={dotR * scale}
            fill={color}
          />
        </g>
      );
    }

    case 'error':
      // Yellow square — snaps in, no pulse, never Hot Mic
      return (
        <rect
          x={stemCx - dotR}
          y={dotCy - dotR}
          width={dotR * 2}
          height={dotR * 2}
          fill={color}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Color interpolation helper
// ---------------------------------------------------------------------------

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
