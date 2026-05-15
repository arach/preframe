import { Composition, Folder, registerRoot } from 'remotion';
import { TMarkStateCycle, T_MARK_CYCLE_FRAMES } from './TMarkStateCycle';
import { WordmarkEntrance, WORDMARK_ENTRANCE_FRAMES } from './WordmarkEntrance';

// Idle — one calm static state
import { IdleNoDot, IdleWithDot, IDLE_FRAMES } from './states/Idle';

// Processing + error candidates
import { ProcessingPulsePair, PROCESSING_PULSE_PAIR_FRAMES } from './states/ProcessingPulsePair';
import { ProcessingTapeFlow, PROCESSING_TAPE_FLOW_FRAMES } from './states/ProcessingTapeFlow';
import { ProcessingReelsRotated, PROCESSING_REELS_ROTATED_FRAMES } from './states/ProcessingReelsRotated';
import { ErrorJitter, ERROR_JITTER_FRAMES } from './states/ErrorJitter';
import { ErrorWink, ERROR_WINK_FRAMES } from './states/ErrorWink';
import { ErrorOutlinePulse, ERROR_OUTLINE_PULSE_FRAMES } from './states/ErrorOutlinePulse';

// Idle→recording (flicker + flood only)
import {
  IdleToRecordingFlickerNoDot, IdleToRecordingFlickerWithDot,
  IdleToRecordingFloodNoDot, IdleToRecordingFloodWithDot,
  IDLE_TO_RECORDING_FRAMES,
} from './IdleToRecording';

// Wordmark filter variants
import { WordmarkCrtScan } from './wordmark-variants/CrtScan';
import { WordmarkMovieIntro } from './wordmark-variants/MovieIntro';
import { WordmarkTypewriter } from './wordmark-variants/Typewriter';
import { WordmarkFilmGrain } from './wordmark-variants/FilmGrain';
import { WordmarkNeonGlow } from './wordmark-variants/NeonGlow';
import { WordmarkGlitch } from './wordmark-variants/Glitch';
import { WordmarkInkBloom } from './wordmark-variants/InkBloom';
import { VARIANT_FRAMES } from './wordmark-variants/shared';
import {
  WordmarkCrtScanBezel, WordmarkMovieIntroBezel, WordmarkFilmGrainBezel,
  WordmarkNeonGlowBezel, WordmarkGlitchBezel, WordmarkInkBloomBezel,
} from './wordmark-variants/BezelWrapped';

// Letter-based wordmark animations (§B batch 4)
import { WordmarkRollout } from './wordmark-variants/LettersRollout';
import { WordmarkStamp } from './wordmark-variants/LettersStamp';
import { WordmarkSlideLeft } from './wordmark-variants/LettersSlideLeft';
import { WordmarkSlideUp } from './wordmark-variants/LettersSlideUp';
import { WordmarkCascadeFall } from './wordmark-variants/LettersCascadeFall';
import { WordmarkDecode } from './wordmark-variants/LettersDecode';
import { WordmarkZoomIn } from './wordmark-variants/LettersZoomIn';

const FPS = 60;
const SIZE = 2160;

const Root: React.FC = () => (
  <>
    <Folder name="Talkie-Logo">
      <Composition id="TMarkStateCycle" component={TMarkStateCycle} durationInFrames={T_MARK_CYCLE_FRAMES} fps={FPS} width={1080} height={1080} />
      <Composition id="WordmarkEntrance" component={WordmarkEntrance} durationInFrames={WORDMARK_ENTRANCE_FRAMES} fps={FPS} width={1080} height={1080} />
    </Folder>
    <Folder name="Talkie-Logo-States">
      <Composition id="IdleNoDot" component={IdleNoDot} durationInFrames={IDLE_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="IdleWithDot" component={IdleWithDot} durationInFrames={IDLE_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="ProcessingPulsePair" component={ProcessingPulsePair} durationInFrames={PROCESSING_PULSE_PAIR_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="ProcessingTapeFlow" component={ProcessingTapeFlow} durationInFrames={PROCESSING_TAPE_FLOW_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="ProcessingReelsRotated" component={ProcessingReelsRotated} durationInFrames={PROCESSING_REELS_ROTATED_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="ErrorJitter" component={ErrorJitter} durationInFrames={ERROR_JITTER_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="ErrorWink" component={ErrorWink} durationInFrames={ERROR_WINK_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="ErrorOutlinePulse" component={ErrorOutlinePulse} durationInFrames={ERROR_OUTLINE_PULSE_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
    </Folder>
    <Folder name="Talkie-Idle-To-Recording">
      <Composition id="FlickerNoDot" component={IdleToRecordingFlickerNoDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="FlickerWithDot" component={IdleToRecordingFlickerWithDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="FloodNoDot" component={IdleToRecordingFloodNoDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="FloodWithDot" component={IdleToRecordingFloodWithDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
    </Folder>
    <Folder name="Talkie-Wordmark-Variants">
      <Composition id="WordmarkCrtScan" component={WordmarkCrtScan} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="WordmarkMovieIntro" component={WordmarkMovieIntro} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="WordmarkTypewriter" component={WordmarkTypewriter} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="WordmarkFilmGrain" component={WordmarkFilmGrain} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="WordmarkNeonGlow" component={WordmarkNeonGlow} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="WordmarkGlitch" component={WordmarkGlitch} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="WordmarkInkBloom" component={WordmarkInkBloom} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
    </Folder>
    <Folder name="Talkie-Wordmark-Bezel">
      <Composition id="CrtScanBezel" component={WordmarkCrtScanBezel} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="MovieIntroBezel" component={WordmarkMovieIntroBezel} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="FilmGrainBezel" component={WordmarkFilmGrainBezel} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="NeonGlowBezel" component={WordmarkNeonGlowBezel} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="GlitchBezel" component={WordmarkGlitchBezel} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="InkBloomBezel" component={WordmarkInkBloomBezel} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
    </Folder>
    <Folder name="Talkie-Wordmark-Letters">
      <Composition id="LettersRollout" component={WordmarkRollout} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="LettersStamp" component={WordmarkStamp} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="LettersSlideLeft" component={WordmarkSlideLeft} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="LettersSlideUp" component={WordmarkSlideUp} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="LettersCascadeFall" component={WordmarkCascadeFall} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="LettersDecode" component={WordmarkDecode} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="LettersZoomIn" component={WordmarkZoomIn} durationInFrames={VARIANT_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
    </Folder>
  </>
);

registerRoot(Root);
