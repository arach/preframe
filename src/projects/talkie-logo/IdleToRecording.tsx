/**
 * TalkieIdleToRecording — the headline brand moment.
 *
 * Beat structure (~4s = 240 frames @ 60fps):
 * 1. Idle establish (0–1.5s): static studioCream glyph + dot per mode
 * 2. Trigger moment (1.5–1.7s): flicker or flood
 * 3. Hot Mic activated (1.7–4.0s): canonical 1.0Hz pulse
 */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { COLORS, MONO, T_GEOMETRY, PULSE } from './tokens';

const FPS = 60;
const SIZE = 600;
export const IDLE_TO_RECORDING_FRAMES = 240;

type TriggerVariant = 'flicker' | 'flood';
type DotMode = 'no-dot' | 'with-dot';

const IDLE_END = 90;
const TRIGGER_END = 102;
const TRIGGER_DURATION = TRIGGER_END - IDLE_END;

function makeIdleToRecording(variant: TriggerVariant, dotMode: DotMode): React.FC {
  return () => {
    const frame = useCurrentFrame();
    const anchorX = SIZE * T_GEOMETRY.cellCenter;
    const stemCx = anchorX + SIZE * T_GEOMETRY.stemOffsetFromAnchor;
    const baseline = SIZE * 0.86;
    const dotR = (SIZE * T_GEOMETRY.stemWidth) / 2;
    const dotCy = SIZE * 0.21;
    const viewW = SIZE * 0.62;

    const phase = frame < IDLE_END ? 0 : frame < TRIGGER_END ? 1 : 2;
    const triggerProgress = phase === 1 ? (frame - IDLE_END) / TRIGGER_DURATION : phase === 2 ? 1 : 0;

    // Hot Mic 1.0Hz pulse
    const pulsePeriodFrames = (PULSE.periodMs / 1000) * FPS;
    const pulsePhase = ((frame - TRIGGER_END) % pulsePeriodFrames) / pulsePeriodFrames;
    const hotMicOpacity = interpolate(
      Math.sin(pulsePhase * Math.PI * 2), [-1, 1],
      [PULSE.opacityRange[0], PULSE.opacityRange[1]],
    );

    const hasIdleDot = dotMode === 'with-dot';

    let dotColor: string;
    let dotOpacity: number;
    let dotScale: number;
    let showDot: boolean;

    if (phase === 0) {
      // Idle — static, full opacity, no envelopes
      dotColor = COLORS.studioCream;
      dotOpacity = 1;
      dotScale = 1;
      showDot = hasIdleDot;
    } else if (phase === 2) {
      // Activated
      dotColor = COLORS.hotMic;
      dotOpacity = hotMicOpacity;
      dotScale = 1;
      showDot = true;
    } else {
      // Trigger
      const t = Easing.inOut(Easing.ease)(triggerProgress);
      showDot = true;

      switch (variant) {
        case 'flicker': {
          const flickerMid = 0.4;
          const isOvershoot = triggerProgress > flickerMid - 0.08 && triggerProgress < flickerMid + 0.08;
          void isOvershoot;
          if (hasIdleDot) {
            dotColor = lerpColor(COLORS.studioCream, COLORS.hotMic, t);
            dotOpacity = 1;
          } else {
            dotColor = COLORS.hotMic;
            dotOpacity = interpolate(t, [0, 1], [0, 1]);
          }
          dotScale = 1;
          break;
        }
        case 'flood': {
          dotColor = COLORS.hotMic;
          dotOpacity = 1;
          dotScale = 1;
          break;
        }
      }
    }

    const glyphFill = COLORS.studioCream;

    // Flood variant special SVG
    const isFloodTrigger = variant === 'flood' && phase === 1;
    const floodT = phase === 1 ? Easing.inOut(Easing.ease)(triggerProgress) : 0;

    return (
      <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
        <svg viewBox={`0 0 ${viewW} ${SIZE}`} style={{ height: SIZE, width: 'auto' }}>
          <defs>
            {isFloodTrigger && (
              <clipPath id="flood-clip">
                <rect
                  x={stemCx - dotR * 1.5}
                  y={dotCy - dotR * 1.5}
                  width={dotR * 3 * floodT}
                  height={dotR * 3}
                />
              </clipPath>
            )}
          </defs>

          {isFloodTrigger ? (
            <>
              {hasIdleDot && (
                <circle cx={stemCx} cy={dotCy} r={dotR} fill={COLORS.studioCream} opacity={1 - floodT} />
              )}
              <circle cx={stemCx} cy={dotCy} r={dotR} fill={COLORS.hotMic} clipPath="url(#flood-clip)" />
            </>
          ) : (
            showDot && (
              <circle cx={stemCx} cy={dotCy} r={dotR * dotScale} fill={dotColor!} opacity={dotOpacity!} />
            )
          )}

          <text x={anchorX} y={baseline} textAnchor="middle" fontFamily={MONO}
            fontWeight={400} fontSize={SIZE * 0.78} fill={glyphFill}>
            t
          </text>
        </svg>
      </AbsoluteFill>
    );
  };
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseHex(a); const pb = parseHex(b);
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`;
}
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export const IdleToRecordingFlickerNoDot = makeIdleToRecording('flicker', 'no-dot');
export const IdleToRecordingFlickerWithDot = makeIdleToRecording('flicker', 'with-dot');
export const IdleToRecordingFloodNoDot = makeIdleToRecording('flood', 'no-dot');
export const IdleToRecordingFloodWithDot = makeIdleToRecording('flood', 'with-dot');
