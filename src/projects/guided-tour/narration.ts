import type { GuidedTourCaption } from './story';

export interface NarrationSegment {
  src: string;
  videoAtSec: number;
  durationSec: number;
}

/** Silence between VO lines so the capture can breathe. */
export const NARRATION_MIN_PAUSE_SEC = 1.7;

export function resolveNarrationSegments(
  captions: GuidedTourCaption[],
  durationsSec: number[],
  prefix = 'guided-tour/narration',
  minPauseSec = NARRATION_MIN_PAUSE_SEC,
): NarrationSegment[] {
  const segments: NarrationSegment[] = [];
  let previousEnd = 0;

  for (let idx = 0; idx < captions.length; idx++) {
    const probed = durationsSec[idx] ?? 4;
    const captionAt = captions[idx].videoAtSec;

    // Start at this beat's caption marker, unless the previous line plus its
    // pause pushes us later. durationSec is the real probed audio length — never
    // clamped to the caption window — so a VO line always finishes (it may run
    // under the next caption rather than being cut + faded early).
    const start =
      idx === 0
        ? captionAt
        : Math.max(captionAt, previousEnd + minPauseSec);

    const durationSec = Math.max(1.4, probed);

    segments.push({
      src: `${prefix}-${idx}.mp3`,
      videoAtSec: start,
      durationSec,
    });
    previousEnd = start + durationSec;
  }

  return segments;
}

/** @deprecated Use resolveNarrationSegments — fixed starts can overlap on tight beats. */
export function buildNarrationSegments(
  captions: GuidedTourCaption[],
  durationsSec: number[],
  prefix = 'guided-tour/narration',
): NarrationSegment[] {
  return resolveNarrationSegments(captions, durationsSec, prefix);
}

export function narrationTimelineEnd(segments: NarrationSegment[]): number {
  if (!segments.length) return 0;
  return Math.max(...segments.map((s) => s.videoAtSec + s.durationSec));
}

export function narrationPauses(segments: NarrationSegment[]): number[] {
  return segments.slice(0, -1).map((seg, idx) => {
    const end = seg.videoAtSec + seg.durationSec;
    return +(segments[idx + 1].videoAtSec - end).toFixed(2);
  });
}