import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ACCENT, CaptionCard, MonitorFrame, TacticalFrame } from '../../kit';
import {
  GUIDED_TOUR_SOURCE,
  guidedTourDefaultTiming,
  guidedTourDurationFrames,
  resolveCaptionWindows,
  type GuidedTourVideoTiming,
  type NarrationSegment,
} from './beats';

export interface GuidedTourVideoProps extends Record<string, unknown> {
  source: string;
  narrationSegments: NarrationSegment[];
  captions: GuidedTourVideoTiming['captions'];
  tailSec: number;
  sceneLabel: string;
  sceneSublabel: string;
  exampleId: string;
  /** Music bed (staticFile path under public/). Empty string = no music. */
  musicSrc?: string;
  /** Ducked bed level (0–1). VO sits on top. */
  musicVolume?: number;
}

/** Calm synth bed, ducked low under the narration. */
const GUIDED_TOUR_MUSIC = 'tracks/futuristic-synthwave.mp3';

export const guidedTourDefaultProps: GuidedTourVideoProps = {
  ...guidedTourDefaultTiming,
  source: GUIDED_TOUR_SOURCE,
  musicSrc: GUIDED_TOUR_MUSIC,
  musicVolume: 0.12,
};

export function guidedTourTotalFrames(props: GuidedTourVideoProps): number {
  return guidedTourDurationFrames(props, 30);
}

const BeatNarration: React.FC<{
  src: string;
  durationFrames: number;
}> = ({ src, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeFrames = Math.min(10, Math.floor(fps * 0.2));

  const volume = interpolate(
    frame,
    [0, fadeFrames, durationFrames - fadeFrames, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return <Audio src={staticFile(src)} volume={volume} />;
};

const CaptionOverlay: React.FC<{ line: string; durationFrames: number }> = ({
  line,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const fade = Math.min(14, Math.floor(durationFrames * 0.1));

  const opacity = interpolate(
    frame,
    [0, fade, durationFrames - fade, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 72,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <CaptionCard role="setup" label="PREFRAME" text={line} />
    </AbsoluteFill>
  );
};

/** Ducked music bed with slow fade in / out across the whole reel. */
const MusicBed: React.FC<{ src: string; level: number }> = ({ src, level }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const volume = interpolate(
    frame,
    [0, fps * 1.5, durationInFrames - fps * 2.5, durationInFrames],
    [0, level, level, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) },
  );

  return <Audio src={staticFile(src)} volume={volume} />;
};

export const GuidedTourVideo: React.FC<GuidedTourVideoProps> = ({
  source,
  narrationSegments,
  captions,
  tailSec,
  sceneLabel,
  sceneSublabel,
  exampleId,
  musicSrc = GUIDED_TOUR_MUSIC,
  musicVolume = 0.12,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const captionWindows = resolveCaptionWindows({ narrationSegments, captions, tailSec });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0d' }}>
      <MonitorFrame wordmark="preframe" monitorWidthPct={92} monitorHeightPct={84}>
        <OffthreadVideo
          src={staticFile(source)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
        />
      </MonitorFrame>

      {/* Hyperframe-style grade: a soft vignette to settle the edges. */}
      <AbsoluteFill
        style={{ pointerEvents: 'none', boxShadow: 'inset 0 0 240px 70px rgba(0,0,0,0.5)' }}
      />

      {/* Corner-HUD instrument frame (replaces the bare scene label). */}
      <TacticalFrame
        totalFrames={durationInFrames}
        title={sceneLabel}
        subtitle={sceneSublabel}
        stats={['1920×1080', '30fps', exampleId]}
        versionTag="preframe · guided tour"
        recLabel="REC"
        recColor={ACCENT}
        guideMargin={26}
      />

      {musicSrc ? <MusicBed src={musicSrc} level={musicVolume} /> : null}

      {narrationSegments.map((segment, idx) => {
        const from = Math.round(segment.videoAtSec * fps);
        const durationInFrames = Math.ceil(segment.durationSec * fps);
        return (
          <Sequence
            key={`narration-${idx}`}
            from={from}
            durationInFrames={durationInFrames}
            name={`narration-${idx}`}
          >
            <BeatNarration src={segment.src} durationFrames={durationInFrames} />
          </Sequence>
        );
      })}

      {captionWindows.map((cap, idx) => {
        const from = Math.round(cap.videoAtSec * fps);
        const durationInFrames = Math.ceil(cap.durationSec * fps);
        return (
          <Sequence key={`caption-${idx}`} from={from} durationInFrames={durationInFrames} name={`caption-${idx}`}>
            <CaptionOverlay line={cap.line} durationFrames={durationInFrames} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};