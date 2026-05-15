/**
 * TalkieIntroShowcase — one labeled showcase reel of all intro variants.
 * Each segment: ~3.5s (210 frames @ 60fps) with label overlay + 150ms black gaps.
 */
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, staticFile } from 'remotion';
import { COLORS } from './tokens';

// Letter-kinetic
import { WordmarkRollout } from './wordmark-variants/LettersRollout';
import { WordmarkStamp } from './wordmark-variants/LettersStamp';
import { WordmarkSlideUp } from './wordmark-variants/LettersSlideUp';
import { WordmarkWipeVertical } from './wordmark-variants/LettersWipeVertical';
import { WordmarkFlip3d } from './wordmark-variants/LettersFlip3d';
import { WordmarkCascadeFall } from './wordmark-variants/LettersCascadeFall';
import { WordmarkDecode } from './wordmark-variants/LettersDecode';
import { WordmarkZoomIn } from './wordmark-variants/LettersZoomIn';
import { WordmarkTypewriter } from './wordmark-variants/Typewriter';
import { WordmarkSlideLeft } from './wordmark-variants/LettersSlideLeft';

// Filter
import { WordmarkInkBloom } from './wordmark-variants/InkBloom';
import { WordmarkMovieIntro } from './wordmark-variants/MovieIntro';
import { WordmarkFilmGrain } from './wordmark-variants/FilmGrain';
import { WordmarkNeonGlow } from './wordmark-variants/NeonGlow';
import { WordmarkCrtScan } from './wordmark-variants/CrtScan';
import { WordmarkGlitch } from './wordmark-variants/Glitch';

// Cinematic (new)
import { WordmarkAnamorphicFlare } from './wordmark-variants/CinematicAnamorphicFlare';
import { WordmarkTealOrange } from './wordmark-variants/CinematicTealOrange';
import { WordmarkSlowZoom } from './wordmark-variants/CinematicSlowZoom';
import { WordmarkTitleCard } from './wordmark-variants/CinematicTitleCard';
import { WordmarkTrailerSnap } from './wordmark-variants/CinematicTrailerSnap';

const FPS = 60;
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

const SEGMENT_FRAMES = 210; // 3.5s per segment
const GAP_FRAMES = 9;       // 150ms black between
const SLATE_FRAMES = 90;    // 1.5s for intro/outro slates

interface Segment {
  label: string;
  Component: React.FC;
}

const segments: Segment[] = [
  // Open clean
  { label: 'TITLE CARD', Component: WordmarkTitleCard },
  { label: 'MOVIE INTRO', Component: WordmarkMovieIntro },
  // Letter-kinetic block
  { label: 'ROLLOUT', Component: WordmarkRollout },
  { label: 'STAMP', Component: WordmarkStamp },
  { label: 'SLIDE UP', Component: WordmarkSlideUp },
  { label: 'SLIDE LEFT', Component: WordmarkSlideLeft },
  { label: 'WIPE', Component: WordmarkWipeVertical },
  { label: 'FLIP', Component: WordmarkFlip3d },
  { label: 'CASCADE', Component: WordmarkCascadeFall },
  { label: 'DECODE', Component: WordmarkDecode },
  { label: 'ZOOM IN', Component: WordmarkZoomIn },
  { label: 'TYPEWRITER', Component: WordmarkTypewriter },
  // Filter block
  { label: 'INK BLOOM', Component: WordmarkInkBloom },
  { label: 'NEON GLOW', Component: WordmarkNeonGlow },
  { label: 'CRT SCAN', Component: WordmarkCrtScan },
  { label: 'GLITCH', Component: WordmarkGlitch },
  { label: 'FILM GRAIN', Component: WordmarkFilmGrain },
  // Cinematic block
  { label: 'ANAMORPHIC FLARE', Component: WordmarkAnamorphicFlare },
  { label: 'TEAL & ORANGE', Component: WordmarkTealOrange },
  { label: 'SLOW ZOOM', Component: WordmarkSlowZoom },
  { label: 'TRAILER SNAP', Component: WordmarkTrailerSnap },
];

const TOTAL_FRAMES = SLATE_FRAMES + GAP_FRAMES
  + segments.length * (SEGMENT_FRAMES + GAP_FRAMES)
  + SLATE_FRAMES;

export const SHOWCASE_FRAMES = TOTAL_FRAMES;

function SlateLabel({ text, opacity }: { text: string; opacity: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: 80, left: 0, right: 0, display: 'flex',
      justifyContent: 'center', alignItems: 'center', opacity,
    }}>
      <span style={{
        fontFamily: MONO, fontWeight: 400, fontSize: 14, color: COLORS.studioCream,
        letterSpacing: '0.24em', textTransform: 'uppercase',
      }}>
        {text}
      </span>
    </div>
  );
}

function SegmentWithLabel({ index, label, Component }: { index: number; label: string; Component: React.FC }) {
  const frame = useCurrentFrame();
  const labelIn = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const labelOut = interpolate(frame, [SEGMENT_FRAMES - 12, SEGMENT_FRAMES], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const labelOpacity = Math.min(labelIn, labelOut);

  const num = String(index + 1).padStart(2, '0');

  return (
    <AbsoluteFill>
      <Component />
      <SlateLabel text={`${num} · ${label}`} opacity={labelOpacity * 0.7} />
    </AbsoluteFill>
  );
}

function TitleSlate({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, SLATE_FRAMES - 20, SLATE_FRAMES], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ribbonBlack, justifyContent: 'center', alignItems: 'center' }}>
      <span style={{
        fontFamily: MONO, fontWeight: 400, fontSize: 16, color: COLORS.studioCream,
        letterSpacing: '0.3em', textTransform: 'uppercase', opacity,
      }}>
        {text}
      </span>
    </AbsoluteFill>
  );
}

export const TalkieIntroShowcase: React.FC = () => {
  let offset = 0;

  const sequences: React.ReactNode[] = [];

  // Intro slate
  sequences.push(
    <Sequence key="intro-slate" from={offset} durationInFrames={SLATE_FRAMES}>
      <TitleSlate text="TALKIE · INTROS · V1" />
    </Sequence>
  );
  offset += SLATE_FRAMES + GAP_FRAMES;

  // Segments
  segments.forEach((seg, i) => {
    sequences.push(
      <Sequence key={`seg-${i}`} from={offset} durationInFrames={SEGMENT_FRAMES}>
        <SegmentWithLabel index={i} label={seg.label} Component={seg.Component} />
      </Sequence>
    );
    offset += SEGMENT_FRAMES + GAP_FRAMES;
  });

  // Outro slate
  sequences.push(
    <Sequence key="outro-slate" from={offset} durationInFrames={SLATE_FRAMES}>
      <TitleSlate text={`${segments.length} INTROS · 2026-05-15`} />
    </Sequence>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {sequences}
    </AbsoluteFill>
  );
};
