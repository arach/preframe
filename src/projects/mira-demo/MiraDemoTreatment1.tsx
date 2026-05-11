import React from 'react'
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion'

const SRC = 'http://localhost:18765/mira-control-lanes-demo.mp4'

const FPS = 30
// Source: 52.656667s at ~59.94fps, 1720×1410
// We end the video layer at 44s and hold endcard for 2s
const VIDEO_END_S  = 44
const VIDEO_END_F  = VIDEO_END_S * FPS           // 1320
const ENDCARD_F    = VIDEO_END_F + 60             // 1380 (2s endcard)
export const MIRA_DEMO_FRAMES = ENDCARD_F         // 1380 = 46s

interface CueProps {
  frameIn: number  // frame to start showing
  text: string
  holdFrames?: number
  fadeFrames?: number
}

const CUES: CueProps[] = [
  { frameIn: Math.round(6.44  * FPS), text: 'Mira resolves the search field via AX tree' },
  { frameIn: Math.round(12.50 * FPS), text: 'native keystroke · CDP owns the input' },
  { frameIn: Math.round(21.90 * FPS), text: 'authenticated session · real browser profile' },
  { frameIn: Math.round(34.35 * FPS), text: 'VLM-composed prompt · dramatized input' },
  { frameIn: Math.round(41.43 * FPS), text: 'trace + artifact emitted', holdFrames: 75 },
]

const LowerThird: React.FC<CueProps & { frame: number }> = ({
  frameIn,
  text,
  holdFrames = 60,
  fadeFrames = 10,
  frame,
}) => {
  const fadeIn  = interpolate(frame, [frameIn, frameIn + fadeFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(frame, [frameIn + holdFrames, frameIn + holdFrames + fadeFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const opacity = Math.min(fadeIn, fadeOut)

  if (opacity <= 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 52,
        opacity,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.58)',
          borderRadius: 6,
          padding: '7px 14px',
          fontFamily: '"Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 15,
          letterSpacing: '0.03em',
          color: 'rgba(255, 255, 255, 0.84)',
          lineHeight: 1,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {text}
      </div>
    </div>
  )
}

export const MiraDemoTreatment1: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  // Fade the video out over the last 18 frames before endcard
  const videoOpacity = interpolate(
    frame,
    [VIDEO_END_F - 18, VIDEO_END_F],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // Endcard fade in
  const endcardOpacity = interpolate(
    frame,
    [VIDEO_END_F, VIDEO_END_F + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.ease) }
  )

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>

      {/* Source video — scale-to-fit, letterboxed */}
      <div style={{ position: 'absolute', inset: 0, opacity: videoOpacity, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <OffthreadVideo
          src={SRC}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Lower-thirds */}
      {CUES.map((cue) => (
        <LowerThird key={cue.frameIn} {...cue} frame={frame} />
      ))}

      {/* Endcard */}
      {frame >= VIDEO_END_F && (
        <AbsoluteFill
          style={{
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: endcardOpacity,
          }}
        >
          <div
            style={{
              fontFamily: '"Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 22,
              letterSpacing: '0.18em',
              color: 'rgba(255, 255, 255, 0.88)',
              textTransform: 'lowercase',
            }}
          >
            action
          </div>
          <div
            style={{
              fontFamily: '"Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              letterSpacing: '0.12em',
              color: 'rgba(255, 255, 255, 0.38)',
              marginTop: 10,
            }}
          >
            action.app
          </div>
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  )
}
