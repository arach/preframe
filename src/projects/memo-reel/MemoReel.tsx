/**
 * MemoReel — the agentic-routine treatment, on the Preframe Kit.
 *
 * Architecture:
 *   - Opener: a single PromptCard that types the planner's narrative arc
 *     once, then holds. Replaces the old centered slate.
 *   - Body: MonitorFrame wraps the rotating video clips, so the bezel
 *     persists across cuts. A TacticalFrame chrome overlay and a
 *     persistent CaptionTrack (one CaptionCard per role-group) live at
 *     body level so they only fade once at the body boundary.
 *   - Outro: a slim closing PromptCard with the tagline.
 *
 * All kit primitives obey the calm contract: no scanlines, no blinking
 * indicators, no per-cut chrome lifecycle.
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  BG,
  CaptionCard,
  CREAM,
  DISPLAY,
  HUD,
  HUD_DIM,
  MonitorFrame,
  PromptCard,
  SceneLabel,
  TacticalFrame,
  TerminalCard,
  TRACKING,
  TYPE,
} from '../../kit';

export interface MemoReelSegment {
  srcStart: number;
  durationFrames: number;
  label?: string;
  role?: 'hook' | 'setup' | 'development' | 'payoff' | 'close';
  description?: string | null;
}

export interface MemoReelProps extends Record<string, unknown> {
  source: string;
  segments: MemoReelSegment[];
  beatTrack?: string;
  slateTitle: string;
  slateSubtitle: string;
  outroTagline: string;
  outroDate?: string;
  preSlateFrames: number;
  postSlateFrames: number;
}

export const memoReelDefaultProps: MemoReelProps = {
  source: 'inbox/scout-2026-05-22.mp4',
  segments: [],
  beatTrack: 'tracks/japan-trap.mp3',
  slateTitle: 'SCOUT',
  slateSubtitle: 'Memo Reel · 2026-05-22',
  outroTagline: 'preframe',
  outroDate: 'memo reel · 30s',
  preSlateFrames: 75, // slightly longer for the prompt-card type-out
  postSlateFrames: 90,
};

export function memoReelTotalFrames(props: MemoReelProps): number {
  const body = props.segments.reduce((acc, s) => acc + s.durationFrames, 0);
  return props.preSlateFrames + body + props.postSlateFrames;
}

// ── Caption / scene-label grouping ──────────────────────────────

interface ActGroup {
  from: number; // frame within body
  durationFrames: number;
  role?: MemoReelSegment['role'];
  description: string | null;
  label: string; // uppercase role label, e.g., "HOOK"
}

const ROLE_LABEL: Record<NonNullable<MemoReelSegment['role']>, string> = {
  hook: 'HOOK',
  setup: 'SETUP',
  development: 'DEVELOPMENT',
  payoff: 'PAYOFF',
  close: 'CLOSE',
};

function groupActs(
  segments: Array<MemoReelSegment & { from: number; index: number }>,
): ActGroup[] {
  const groups: Array<ActGroup & { _bestDur: number }> = [];
  for (const seg of segments) {
    const desc = (seg.description ?? '').trim() || null;
    const last = groups[groups.length - 1];
    if (last && last.role === seg.role) {
      last.durationFrames += seg.durationFrames;
      if (desc && seg.durationFrames > last._bestDur) {
        last.description = desc;
        last._bestDur = seg.durationFrames;
      }
    } else {
      groups.push({
        from: seg.from,
        durationFrames: seg.durationFrames,
        role: seg.role,
        description: desc,
        label: seg.role ? ROLE_LABEL[seg.role] : 'SCENE',
        _bestDur: seg.durationFrames,
      });
    }
  }
  return groups.map(({ _bestDur, ...rest }) => rest);
}

// ── Caption track ───────────────────────────────────────────────

function CaptionTrack({
  groups,
  bodyFrames,
}: {
  groups: ActGroup[];
  bodyFrames: number;
}) {
  const frame = useCurrentFrame();
  // 12-frame cross-fade between consecutive cards.
  const CROSSFADE = 12;

  const trackOpacity = interpolate(
    frame,
    [0, 18, bodyFrames - 14, bodyFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 96,
        display: 'flex',
        justifyContent: 'center',
        opacity: trackOpacity,
        pointerEvents: 'none',
      }}
    >
      {groups.map((g, i) => {
        if (!g.description) return null;
        const start = g.from;
        const end = g.from + g.durationFrames;
        const opacity = interpolate(
          frame,
          [start - CROSSFADE, start, end - CROSSFADE, end],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );
        if (opacity <= 0.001) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              opacity,
            }}
          >
            <CaptionCard role={g.role} label={g.label} text={g.description} />
          </div>
        );
      })}
    </div>
  );
}

// ── Active scene label (bottom-left, body-level) ───────────────

function ActiveSceneLabel({
  groups,
  bodyFrames,
}: {
  groups: ActGroup[];
  bodyFrames: number;
}) {
  const frame = useCurrentFrame();
  const CROSSFADE = 12;

  const trackOpacity = interpolate(
    frame,
    [0, 18, bodyFrames - 14, bodyFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );

  // Body-level progress drives the bar.
  const progress = Math.max(0, Math.min(1, frame / bodyFrames));
  const actIndex = Math.max(
    0,
    groups.findIndex((g) => frame < g.from + g.durationFrames),
  );

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: trackOpacity, pointerEvents: 'none' }}>
      {groups.map((g, i) => {
        const start = g.from;
        const end = g.from + g.durationFrames;
        const opacity = interpolate(
          frame,
          [start - CROSSFADE, start, end - CROSSFADE, end],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );
        if (opacity <= 0.001) return null;
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, opacity }}>
            <SceneLabel
              placement="left"
              label={g.label}
              sublabel={`act ${i + 1} / ${groups.length}`}
              progress={progress}
              bottom={56}
              left={56}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Outro card (slim closing PromptCard variant) ────────────────

function OutroCard({ tagline, subline }: { tagline: string; subline?: string }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacity = fadeIn * fadeOut;

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ opacity }}>
        <TerminalCard
          statusColor="#7c9eb2"
          statusLabel="reel complete"
          path={subline}
          width={620}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              color: CREAM,
              fontSize: TYPE.outroTitle,
              fontWeight: 400,
              letterSpacing: TRACKING.uppercaseLoose,
              paddingLeft: TRACKING.uppercaseLoose,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {tagline}
          </div>
        </TerminalCard>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
}

// ── Body ────────────────────────────────────────────────────────

function MemoReelBody({
  source,
  segments,
  slateTitle,
  slateSubtitle,
}: {
  source: string;
  segments: Array<MemoReelSegment & { from: number; index: number }>;
  slateTitle: string;
  slateSubtitle: string;
}) {
  const { fps, width, height } = useVideoConfig();
  const totalFrames = segments.reduce((acc, s) => acc + s.durationFrames, 0);
  const acts = groupActs(segments);

  // Source video specs for the TacticalFrame top-right stats. The source
  // duration / resolution isn't strictly known here — show comp specs.
  const stats = [`${width}×${height}`, `${fps}fps`, 'preframe'];
  const versionTag = `memo reel · ${slateSubtitle.toLowerCase()}`;

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Hardware bezel persists across cuts because it wraps the whole body. */}
      <MonitorFrame
        bezelColor="#1d1d23"
        bezelWidth={12}
        bezelRadius={14}
        showStand={false}
        showScreenGlow={true}
        glowColor="rgba(140, 175, 200, 0.10)"
        powerOnEffect={false}
        wordmark={slateTitle}
        wordmarkColor="rgba(255, 255, 255, 0.32)"
        monitorWidthPct={92}
        monitorHeightPct={78}
        monitorTopPct={8}
        chinHeight={28}
      >
        <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
          {segments.map((seg) => (
            <Sequence
              key={`seg-${seg.index}`}
              from={seg.from - segments[0].from}
              durationInFrames={seg.durationFrames}
              name={`Cut-${String(seg.index + 1).padStart(2, '0')}`}
            >
              <OffthreadVideo
                src={staticFile(source)}
                startFrom={Math.round(seg.srcStart * 30)}
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  // Punch up contrast / saturation a touch so the UI inside
                  // reads cleanly through the bezel + tactical chrome.
                  filter: 'contrast(1.10) saturate(1.08) brightness(1.04)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  boxShadow: 'inset 0 0 70px rgba(0,0,0,0.42)',
                  pointerEvents: 'none',
                }}
              />
            </Sequence>
          ))}
        </div>
      </MonitorFrame>

      {/* Tactical chrome — body-level fade, lives across all cuts. */}
      <TacticalFrame
        totalFrames={totalFrames}
        title={slateTitle}
        subtitle={slateSubtitle}
        stats={stats}
        versionTag={versionTag}
        guideMargin={24}
      />

      {/* Bottom-left act label with body-progress bar. */}
      <ActiveSceneLabel groups={acts} bodyFrames={totalFrames} />

      {/* Bottom-center narrative card — one per act, cross-fades on change. */}
      <CaptionTrack groups={acts} bodyFrames={totalFrames} />
    </AbsoluteFill>
  );
}

// ── Composition ─────────────────────────────────────────────────

export const MemoReel: React.FC<MemoReelProps> = (props) => {
  const {
    source,
    segments,
    beatTrack,
    slateTitle,
    slateSubtitle,
    outroTagline,
    outroDate,
    preSlateFrames,
    postSlateFrames,
  } = props;
  const { durationInFrames, fps } = useVideoConfig();

  const bodyFrames = segments.reduce((acc, s) => acc + s.durationFrames, 0);

  let cursor = preSlateFrames;
  const placed = segments.map((seg, i) => {
    const from = cursor;
    cursor += seg.durationFrames;
    return { ...seg, from, index: i };
  });

  // Build the opening directive from segment roles.
  const acts = (() => {
    const counts = new Map<string, number>();
    for (const s of segments) {
      const k = s.role ?? 'scene';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.keys());
  })();
  const promptText =
    segments.length > 0
      ? `${(bodyFrames / fps).toFixed(0)}-second walkthrough of ${slateTitle.toLowerCase()} — ${acts.join(' → ')}.`
      : `${slateTitle} memo reel.`;

  return (
    <AbsoluteFill style={{ background: BG }}>
      {beatTrack && (
        <Audio
          src={staticFile(beatTrack)}
          volume={(f) => {
            const fadeIn = interpolate(f, [0, 14], [0, 0.78], {
              extrapolateRight: 'clamp',
            });
            const fadeOut = interpolate(
              f,
              [durationInFrames - fps * 1.4, durationInFrames],
              [0.78, 0],
              { extrapolateLeft: 'clamp' },
            );
            // Duck during body so any future voice / SFX cuts through.
            const contentStart = preSlateFrames;
            const contentEnd = preSlateFrames + bodyFrames;
            const base = Math.min(fadeIn, fadeOut);
            if (f >= contentStart && f < contentEnd) return base * 0.55;
            return base;
          }}
        />
      )}

      <Sequence from={0} durationInFrames={preSlateFrames} name="Slate-In">
        <PromptCard
          statusLabel="memo reel"
          path={`${slateTitle} / ${slateSubtitle.toUpperCase()}`}
          text={promptText}
          tagline="preframe · memo"
          typeStart={14}
          typeFrames={Math.max(40, preSlateFrames - 28)}
        />
      </Sequence>

      <Sequence from={preSlateFrames} durationInFrames={bodyFrames} name="Body">
        <MemoReelBody
          source={source}
          segments={placed}
          slateTitle={slateTitle}
          slateSubtitle={slateSubtitle}
        />
      </Sequence>

      <Sequence
        from={preSlateFrames + bodyFrames}
        durationInFrames={postSlateFrames}
        name="Slate-Out"
      >
        <OutroCard tagline={outroTagline} subline={outroDate} />
      </Sequence>
    </AbsoluteFill>
  );
};
