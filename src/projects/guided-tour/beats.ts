import {
  GUIDED_TOUR_CAPTIONS,
  GUIDED_TOUR_STORY,
  NARRATION_START_SEC,
  captionWindows,
  type GuidedTourCaption,
} from './story';
import { resolveTourExample } from './profiles';
import {
  resolveNarrationSegments,
  narrationTimelineEnd,
  type NarrationSegment,
} from './narration';

const active = resolveTourExample();

export const GUIDED_TOUR_SOURCE = 'guided-tour/preframe-guided-tour.mov';

/** Fallback segment durations until narration-segments.json is refreshed. */
const FALLBACK_SEGMENT_DURATIONS = [4.7, 4.7, 3.2, 3.9, 3.2, 3.1];

export { NARRATION_START_SEC };
export type { NarrationSegment };

export interface GuidedTourVideoTiming {
  narrationSegments: NarrationSegment[];
  captions: GuidedTourCaption[];
  tailSec: number;
  sceneLabel: string;
  sceneSublabel: string;
  exampleId: string;
}

export const guidedTourDefaultTiming: GuidedTourVideoTiming = {
  narrationSegments: resolveNarrationSegments(
    GUIDED_TOUR_CAPTIONS,
    FALLBACK_SEGMENT_DURATIONS,
    active.narrationPrefix,
  ),
  captions: GUIDED_TOUR_CAPTIONS,
  tailSec: 3.5,
  sceneLabel: active.sceneLabel,
  sceneSublabel: active.sceneSublabel,
  exampleId: active.id,
};

/** Only the timeline fields — lets callers pass a partial timing (e.g. the
 *  Remotion component's local timing) without the scene-label metadata. */
type GuidedTourTimingCore = Pick<
  GuidedTourVideoTiming,
  'narrationSegments' | 'captions' | 'tailSec'
>;

export function guidedTourDurationFrames(
  timing: GuidedTourTimingCore = guidedTourDefaultTiming,
  fps = 30,
): number {
  const narrEnd = narrationTimelineEnd(timing.narrationSegments);
  const lastCap = timing.captions[timing.captions.length - 1];
  const visualEnd = lastCap ? lastCap.videoAtSec + timing.tailSec + 4 : narrEnd;
  return Math.ceil(Math.max(narrEnd + 0.8, visualEnd) * fps);
}

export function resolveCaptionWindows(timing: GuidedTourTimingCore = guidedTourDefaultTiming) {
  const narrEnd = narrationTimelineEnd(timing.narrationSegments);
  return captionWindows(timing.captions, narrEnd, timing.tailSec);
}

/** @deprecated Per-line beats — landing stills tour only. */
export const GUIDED_TOUR_STORY_TEXT = GUIDED_TOUR_STORY;