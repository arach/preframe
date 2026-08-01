import React from 'react'
import {loadFont as loadCormorantGaramond} from '@remotion/google-fonts/CormorantGaramond'
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono'
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion'

export const BLINK_SPATIAL_FPS = 30

const SOURCE = 'demos/blink/blink-pi-surround-hotkey-demo-nocursor.mp4'
const SCORE = 'tracks/blink/blink-spatial-score.wav'
const TAP = 'sfx/tap.wav'

const OUTPUT_WIDTH = 1920
const CAPTURE_WIDTH = 1720
const CAPTURE_HEIGHT = 720
const CAPTURE_LEFT = (OUTPUT_WIDTH - CAPTURE_WIDTH) / 2
const CAPTURE_TOP = 156

const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif'
const MONO = '"SF Mono", "JetBrains Mono", Menlo, Monaco, monospace'
const SITE_DISPLAY = loadCormorantGaramond('normal', {
  weights: ['500', '600'],
  subsets: ['latin'],
}).fontFamily
const SITE_MONO = loadJetBrainsMono('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
}).fontFamily

type EditSegment = {
  label: string
  sourceStart: number
  sourceEnd: number
  rate: number
}

// Chronological source mapping. The only omitted interval after the opening run
// is 89.0–106.4s, where the two-note canvas remains visually unchanged.
export const BLINK_EDIT_SEGMENTS: readonly EditSegment[] = [
  { label: 'session wakes', sourceStart: 7.8, sourceEnd: 13.6, rate: 1.2 },
  { label: 'API reconnaissance', sourceStart: 13.6, sourceEnd: 43.5, rate: 4 },
  { label: 'first note command', sourceStart: 43.5, sourceEnd: 55.8, rate: 2.4 },
  { label: 'first note reveal', sourceStart: 55.8, sourceEnd: 60.2, rate: 1 },
  { label: 'move setup', sourceStart: 60.2, sourceEnd: 66.5, rate: 2.8 },
  { label: 'move payoff', sourceStart: 66.5, sourceEnd: 69.2, rate: 1 },
  { label: 'second note command', sourceStart: 69.2, sourceEnd: 77.9, rate: 2.3 },
  { label: 'second note reveal', sourceStart: 77.9, sourceEnd: 80.4, rate: 1 },
  { label: 'verify two notes', sourceStart: 80.4, sourceEnd: 89, rate: 3 },
  { label: 'hide and restore', sourceStart: 106.4, sourceEnd: 117.8, rate: 1 },
] as const

type PlacedSegment = EditSegment & {
  from: number
  durationInFrames: number
}

const placedSegments: readonly PlacedSegment[] = (() => {
  let cursor = 0
  return BLINK_EDIT_SEGMENTS.map((segment) => {
    const durationInFrames = Math.round(
      ((segment.sourceEnd - segment.sourceStart) / segment.rate) * BLINK_SPATIAL_FPS,
    )
    const placed = {...segment, from: cursor, durationInFrames}
    cursor += durationInFrames
    return placed
  })
})()

export const BLINK_SPATIAL_FRAMES = placedSegments.reduce(
  (total, segment) => total + segment.durationInFrames,
  0,
)

const seconds = (value: number) => Math.round(value * BLINK_SPATIAL_FPS)

const finalSegmentFrom = placedSegments[9].from
const OUTRO_FROM = BLINK_SPATIAL_FRAMES - seconds(2.53)
const hideChord = {
  from: finalSegmentFrom + seconds(1.48),
  to: finalSegmentFrom + seconds(5.18),
}
const restoreChord = {
  from: finalSegmentFrom + seconds(6.43),
  to: OUTRO_FROM + 6,
}

const chapters = [
  {
    from: 0,
    to: placedSegments[3].from,
    index: '01',
    verb: 'DRIVE',
    line: 'Pi learns the surface, then types the command.',
  },
  {
    from: placedSegments[3].from,
    to: placedSegments[6].from,
    index: '02',
    verb: 'PLACE',
    line: 'One launch brief. Positioned on the canvas.',
  },
  {
    from: placedSegments[6].from,
    to: placedSegments[9].from,
    index: '03',
    verb: 'SURROUND',
    line: 'A second note lands opposite.',
  },
  {
    from: placedSegments[9].from,
    to: BLINK_SPATIAL_FRAMES,
    index: '04',
    verb: 'RECALL',
    line: 'Hyper+B clears — and restores — the desk.',
  },
] as const

const segmentAt = (frame: number) =>
  placedSegments.find(
    (segment) => frame >= segment.from && frame < segment.from + segment.durationInFrames,
  ) ?? placedSegments[placedSegments.length - 1]

const fadeWindow = (frame: number, from: number, to: number) => {
  const fade = 10
  const fadeIn = interpolate(frame, [from, from + fade], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const fadeOut = interpolate(frame, [to - fade, to], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  })
  return Math.min(fadeIn, fadeOut)
}

const SegmentVideo: React.FC<{segment: PlacedSegment}> = ({segment}) => (
  <OffthreadVideo
    src={staticFile(SOURCE)}
    startFrom={Math.round(segment.sourceStart * BLINK_SPATIAL_FPS)}
    playbackRate={segment.rate}
    muted
    style={{
      width: CAPTURE_WIDTH,
      height: CAPTURE_HEIGHT,
      objectFit: 'contain',
    }}
  />
)

const VideoTimeline: React.FC = () => (
  <AbsoluteFill>
    {placedSegments.map((segment) => (
      <Sequence
        key={`${segment.sourceStart}-${segment.sourceEnd}`}
        name={segment.label}
        from={segment.from}
        durationInFrames={segment.durationInFrames}
      >
        <SegmentVideo segment={segment} />
      </Sequence>
    ))}
  </AbsoluteFill>
)

const ChapterRail: React.FC<{frame: number}> = ({frame}) => (
  <div
    style={{
      position: 'absolute',
      left: CAPTURE_LEFT,
      right: CAPTURE_LEFT,
      bottom: 54,
      height: 76,
      display: 'flex',
      alignItems: 'center',
      fontFamily: MONO,
    }}
  >
    {chapters.map((chapter) => {
      const opacity = fadeWindow(frame, chapter.from, chapter.to)
      return (
        <div
          key={chapter.index}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            opacity,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 15,
              minWidth: 250,
            }}
          >
            <span style={{color: 'rgba(152, 178, 174, 0.5)', fontSize: 12}}>
              {chapter.index}
            </span>
            <span
              style={{
                color: 'rgba(223, 231, 229, 0.92)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 2,
                lineHeight: '16px',
              }}
            >
              {chapter.verb}
            </span>
          </div>
          <div
            style={{
              width: 1,
              height: 24,
              background: 'rgba(153, 177, 174, 0.22)',
              marginRight: 25,
            }}
          />
          <span
            style={{
              color: 'rgba(213, 221, 219, 0.62)',
              fontFamily: SANS,
              fontSize: 16,
              letterSpacing: 0,
              lineHeight: '22px',
            }}
          >
            {chapter.line}
          </span>
        </div>
      )
    })}
  </div>
)

const KeyChord: React.FC<{
  frame: number
  from: number
  to: number
  label: string
}> = ({frame, from, to, label}) => {
  const opacity = fadeWindow(frame, from, to)

  if (opacity <= 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: 810,
        top: 430,
        width: 330,
        height: 100,
        borderRadius: 14,
        background: 'rgba(11, 14, 15, 0.94)',
        border: '1px solid rgba(209, 222, 218, 0.17)',
        boxShadow: '0 22px 70px rgba(0, 0, 0, 0.44)',
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          color: '#edf2f0',
          fontFamily: MONO,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 1,
          lineHeight: '18px',
        }}
      >
        <span
          style={{
            border: '1px solid rgba(223, 235, 231, 0.23)',
            borderBottomColor: 'rgba(223, 235, 231, 0.42)',
            borderRadius: 7,
            padding: '6px 10px 7px',
            background: 'rgba(229, 239, 236, 0.06)',
          }}
        >
          HYPER
        </span>
        <span style={{color: 'rgba(223, 235, 231, 0.42)'}}>+</span>
        <span
          style={{
            border: '1px solid rgba(223, 235, 231, 0.23)',
            borderBottomColor: 'rgba(223, 235, 231, 0.42)',
            borderRadius: 7,
            padding: '6px 11px 7px',
            background: 'rgba(229, 239, 236, 0.06)',
          }}
        >
          B
        </span>
      </div>
      <div
        style={{
          color: 'rgba(196, 211, 207, 0.52)',
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: 2,
          lineHeight: '12px',
        }}
      >
        {label}
      </div>
    </div>
  )
}

const SoundDesign: React.FC = () => {
  const cues = [
    placedSegments[3].from,
    placedSegments[5].from,
    placedSegments[7].from,
    hideChord.from,
    restoreChord.from,
  ]

  return (
    <>
      <Audio src={staticFile(SCORE)} volume={0.84} />
      <Sequence from={0} durationInFrames={placedSegments[3].from}>
        <Audio src={staticFile('sfx/creamy_typing.wav')} volume={0.028} loop />
      </Sequence>
      {cues.map((from) => (
        <Sequence key={from} from={from} durationInFrames={8}>
          <Audio src={staticFile(TAP)} volume={0.38} />
        </Sequence>
      ))}
    </>
  )
}

const BlinkMark: React.FC<{size?: number}> = ({size = 28}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="2.5"
      y="2.5"
      width="13"
      height="13"
      rx="3.1"
      stroke="currentColor"
      strokeWidth="1"
    />
    <rect x="5.75" y="5.75" width="3.25" height="3.25" fill="currentColor" />
    <rect x="9" y="9" width="3.25" height="3.25" fill="currentColor" />
  </svg>
)

const outroSpecs = [
  ['HOTKEYS', 'carbon'],
  ['RUNTIME', 'native'],
  ['FORMAT', '.md'],
  ['CLOUD', 'none'],
] as const

const Outro: React.FC<{frame: number}> = ({frame}) => {
  if (frame < OUTRO_FROM) return null

  const reveal = interpolate(
    frame,
    [OUTRO_FROM, OUTRO_FROM + 18],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.exp),
    },
  )
  const edgeInset = Math.round((1 - reveal) * (OUTPUT_WIDTH / 2))
  const brandOpacity = interpolate(
    frame,
    [OUTRO_FROM + 8, OUTRO_FROM + 24],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  )
  const detailOpacity = interpolate(
    frame,
    [OUTRO_FROM + 18, OUTRO_FROM + 34],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  )
  const seamOpacity = Math.sin(reveal * Math.PI) * 0.34

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          backgroundColor: '#efe8d8',
          backgroundImage:
            'radial-gradient(56% 72% at 84% 24%, rgba(47, 100, 71, 0.13), transparent 72%), radial-gradient(62% 52% at 12% 0%, rgba(255, 249, 228, 0.9), transparent 72%), linear-gradient(180deg, rgba(255, 250, 235, 0.34), transparent 72%)',
          clipPath: `inset(0 ${edgeInset}px 0 ${edgeInset}px)`,
        }}
      >
        <AbsoluteFill
          style={{
            backgroundImage:
              'linear-gradient(rgba(70, 58, 35, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(70, 58, 35, 0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <AbsoluteFill
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(70, 51, 27, 0.46) 0 0.55px, transparent 0.75px), radial-gradient(circle, rgba(47, 100, 71, 0.34) 0 0.5px, transparent 0.72px)',
            backgroundPosition: '0 0, 2px 2px',
            backgroundSize: '4px 4px',
            mixBlendMode: 'multiply',
            opacity: 0.14,
            WebkitMaskImage:
              'radial-gradient(ellipse 66% 90% at 84% 48%, #000 0 48%, rgba(0, 0, 0, 0.68) 65%, transparent 88%)',
            maskImage:
              'radial-gradient(ellipse 66% 90% at 84% 48%, #000 0 48%, rgba(0, 0, 0, 0.68) 65%, transparent 88%)',
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: edgeInset,
          width: 1,
          background: `rgba(47, 100, 71, ${seamOpacity})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: edgeInset,
          width: 1,
          background: `rgba(47, 100, 71, ${seamOpacity})`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 72,
          borderBottom: '1px solid #d1c5ae',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 220px',
          color: '#181711',
          opacity: detailOpacity,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{display: 'flex', color: '#2f6447'}}>
            <BlinkMark size={22} />
          </span>
          <span
            style={{
              fontFamily: SITE_DISPLAY,
              fontSize: 27,
              fontWeight: 600,
              letterSpacing: '-0.4px',
              lineHeight: '30px',
            }}
          >
            blink
          </span>
        </div>
        <div
          style={{
            color: '#4d493c',
            fontFamily: SITE_MONO,
            fontSize: 11,
            letterSpacing: 0,
            lineHeight: '16px',
          }}
        >
          spatial notes · macOS
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 210,
          left: 0,
          right: 0,
          height: 540,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: brandOpacity,
        }}
      >
        <div
          style={{
            color: '#181711',
            fontFamily: SITE_DISPLAY,
            fontSize: 122,
            fontWeight: 600,
            letterSpacing: '-3px',
            lineHeight: '108px',
          }}
        >
          blink
        </div>
        <div
          style={{
            marginTop: 20,
            color: '#181711',
            fontFamily: SITE_DISPLAY,
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: '-0.5px',
            lineHeight: '48px',
          }}
        >
          spatial notes for your Mac
        </div>
        <div
          style={{
            marginTop: 36,
            minWidth: 208,
            height: 48,
            borderRadius: 6,
            background: '#2f6447',
            color: '#fbf6e9',
            fontFamily: SITE_MONO,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0,
            lineHeight: '48px',
            textAlign: 'center',
            opacity: detailOpacity,
          }}
        >
          blink.arach.dev ↗
        </div>
        <div
          style={{
            marginTop: 18,
            color: '#6d6452',
            fontFamily: SITE_MONO,
            fontSize: 10,
            fontWeight: 400,
            lineHeight: '14px',
            opacity: detailOpacity,
          }}
        >
          free &amp; open source · macOS 14+ · Apple Silicon
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 220,
          right: 220,
          bottom: 74,
          height: 136,
          borderTop: '1px solid #d1c5ae',
          borderBottom: '1px solid #d1c5ae',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          opacity: detailOpacity,
        }}
      >
        {outroSpecs.map(([label, value], index) => (
          <div
            key={label}
            style={{
              borderLeft: index === 0 ? 'none' : '1px solid #d1c5ae',
              padding: '28px 34px',
              fontFamily: SITE_MONO,
            }}
          >
            <div
              style={{
                color: '#6d6452',
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: 1.6,
                lineHeight: '12px',
              }}
            >
              {label}
            </div>
            <div
              style={{
                marginTop: 12,
                color: index === 3 ? '#2f6447' : '#181711',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-0.2px',
                lineHeight: '22px',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

export const BlinkSpatialDemo: React.FC = () => {
  const frame = useCurrentFrame()
  const activeSegment = segmentAt(frame)

  const progressWidth = Math.round(
    ((frame + 1) / BLINK_SPATIAL_FRAMES) * CAPTURE_WIDTH,
  )
  const rateLabel = activeSegment.rate === 1 ? 'REAL TIME' : `${activeSegment.rate.toFixed(1)}×`

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse at 50% 42%, rgba(28, 41, 39, 0.42) 0%, rgba(8, 11, 12, 0.92) 48%, #050708 100%)',
        color: '#edf2f0',
        overflow: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'geometricPrecision',
      }}
    >
      <SoundDesign />

      <div
        style={{
          position: 'absolute',
          top: 64,
          left: CAPTURE_LEFT,
          right: CAPTURE_LEFT,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-0.5px',
              lineHeight: '30px',
            }}
          >
            Blink
          </span>
          <span
            style={{
              color: 'rgba(194, 208, 204, 0.44)',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: 1,
              lineHeight: '16px',
            }}
          >
            PI → CLI → SPATIAL DESK
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            color: 'rgba(194, 208, 204, 0.46)',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 1,
            lineHeight: '14px',
          }}
        >
          <span>160 × 60 ITERM2</span>
          <span style={{color: 'rgba(164, 196, 190, 0.7)'}}>{rateLabel}</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: CAPTURE_LEFT,
          top: CAPTURE_TOP,
          width: CAPTURE_WIDTH,
          height: CAPTURE_HEIGHT,
          overflow: 'hidden',
          borderRadius: 16,
          background: '#050707',
          boxShadow: '0 38px 110px rgba(0, 0, 0, 0.52)',
        }}
      >
        <VideoTimeline />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.025)',
          }}
        />
      </div>

      <KeyChord
        frame={frame}
        from={hideChord.from}
        to={hideChord.to}
        label="HIDE SPATIAL NOTES"
      />
      <KeyChord
        frame={frame}
        from={restoreChord.from}
        to={restoreChord.to}
        label="RESTORE SPATIAL NOTES"
      />

      <ChapterRail frame={frame} />

      <div
        style={{
          position: 'absolute',
          left: CAPTURE_LEFT,
          right: CAPTURE_LEFT,
          bottom: 40,
          height: 1,
          background: 'rgba(174, 193, 188, 0.13)',
        }}
      >
        <div
          style={{
            width: progressWidth,
            height: '100%',
            background: 'rgba(151, 190, 182, 0.72)',
          }}
        />
      </div>

      <Outro frame={frame} />
    </AbsoluteFill>
  )
}
