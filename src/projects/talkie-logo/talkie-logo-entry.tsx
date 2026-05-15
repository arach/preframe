import { Composition, Folder, registerRoot } from 'remotion';
import { TMarkStateCycle, T_MARK_CYCLE_FRAMES } from './TMarkStateCycle';
import { WordmarkEntrance, WORDMARK_ENTRANCE_FRAMES } from './WordmarkEntrance';

// State candidates
import { IdleBreath, IDLE_BREATH_FRAMES } from './states/IdleBreath';
import { IdleGlow, IDLE_GLOW_FRAMES } from './states/IdleGlow';
import { ProcessingPulsePair, PROCESSING_PULSE_PAIR_FRAMES } from './states/ProcessingPulsePair';
import { ProcessingTapeFlow, PROCESSING_TAPE_FLOW_FRAMES } from './states/ProcessingTapeFlow';
import { ProcessingReelsRotated, PROCESSING_REELS_ROTATED_FRAMES } from './states/ProcessingReelsRotated';
import { ErrorJitter, ERROR_JITTER_FRAMES } from './states/ErrorJitter';
import { ErrorWink, ERROR_WINK_FRAMES } from './states/ErrorWink';
import { ErrorOutlinePulse, ERROR_OUTLINE_PULSE_FRAMES } from './states/ErrorOutlinePulse';

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
      {/* IDLE candidates */}
      <Composition
        id="IdleBreath"
        component={IdleBreath}
        durationInFrames={IDLE_BREATH_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
      <Composition
        id="IdleGlow"
        component={IdleGlow}
        durationInFrames={IDLE_GLOW_FRAMES}
        fps={FPS}
        width={SIZE}
        height={SIZE}
      />
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
  </>
);

registerRoot(Root);
