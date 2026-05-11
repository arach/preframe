import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion'

export interface MetricPopProps {
  value: number
  label: string
  prefix?: string
  suffix?: string
  accentColor?: string
  countUpDuration?: number
  holdDuration?: number
  fadeInDuration?: number
}

export const MetricPop: React.FC<MetricPopProps> = ({
  value,
  label,
  prefix = '',
  suffix = '',
  accentColor = '#4ade80',
  countUpDuration = 1.8,
  fadeInDuration = 0.3,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const fadeIn = interpolate(frame, [0, fadeInDuration * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const countStart = fadeInDuration * fps
  const countEnd = countStart + countUpDuration * fps

  const counted = interpolate(frame, [countStart, countEnd], [0, value], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const displayed = Math.round(counted)

  // Subtle scale pulse once count completes
  const pulseProgress = spring({
    frame: Math.max(0, frame - countEnd),
    fps,
    config: { damping: 8, stiffness: 180, mass: 0.6 },
  })
  // 1 → 1.03 → 1
  const scale = 1 + 0.03 * pulseProgress * Math.exp(-pulseProgress * 1.5)

  // Rule draws in from left when count begins
  const ruleScale = interpolate(frame, [countStart, countStart + 0.4 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${scale})`,
        }}
      >
        {/* Number */}
        <div
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(64px, 12vw, 200px)',
            color: '#ffffff',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            textShadow: `0 0 60px rgba(255,255,255,0.12)`,
          }}
        >
          {prefix}{displayed.toLocaleString()}{suffix}
        </div>

        {/* Rule */}
        <div
          style={{
            width: 48,
            height: 1.5,
            background: accentColor,
            marginTop: 20,
            marginBottom: 16,
            transformOrigin: 'left center',
            transform: `scaleX(${ruleScale})`,
            boxShadow: `0 0 8px ${accentColor}`,
          }}
        />

        {/* Label */}
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 'clamp(11px, 1.4vw, 22px)',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  )
}
