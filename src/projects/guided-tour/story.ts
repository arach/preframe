import { resolveTourExample, type TourCaption } from './profiles';

/** Continuous narration + captions — driven by TOUR_EXAMPLE (scout | talkie). */

export const TOUR_WARMUP_SEC = 1.5;
export const NARRATION_START_SEC = TOUR_WARMUP_SEC + 0.65;
/** Spreads the beat markers apart to give the cut room to breathe between lines. */
export const TOUR_MARKER_BREATH = 1.15;

export interface GuidedTourCaption {
  videoAtSec: number;
  line: string;
}

export function buildCaptions(
  captionDefs: TourCaption[],
  warmupSec = TOUR_WARMUP_SEC,
): GuidedTourCaption[] {
  return captionDefs.map((cap, idx) => {
    const videoAtSec =
      idx === 0
        ? NARRATION_START_SEC
        : warmupSec + (cap.markerAtSec ?? 0) * TOUR_MARKER_BREATH - 0.35;
    return { videoAtSec, line: cap.line };
  });
}

const active = resolveTourExample();

export const GUIDED_TOUR_STORY = active.story;
export const GUIDED_TOUR_CAPTIONS = buildCaptions(active.captions);

export function captionWindows(
  captions: GuidedTourCaption[] = GUIDED_TOUR_CAPTIONS,
  narrationEndSec: number,
  tailSec = 3.5,
) {
  return captions.map((cap, idx) => {
    const nextAt = captions[idx + 1]?.videoAtSec ?? narrationEndSec + tailSec;
    return {
      ...cap,
      durationSec: Math.max(1.2, nextAt - cap.videoAtSec - 0.15),
    };
  });
}