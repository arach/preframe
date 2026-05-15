/** All 10 dot-library motion primitives. */
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FPS, SIZE, COLORS, MONO, dotGeom } from './shared';
import { PULSE } from '../tokens';

function TMarkWithDot({ dotCx, dotCy, dotR, dotFill, dotOpacity, dotScaleX, dotScaleY, dotTranslateX, dotTranslateY }: {
  dotCx?: number; dotCy?: number; dotR?: number; dotFill?: string;
  dotOpacity?: number; dotScaleX?: number; dotScaleY?: number;
  dotTranslateX?: number; dotTranslateY?: number;
}) {
  const g = dotGeom();
  const cx = dotCx ?? g.stemCx;
  const cy = dotCy ?? g.dotCy;
  const r = dotR ?? g.dotR;
  const tx = dotTranslateX ?? 0;
  const ty = dotTranslateY ?? 0;
  const sx = dotScaleX ?? 1;
  const sy = dotScaleY ?? 1;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${SIZE}`} style={{ height: SIZE, width: 'auto' }}>
        {(dotOpacity ?? 1) > 0 && (
          <circle cx={cx + tx} cy={cy + ty} r={r} fill={dotFill ?? COLORS.studioCream}
            opacity={dotOpacity ?? 1}
            transform={sx !== 1 || sy !== 1 ? `translate(${cx + tx},${cy + ty}) scale(${sx},${sy}) translate(${-(cx + tx)},${-(cy + ty)})` : undefined}
          />
        )}
        <text x={g.anchorX} y={g.baseline} textAnchor="middle" fontFamily={MONO}
          fontWeight={400} fontSize={SIZE * 0.78} fill={COLORS.studioCream}>t</text>
      </svg>
    </AbsoluteFill>
  );
}

// Multi-dot variant for twin reels
function TMarkWithTwinDots({ leftR, rightR, spread, fill }: { leftR: number; rightR: number; spread: number; fill: string }) {
  const g = dotGeom();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${g.viewW} ${SIZE}`} style={{ height: SIZE, width: 'auto' }}>
        <circle cx={g.stemCx - spread} cy={g.dotCy} r={leftR} fill={fill} />
        <circle cx={g.stemCx + spread} cy={g.dotCy} r={rightR} fill={fill} />
        <text x={g.anchorX} y={g.baseline} textAnchor="middle" fontFamily={MONO}
          fontWeight={400} fontSize={SIZE * 0.78} fill={COLORS.studioCream}>t</text>
      </svg>
    </AbsoluteFill>
  );
}

// ---- PRIMITIVES ----

export const DOT_BLINK_FRAMES = 90; // 1.5s
export const DotBlink: React.FC = () => {
  const frame = useCurrentFrame();
  const g = dotGeom();
  // Blink at ~1.0s: fast close (5f), hold (3f), slow open (11f)
  const blinkStart = 55;
  let scaleY = 1;
  if (frame >= blinkStart && frame < blinkStart + 5) scaleY = interpolate(frame, [blinkStart, blinkStart + 5], [1, 0.05]);
  else if (frame >= blinkStart + 5 && frame < blinkStart + 8) scaleY = 0.05;
  else if (frame >= blinkStart + 8 && frame < blinkStart + 19) scaleY = interpolate(frame, [blinkStart + 8, blinkStart + 19], [0.05, 1], { easing: Easing.out(Easing.ease) });
  return <TMarkWithDot dotScaleY={scaleY} />;
};

export const DOT_APPEAR_FRAMES = 24; // 0.4s
export const DotAppear: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease) });
  const scale = p < 0.85 ? interpolate(p, [0, 0.85], [0, 1.1]) : interpolate(p, [0.85, 1], [1.1, 1]);
  return <TMarkWithDot dotOpacity={p} dotScaleX={scale} dotScaleY={scale} />;
};

export const DOT_DISAPPEAR_FRAMES = 24; // 0.4s
export const DotDisappear: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.ease) });
  return <TMarkWithDot dotOpacity={1 - p} dotScaleX={1 - p * 0.8} dotScaleY={1 - p * 0.8} />;
};

export const DOT_COLOR_CREAM_TO_RED_FRAMES = 18; // 0.3s
export const DotColorCreamToRed: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
  const r = Math.round(244 + (255 - 244) * p);
  const g = Math.round(239 + (83 - 239) * p);
  const b = Math.round(230 + (70 - 230) * p);
  return <TMarkWithDot dotFill={`rgb(${r},${g},${b})`} />;
};

export const DOT_COLOR_RED_TO_CREAM_FRAMES = 18;
export const DotColorRedToCream: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
  const r = Math.round(255 + (244 - 255) * p);
  const g = Math.round(83 + (239 - 83) * p);
  const b = Math.round(70 + (230 - 70) * p);
  return <TMarkWithDot dotFill={`rgb(${r},${g},${b})`} />;
};

export const DOT_IDLE_WANDER_FRAMES = 240; // 4s loop
export const DotIdleWander: React.FC = () => {
  const frame = useCurrentFrame();
  const tx = Math.sin(frame * 0.026) * 2;
  const ty = Math.cos(frame * 0.019) * 2;
  return <TMarkWithDot dotTranslateX={tx} dotTranslateY={ty} />;
};

export const DOT_PULSE_HOT_MIC_FRAMES = 120; // 2s (2 cycles)
export const DotPulseHotMic: React.FC = () => {
  const frame = useCurrentFrame();
  const periodFrames = (PULSE.periodMs / 1000) * FPS;
  const phase = (frame % periodFrames) / periodFrames;
  const opacity = interpolate(Math.sin(phase * Math.PI * 2), [-1, 1], [PULSE.opacityRange[0], PULSE.opacityRange[1]]);
  return <TMarkWithDot dotFill={COLORS.hotMic} dotOpacity={opacity} />;
};

export const DOT_PULSE_SLOW_FRAMES = 144; // 2.4s loop
export const DotPulseSlow: React.FC = () => {
  const frame = useCurrentFrame();
  const phase = (frame % 144) / 144;
  const opacity = interpolate(Math.sin(phase * Math.PI * 2), [-1, 1], [0.5, 1]);
  return <TMarkWithDot dotOpacity={opacity} />;
};

export const DOT_SPLIT_FRAMES = 30; // 0.5s
export const DotSplitToTwinReels: React.FC = () => {
  const frame = useCurrentFrame();
  const g = dotGeom();
  const p = interpolate(frame, [0, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease) });
  const spread = p * g.dotR * 1.6;
  const r = g.dotR * interpolate(p, [0, 1], [1, 0.7]);
  return <TMarkWithTwinDots leftR={r} rightR={r} spread={spread} fill={COLORS.cassetteOrange} />;
};

export const DOT_MERGE_FRAMES = 30;
export const DotMergeFromTwinReels: React.FC = () => {
  const frame = useCurrentFrame();
  const g = dotGeom();
  const p = interpolate(frame, [0, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.ease) });
  const spread = (1 - p) * g.dotR * 1.6;
  const r = g.dotR * interpolate(p, [0, 1], [0.7, 1]);
  return spread < 0.5
    ? <TMarkWithDot dotFill={COLORS.studioCream} />
    : <TMarkWithTwinDots leftR={r} rightR={r} spread={spread} fill={COLORS.cassetteOrange} />;
};
