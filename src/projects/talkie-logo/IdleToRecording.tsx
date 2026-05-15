/**
 * TalkieIdleToRecording — the headline brand moment.
 *
 * Beat structure (~4s = 240 frames @ 60fps):
 * 1. Idle establish (0–1.5s / 0–90f): tapeTan dot with breath envelope, t in tapeTan
 * 2. Trigger moment (1.5–1.7s / 90–102f): the activation (3 variants)
 * 3. Hot Mic activated (1.7–4.0s / 102–240f): canonical 1.0Hz pulse, full studioCream t
 */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { COLORS, MONO, T_GEOMETRY, PULSE } from './tokens';

const FPS = 60;
const SIZE = 600;
export const IDLE_TO_RECORDING_FRAMES = 240; // 4s

type TriggerVariant = 'flicker' | 'preroll' | 'flood';

// Timing boundaries (in frames)
const IDLE_END = 90;        // 1.5s
const TRIGGER_END = 102;    // 1.7s
const TRIGGER_DURATION = TRIGGER_END - IDLE_END; // 12 frames = 200ms

function makeIdleToRecording(variant: TriggerVariant): React.FC {
  return () => {
    const frame = useCurrentFrame();
    const anchorX = SIZE * T_GEOMETRY.cellCenter;
    const stemCx = anchorX + SIZE * T_GEOMETRY.stemOffsetFromAnchor;
    const baseline = SIZE * 0.86;
    const dotR = (SIZE * T_GEOMETRY.stemWidth) / 2;
    const dotCy = SIZE * 0.21;
    const viewW = SIZE * 0.62;

    // Phase: idle (0), trigger (1), activated (2)
    const phase = frame < IDLE_END ? 0 : frame < TRIGGER_END ? 1 : 2;
    const triggerProgress = phase === 1 ? (frame - IDLE_END) / TRIGGER_DURATION : phase === 2 ? 1 : 0;

    // --- Idle breath envelope (mm-a-breath at 5.5s cycle, 3% amplitude) ---
    const breathCycleFrames = 5.5 * FPS;
    const breathPhase = (frame % breathCycleFrames) / breathCycleFrames;
    const breathStops = [
      [0, 0.92], [0.04, 0.925], [0.10, 0.95], [0.20, 1.00],
      [0.30, 1.055], [0.35, 1.06], [0.46, 1.035], [0.60, 1.00],
      [0.72, 0.965], [0.82, 0.93], [1.0, 0.92],
    ] as const;
    let rawBreath = 0.92;
    for (let i = 0; i < breathStops.length - 1; i++) {
      if (breathPhase >= breathStops[i][0] && breathPhase <= breathStops[i + 1][0]) {
        const seg = (breathPhase - breathStops[i][0]) / (breathStops[i + 1][0] - breathStops[i][0]);
        rawBreath = breathStops[i][1] + seg * (breathStops[i + 1][1] - breathStops[i][1]);
        break;
      }
    }
    const breathNorm = (rawBreath - 0.92) / (1.06 - 0.92);
    const idleDotScale = 1 + (breathNorm - 0.5) * 0.03 * 2;

    // --- Hot Mic 1.0Hz pulse ---
    const pulsePeriodFrames = (PULSE.periodMs / 1000) * FPS;
    const pulsePhase = ((frame - TRIGGER_END) % pulsePeriodFrames) / pulsePeriodFrames;
    const hotMicOpacity = interpolate(
      Math.sin(pulsePhase * Math.PI * 2),
      [-1, 1],
      [PULSE.opacityRange[0], PULSE.opacityRange[1]],
    );

    // --- Compute dot + glyph per variant ---
    let dotColor: string;
    let dotOpacity: number;
    let dotScale: number;
    let glyphFill: string;

    if (phase === 0) {
      // Idle state
      dotColor = COLORS.tapeTan;
      dotOpacity = 0.65;
      dotScale = idleDotScale;
      glyphFill = COLORS.tapeTan;
    } else if (phase === 2) {
      // Activated
      dotColor = COLORS.hotMic;
      dotOpacity = hotMicOpacity;
      dotScale = 1;
      glyphFill = COLORS.studioCream;
    } else {
      // Trigger — variant-specific
      const t = Easing.inOut(Easing.ease)(triggerProgress);

      switch (variant) {
        case 'flicker': {
          // Wake-up flicker: t snaps tapeTan→studioCream over 80ms
          // with 1-frame brightness overshoot at midpoint
          const flickerMid = 0.4; // midpoint of 200ms
          const isOvershoot = triggerProgress > flickerMid - 0.08 && triggerProgress < flickerMid + 0.08;
          glyphFill = isOvershoot ? '#FFFFFF' : lerpColor(COLORS.tapeTan, COLORS.studioCream, t);
          // Dot transitions color
          dotColor = lerpColor(COLORS.tapeTan, COLORS.hotMic, t);
          dotOpacity = interpolate(t, [0, 1], [0.65, 1]);
          dotScale = 1;
          break;
        }
        case 'preroll': {
          // Pre-roll breath: dot takes deep anticipation inhale (scale 1.35 over 200ms)
          // then collapses inward and becomes Hot Mic
          const inhalePhase = Math.min(t / 0.6, 1); // first 60% is inhale
          const collapsePhase = t > 0.6 ? (t - 0.6) / 0.4 : 0; // last 40% is collapse+color
          if (t <= 0.6) {
            // Inhale with overshoot
            const overshoot = Easing.bezier(0.2, 1.3, 0.4, 1)(inhalePhase);
            dotScale = 1 + overshoot * 0.35;
            dotColor = COLORS.tapeTan;
            dotOpacity = interpolate(inhalePhase, [0, 1], [0.65, 0.9]);
          } else {
            // Collapse: scale snaps back to 1, color floods to hotMic
            const collapseEased = Easing.out(Easing.ease)(collapsePhase);
            dotScale = interpolate(collapseEased, [0, 1], [1.35, 1]);
            dotColor = lerpColor(COLORS.tapeTan, COLORS.hotMic, collapseEased);
            dotOpacity = interpolate(collapseEased, [0, 1], [0.9, 1]);
          }
          glyphFill = lerpColor(COLORS.tapeTan, COLORS.studioCream, Easing.out(Easing.ease)(t));
          break;
        }
        case 'flood': {
          // Color flood: red wash sweeps left→right across dot via clip-path
          // Glyph stays dim during sweep, brightens at end
          dotColor = COLORS.hotMic;
          dotOpacity = 1;
          dotScale = 1;
          // We'll render two overlapping dots with a clip boundary
          glyphFill = lerpColor(COLORS.tapeTan, COLORS.studioCream, Easing.out(Easing.cubic)(t));
          break;
        }
      }
    }

    // Flood variant needs special SVG for the sweep
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
              {/* Base: tapeTan dot */}
              <circle cx={stemCx} cy={dotCy} r={dotR * 0.78} fill={COLORS.tapeTan} opacity={0.65} />
              {/* Flood overlay: hotMic sweeping in */}
              <circle cx={stemCx} cy={dotCy} r={dotR} fill={COLORS.hotMic} clipPath="url(#flood-clip)" />
            </>
          ) : (
            <circle
              cx={stemCx}
              cy={dotCy}
              r={dotR * (phase === 0 ? 0.78 : 1) * dotScale}
              fill={dotColor!}
              opacity={dotOpacity!}
            />
          )}

          <text
            x={anchorX}
            y={baseline}
            textAnchor="middle"
            fontFamily={MONO}
            fontWeight={400}
            fontSize={SIZE * 0.78}
            fill={glyphFill!}
          >
            t
          </text>
        </svg>
      </AbsoluteFill>
    );
  };
}

// --- Color interpolation ---
function lerpColor(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`;
}
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Export all three trigger variants
export const IdleToRecordingFlicker = makeIdleToRecording('flicker');
export const IdleToRecordingPreroll = makeIdleToRecording('preroll');
export const IdleToRecordingFlood = makeIdleToRecording('flood');
