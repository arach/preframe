import { Composition, Folder, registerRoot } from 'remotion';
import { TMarkStateCycle, T_MARK_CYCLE_FRAMES } from './TMarkStateCycle';
import { WordmarkEntrance, WORDMARK_ENTRANCE_FRAMES } from './WordmarkEntrance';

// State candidates
import { IdleBreath, IdleBreathNoDot, IdleBreathWhiteDot, IDLE_BREATH_FRAMES } from './states/IdleBreath';
import { IdleGlow, IdleGlowNoDot, IdleGlowWhiteDot, IDLE_GLOW_FRAMES } from './states/IdleGlow';
import { ProcessingPulsePair, PROCESSING_PULSE_PAIR_FRAMES } from './states/ProcessingPulsePair';
import { ProcessingTapeFlow, PROCESSING_TAPE_FLOW_FRAMES } from './states/ProcessingTapeFlow';
import { ProcessingReelsRotated, PROCESSING_REELS_ROTATED_FRAMES } from './states/ProcessingReelsRotated';
import { ErrorJitter, ERROR_JITTER_FRAMES } from './states/ErrorJitter';
import { ErrorWink, ERROR_WINK_FRAMES } from './states/ErrorWink';
import { ErrorOutlinePulse, ERROR_OUTLINE_PULSE_FRAMES } from './states/ErrorOutlinePulse';

// §3 — idle→recording showpiece
import {
  IdleToRecordingFlicker,
  IdleToRecordingPreroll,
  IdleToRecordingFlood,
  IdleToRecordingFlickerNoDot,
  IdleToRecordingFlickerWhiteDot,
  IdleToRecordingPrerollNoDot,
  IdleToRecordingPrerollWhiteDot,
  IdleToRecordingFloodNoDot,
  IdleToRecordingFloodWhiteDot,
  IDLE_TO_RECORDING_FRAMES,
} from './IdleToRecording';

// §2 — wordmark filter variants
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

const FPS = 60;
const SIZE = 2160;

const Root: React.FC = () => (
  <>
    <Folder name="Talkie-Logo">
      <Composition
        id="TMarkStateCycle"
        component={TMarkStateCycle}
        durationInFrames={T_MARK_CYCLE_FRAMES}
        fps={FPS}
        width={1080}
        height={1080}
      />
      <Composition
        id="WordmarkEntrance"
        component={WordmarkEntrance}
        durationInFrames={WORDMARK_ENTRANCE_FRAMES}
        fps={FPS}
        width={1080}
        height={1080}
      />
    </Folder>
    <Folder name="Talkie-Logo-States">
      {/* IDLE candidates — sub-variants */}
      <Composition id="IdleBreathNoDot" component={IdleBreathNoDot} durationInFrames={IDLE_BREATH_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="IdleBreathWhiteDot" component={IdleBreathWhiteDot} durationInFrames={IDLE_BREATH_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="IdleGlowNoDot" component={IdleGlowNoDot} durationInFrames={IDLE_GLOW_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="IdleGlowWhiteDot" component={IdleGlowWhiteDot} durationInFrames={IDLE_GLOW_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      {/* PROCESSING candidates */}
      <Composition
        id="ProcessingPulsePair"
        component={ProcessingPulsePair}
        durationInFrames={PROCESSING_PULSE_PAIR_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
      <Composition
        id="ProcessingTapeFlow"
        component={ProcessingTapeFlow}
        durationInFrames={PROCESSING_TAPE_FLOW_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
      <Composition
        id="ProcessingReelsRotated"
        component={ProcessingReelsRotated}
        durationInFrames={PROCESSING_REELS_ROTATED_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
      {/* ERROR candidates */}
      <Composition
        id="ErrorJitter"
        component={ErrorJitter}
        durationInFrames={ERROR_JITTER_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
      <Composition
        id="ErrorWink"
        component={ErrorWink}
        durationInFrames={ERROR_WINK_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
      <Composition
        id="ErrorOutlinePulse"
        component={ErrorOutlinePulse}
        durationInFrames={ERROR_OUTLINE_PULSE_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
    </Folder>
    <Folder name="Talkie-Idle-To-Recording">
      <Composition id="FlickerNoDot" component={IdleToRecordingFlickerNoDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="FlickerWhiteDot" component={IdleToRecordingFlickerWhiteDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="PrerollNoDot" component={IdleToRecordingPrerollNoDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="PrerollWhiteDot" component={IdleToRecordingPrerollWhiteDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="FloodNoDot" component={IdleToRecordingFloodNoDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
      <Composition id="FloodWhiteDot" component={IdleToRecordingFloodWhiteDot} durationInFrames={IDLE_TO_RECORDING_FRAMES} fps={FPS} width={SIZE} height={SIZE} />
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
  </>
);

registerRoot(Root);
