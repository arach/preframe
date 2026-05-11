import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion'

export interface ChapterSlateProps {
  chapter: number
  title: string
  subtitle?: string
  accentColor?: string
  bgColor?: string
}

export const ChapterSlate: React.FC<ChapterSlateProps> = ({
  chapter,
  title,
  subtitle,
  accentColor = '#4ade80',
  bgColor = '#0a0a0e',
}) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

  // Overall fade in/out
  const fadeIn = interpolate(frame, [0, 0.4 * fps], [0, 1], clamp)
  const fadeOut = interpolate(frame, [durationInFrames - 0.5 * fps, durationInFrames], [1, 0], clamp)
  const masterOpacity = fadeIn * fadeOut

  // Chapter number counts up
  const countedRaw = interpolate(
    frame,
    [0.3 * fps, 1.0 * fps],
    [0, chapter],
    { ...clamp, easing: Easing.out(Easing.cubic) },
  )
  const countedChapter = Math.round(countedRaw)

  // Rule draws from left
  const ruleScale = interpolate(frame, [0.8 * fps, 1.4 * fps], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  })

  // Title slides up + fades in
  const titleProgress = interpolate(frame, [1.2 * fps, 1.8 * fps], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  })
  const titleY = (1 - titleProgress) * 18

  // Subtitle fades in
  const subtitleOpacity = subtitle
    ? interpolate(frame, [1.8 * fps, 2.2 * fps], [0, 1], clamp)
    : 0

  const chapterLabel = String(countedChapter).padStart(2, '0')

  return (
    <AbsoluteFill style={{ background: bgColor }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: '8vw',
          paddingRight: '8vw',
          opacity: masterOpacity,
        }}
      >
        {/* Chapter number */}
        <div
          style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontWeight: 700,
            fontSize: 'clamp(80px, 18vw, 320px)',
            color: 'rgba(255,255,255,0.06)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            userSelect: 'none',
            marginBottom: '0.04em',
          }}
        >
          {chapterLabel}
        </div>

        {/* Thin accent rule */}
        <div
          style={{
            height: 1.5,
            background: accentColor,
            transformOrigin: 'left center',
            transform: `scaleX(${ruleScale})`,
            boxShadow: `0 0 10px ${accentColor}55`,
            marginBottom: 28,
          }}
        />

        {/* Title */}
        <div
          style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontWeight: 400,
            fontSize: 'clamp(18px, 3.2vw, 58px)',
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
            marginBottom: subtitle ? 12 : 0,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontWeight: 400,
              fontSize: 'clamp(11px, 1.4vw, 22px)',
              color: 'rgba(255,255,255,0.30)',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              opacity: subtitleOpacity,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}
