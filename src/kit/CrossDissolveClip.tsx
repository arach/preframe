/**
 * CrossDissolveClip — wraps any clip with first/last-N-frame opacity ramps.
 *
 * Drop-in replacement for hard cuts. When multiple consecutive clips are
 * placed with their <Sequence> `from` overlapping by `overlap` frames, the
 * outgoing clip's fade-out runs concurrently with the incoming clip's
 * fade-in, producing a true cross-dissolve.
 *
 * Caller is responsible for arranging Sequence positions and durations
 * such that consecutive clips overlap. Helper math below.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';

export interface CrossDissolveClipProps {
  /** Total length of this clip in frames. */
  durationInFrames: number;
  /** Frames over which to fade in / fade out. Default 18 (~0.6s @ 30fps). */
  overlap?: number;
  /** Skip the lead-in fade (for first clip). */
  isFirst?: boolean;
  /** Skip the lead-out fade (for last clip). */
  isLast?: boolean;
  children: React.ReactNode;
}

export const CrossDissolveClip: React.FC<CrossDissolveClipProps> = ({
  durationInFrames,
  overlap = 18,
  isFirst = false,
  isLast = false,
  children,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = isFirst
    ? interpolate(frame, [0, overlap], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      })
    : interpolate(frame, [0, overlap], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      });

  const fadeOut = isLast
    ? interpolate(
        frame,
        [durationInFrames - overlap, durationInFrames],
        [1, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        },
      )
    : interpolate(
        frame,
        [durationInFrames - overlap, durationInFrames],
        [1, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        },
      );

  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>{children}</AbsoluteFill>
  );
};

/**
 * Given a list of clip durations and an overlap, place each clip's `from`
 * timestamp so consecutive clips overlap by `overlap` frames.
 *
 * Returns the placement (from, durationInFrames) for each clip plus the
 * total body length.
 */
export function placeCrossDissolved(
  durations: number[],
  overlap: number,
  startFrame: number = 0,
): { placements: Array<{ from: number; durationInFrames: number }>; totalFrames: number } {
  const placements: Array<{ from: number; durationInFrames: number }> = [];
  let cursor = startFrame;
  for (let i = 0; i < durations.length; i++) {
    placements.push({ from: cursor, durationInFrames: durations[i] });
    cursor += durations[i] - overlap;
  }
  // Last clip's tail extends past cursor by `overlap` frames.
  const totalFrames = cursor + overlap - startFrame;
  return { placements, totalFrames };
}
