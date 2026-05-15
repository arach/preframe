/** Dot library showcase reel — all 10 primitives labeled in sequence. */
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../tokens';
import {
  DotBlink, DOT_BLINK_FRAMES,
  DotAppear, DOT_APPEAR_FRAMES,
  DotDisappear, DOT_DISAPPEAR_FRAMES,
  DotColorCreamToRed, DOT_COLOR_CREAM_TO_RED_FRAMES,
  DotColorRedToCream, DOT_COLOR_RED_TO_CREAM_FRAMES,
  DotIdleWander, DOT_IDLE_WANDER_FRAMES,
  DotPulseHotMic, DOT_PULSE_HOT_MIC_FRAMES,
  DotPulseSlow, DOT_PULSE_SLOW_FRAMES,
  DotSplitToTwinReels, DOT_SPLIT_FRAMES,
  DotMergeFromTwinReels, DOT_MERGE_FRAMES,
} from './primitives';

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const GAP = 9;
const HOLD = 30; // extra hold after each primitive
const SLATE_FRAMES = 60;

interface Entry { label: string; Component: React.FC; frames: number }

const entries: Entry[] = [
  { label: 'BLINK', Component: DotBlink, frames: DOT_BLINK_FRAMES },
  { label: 'APPEAR', Component: DotAppear, frames: DOT_APPEAR_FRAMES + HOLD },
  { label: 'DISAPPEAR', Component: DotDisappear, frames: DOT_DISAPPEAR_FRAMES + HOLD },
  { label: 'CREAM → RED', Component: DotColorCreamToRed, frames: DOT_COLOR_CREAM_TO_RED_FRAMES + HOLD },
  { label: 'RED → CREAM', Component: DotColorRedToCream, frames: DOT_COLOR_RED_TO_CREAM_FRAMES + HOLD },
  { label: 'IDLE WANDER', Component: DotIdleWander, frames: DOT_IDLE_WANDER_FRAMES },
  { label: 'PULSE · HOT MIC', Component: DotPulseHotMic, frames: DOT_PULSE_HOT_MIC_FRAMES },
  { label: 'PULSE · SLOW', Component: DotPulseSlow, frames: DOT_PULSE_SLOW_FRAMES },
  { label: 'SPLIT → TWIN', Component: DotSplitToTwinReels, frames: DOT_SPLIT_FRAMES + HOLD },
  { label: 'MERGE ← TWIN', Component: DotMergeFromTwinReels, frames: DOT_MERGE_FRAMES + HOLD },
];

export const DOT_SHOWCASE_FRAMES = SLATE_FRAMES + GAP + entries.reduce((sum, e) => sum + e.frames + GAP, 0) + SLATE_FRAMES;

function Label({ text, opacity }: { text: string; opacity: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: 80, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', opacity,
    }}>
      <span style={{
        fontFamily: MONO, fontWeight: 400, fontSize: 14,
        color: COLORS.studioCream, letterSpacing: '0.24em', textTransform: 'uppercase',
      }}>{text}</span>
    </div>
  );
}

function Segment({ index, label, Component, frames }: Entry & { index: number }) {
  const frame = useCurrentFrame();
  const labelIn = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const labelOut = interpolate(frame, [frames - 10, frames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Component />
      <Label text={`${String(index + 1).padStart(2, '0')} · ${label}`} opacity={Math.min(labelIn, labelOut) * 0.7} />
    </AbsoluteFill>
  );
}

function Slate({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 15, SLATE_FRAMES - 15, SLATE_FRAMES], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ fontFamily: MONO, fontWeight: 400, fontSize: 16, color: COLORS.studioCream, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: o }}>
        {text}
      </span>
    </AbsoluteFill>
  );
}

export const DotShowcase: React.FC = () => {
  let offset = 0;
  const seqs: React.ReactNode[] = [];

  seqs.push(<Sequence key="intro" from={offset} durationInFrames={SLATE_FRAMES}><Slate text="TALKIE · DOT LIBRARY" /></Sequence>);
  offset += SLATE_FRAMES + GAP;

  entries.forEach((e, i) => {
    seqs.push(
      <Sequence key={`seg-${i}`} from={offset} durationInFrames={e.frames}>
        <Segment index={i} label={e.label} Component={e.Component} frames={e.frames} />
      </Sequence>
    );
    offset += e.frames + GAP;
  });

  seqs.push(<Sequence key="outro" from={offset} durationInFrames={SLATE_FRAMES}><Slate text={`${entries.length} PRIMITIVES · 2026-05-15`} /></Sequence>);

  return <AbsoluteFill style={{ backgroundColor: '#000' }}>{seqs}</AbsoluteFill>;
};
