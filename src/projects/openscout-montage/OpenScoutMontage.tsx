import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion'
import {
  Format,
  getPlacedEdit,
  lerpLayout,
  LensRect,
  MONO,
  MontageEdit,
  PALETTE,
  PlacedCut,
  PlacedEdit,
  SANS,
  SOURCE_ASPECT,
  SOURCE_HEIGHT,
  SOURCE_WIDTH,
  SOURCES,
} from './edit'

/** Guards the score so a visual-only render never fails on a missing asset. */
export const SCORE_ENABLED = true

// Both masters carry their own composed head and tail, so these are safety
// ramps only — long enough to guarantee a clean start and finish, short enough
// to leave the musical ending intact.
const SCORE_FADE_IN = 8
const SCORE_FADE_OUT = 18

const EASE_SETTLE = Easing.bezier(0.16, 0.52, 0.26, 1)

export const clampInterpolate = (
  frame: number,
  input: readonly [number, number],
  output: readonly [number, number],
  easing = EASE_SETTLE,
) =>
  interpolate(frame, input as unknown as number[], output as unknown as number[], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  })

/** Symmetric fade envelope: 0 outside [from,to], 1 in the middle. */
export const envelope = (frame: number, from: number, to: number, ramp: number) => {
  const up = clampInterpolate(frame, [from, from + ramp], [0, 1])
  const down = clampInterpolate(frame, [to - ramp, to], [1, 0])
  return Math.min(up, down)
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** Blends two `#rrggbb` strings. Used only for the stage tone travel. */
const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  const out = pa.map((v, i) => Math.round(mix(v, pb[i], t)))
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`
}

// ---------------------------------------------------------------------------
// Marks
// ---------------------------------------------------------------------------

/**
 * The canonical OpenScout wire mark, inlined from
 * `public/brand/openscout-wire-mark.svg` (itself a byte-identical copy of the
 * iOS app's `ScoutWireMark.imageset/scout-wire-mark.svg`).
 *
 * Geometry and colour are the source artwork's, not an approximation: a
 * 224×236 viewBox — taller than it is wide, so `size` drives the height and the
 * width follows — rounded quadratic corner joins, 24-unit stroke, and a filled
 * inner hexagon rather than a dot. Colour defaults to the artwork's off-white.
 */
export const WireMark: React.FC<{size: number; color?: string; opacity?: number}> = ({
  size,
  color = PALETTE.mark,
  opacity = 1,
}) => (
  <svg
    width={size * (224 / 236)}
    height={size}
    viewBox="0 0 224 236"
    style={{display: 'block', overflow: 'visible', opacity}}
  >
    <path
      d="M103.01 13.21 Q112 8 120.99 13.21 L198.01 57.79 Q207 63 207 73.39 L207 162.61 Q207 173 198.01 178.21 L120.99 222.79 Q112 228 103.01 222.79 L25.99 178.21 Q17 173 17 162.61 L17 73.39 Q17 63 25.99 57.79 Z"
      fill="none"
      stroke={color}
      strokeWidth={24}
      strokeLinejoin="round"
    />
    <path d="M112 70 154 94v48l-42 24-42-24V94Z" fill={color} />
  </svg>
)

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const Stage: React.FC<{
  /** Only the frame size is read, so any sized format satisfies this. */
  format: {width: number; height: number}
  frame: number
  deviceCx: number
  deviceCy: number
  deviceW: number
  deviceH: number
  deviceFade: number
  tone: number
}> = ({format, frame, deviceCx, deviceCy, deviceW, deviceH, deviceFade, tone}) => {
  const {width: W, height: H} = format
  const drift = frame * 0.16
  const grid = Math.round(Math.min(W, H) / 22)

  // The stage travels with the product's own mode: near-black under dark
  // footage, graphite under light footage. It never goes white — the brand's
  // air is cold and the phone has to stay the brightest object on screen.
  const bg = mixHex(PALETTE.stage, PALETTE.stageLift, tone)
  const keyAlpha = mix(0.34, 0.3, tone)
  const keyMid = mix(0.16, 0.17, tone)
  const gridAlpha = mix(0.05, 0.075, tone)

  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      {/* Key pool behind the device */}
      <div
        style={{
          position: 'absolute',
          left: deviceCx - deviceW * 1.9,
          top: deviceCy - deviceH * 0.95,
          width: deviceW * 3.8,
          height: deviceH * 1.9,
          opacity: deviceFade,
          background: `radial-gradient(closest-side, rgba(${mix(86, 132, tone).toFixed(0)},${mix(
            132,
            166,
            tone,
          ).toFixed(0)},${mix(146, 178, tone).toFixed(0)},${keyAlpha}) 0%, rgba(46,72,86,${keyMid}) 42%, rgba(6,7,10,0) 100%)`,
        }}
      />
      {/* Warm counter-light, low and off-axis */}
      <div
        style={{
          position: 'absolute',
          left: -W * 0.12,
          top: H * 0.52,
          width: W * 0.9,
          height: H * 0.7,
          background:
            'radial-gradient(closest-side, rgba(150,104,64,0.16) 0%, rgba(150,104,64,0.05) 46%, rgba(6,7,10,0) 100%)',
        }}
      />

      {/* Routing grid — a hairline lattice, drifting slowly */}
      <div
        style={{
          position: 'absolute',
          inset: -grid * 2,
          backgroundImage: `linear-gradient(rgba(226,240,244,${gridAlpha}) 1px, transparent 1px), linear-gradient(90deg, rgba(226,240,244,${gridAlpha}) 1px, transparent 1px)`,
          backgroundSize: `${grid}px ${grid}px, ${grid}px ${grid}px`,
          backgroundPosition: `${-drift}px ${drift * 0.42}px`,
          maskImage:
            'radial-gradient(120% 88% at 50% 46%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.34) 52%, rgba(0,0,0,0) 82%)',
          WebkitMaskImage:
            'radial-gradient(120% 88% at 50% 46%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.34) 52%, rgba(0,0,0,0) 82%)',
        }}
      />

      {/* Signal motif — packets finding a route, kept almost subliminal */}
      <svg
        width={W}
        height={H}
        style={{position: 'absolute', inset: 0, opacity: 0.5}}
        viewBox={`0 0 ${W} ${H}`}
      >
        {[0.17, 0.38, 0.63, 0.85].map((y, i) => {
          const yy = H * y
          const period = 260 + i * 70
          const offset = (frame * (1.5 + i * 0.45)) % period
          return (
            <g key={y}>
              <line x1={0} y1={yy} x2={W} y2={yy} stroke="rgba(226,240,244,0.055)" strokeWidth={1} />
              <line
                x1={0}
                y1={yy}
                x2={W}
                y2={yy}
                stroke={PALETTE.mint}
                strokeWidth={1.2}
                strokeOpacity={0.16}
                strokeDasharray={`${46} ${period - 46}`}
                strokeDashoffset={-offset}
              />
            </g>
          )
        })}
      </svg>

      {/* Floor pool under the device */}
      <div
        style={{
          position: 'absolute',
          left: deviceCx - deviceW * 1.35,
          top: deviceCy + deviceH * 0.4,
          width: deviceW * 2.7,
          height: deviceH * 0.34,
          opacity: deviceFade,
          background: `radial-gradient(closest-side, rgba(0,0,0,${mix(0.78, 0.6, tone)}) 0%, rgba(0,0,0,${mix(
            0.34,
            0.26,
            tone,
          )}) 48%, rgba(0,0,0,0) 100%)`,
        }}
      />
    </AbsoluteFill>
  )
}

export const Vignette: React.FC<{tone: number}> = ({tone}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(128% 96% at 50% 44%, rgba(0,0,0,0) 42%, rgba(0,0,0,${mix(
        0.34,
        0.26,
        tone,
      )}) 78%, rgba(0,0,0,${mix(0.62, 0.48, tone)}) 100%)`,
    }}
  />
)

// ---------------------------------------------------------------------------
// Capture playback
// ---------------------------------------------------------------------------

const screenStyle = (w: number, h: number): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: w,
  height: h,
  objectFit: 'fill',
})

export const CutVideo: React.FC<{cut: PlacedCut; w: number; h: number}> = ({cut, w, h}) => {
  const src = staticFile(SOURCES[cut.source])
  if (cut.kind === 'hold') {
    return (
      <Freeze frame={0}>
        <OffthreadVideo
          src={src}
          startFrom={Math.round(cut.holdAt * 30)}
          muted
          style={screenStyle(w, h)}
        />
      </Freeze>
    )
  }
  return (
    <OffthreadVideo
      src={src}
      startFrom={Math.round(cut.sourceStart * 30)}
      playbackRate={cut.rate}
      muted
      style={screenStyle(w, h)}
    />
  )
}

/** A/B dissolve stack: every cut keeps playing beneath whatever fades in. */
export const CaptureStack: React.FC<{placed: PlacedEdit; w: number; h: number}> = ({placed, w, h}) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      {placed.cuts.map((cut, i) => {
        const start = cut.from
        const end = cut.from + cut.durationInFrames + cut.tail
        const opacity = cut.fadeIn
          ? clampInterpolate(frame, [start, start + cut.fadeIn], [0, 1], Easing.inOut(Easing.quad))
          : 1
        return (
          <Sequence
            key={`${i}-${cut.note}`}
            name={cut.note}
            from={start}
            durationInFrames={Math.max(1, end - start)}
            layout="none"
          >
            <AbsoluteFill style={{opacity}}>
              <CutVideo cut={cut} w={w} h={h} />
            </AbsoluteFill>
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}

// ---------------------------------------------------------------------------
// Device
// ---------------------------------------------------------------------------

export const PhoneShell: React.FC<{
  screenW: number
  screenH: number
  frame: number
  children: React.ReactNode
}> = ({screenW, screenH, frame, children}) => {
  const bezel = Math.max(3, screenH * 0.0138)
  const screenR = screenH * 0.0585
  const outerR = screenR + bezel
  // Static. The specular pass used to travel across the glass with the frame;
  // with the phone locked, a crawling highlight is exactly the decorative motion
  // the operator asked to remove, so the sheen is fixed at a flattering angle.
  const sheen = 0

  return (
    <div
      style={{
        position: 'relative',
        width: screenW + bezel * 2,
        height: screenH + bezel * 2,
        borderRadius: outerR,
        padding: bezel,
        boxSizing: 'border-box',
        background:
          'linear-gradient(148deg, #565D66 0%, #262B31 16%, #14171B 40%, #0F1216 58%, #333A42 82%, #171B20 100%)',
        boxShadow: `0 ${screenH * 0.055}px ${screenH * 0.14}px rgba(0,0,0,0.68), 0 ${screenH *
          0.012}px ${screenH * 0.03}px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.075)`,
      }}
    >
      {/* Screen */}
      <div
        style={{
          position: 'relative',
          width: screenW,
          height: screenH,
          borderRadius: screenR,
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      >
        {children}
        {/* Glass: a slow specular pass and a contact ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: screenR,
            background: `linear-gradient(${112 +
              sheen * 0.05}deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.022) 16%, rgba(255,255,255,0) 38%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: screenR,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.055)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

const ChapterType: React.FC<{
  numeral: string
  verb: string
  line: string
  align: 'left' | 'center'
  width: number
  u: number
  opacity: number
  rise: number
}> = ({numeral, verb, line, align, width, u, opacity, rise}) => (
  <div
    style={{
      width,
      opacity,
      transform: `translateY(${rise}px)`,
      textAlign: align,
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      gap: 14 * u,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12 * u,
        fontFamily: MONO,
        fontSize: 13 * u,
        letterSpacing: 0.26 * 13 * u,
        color: PALETTE.mint,
      }}
    >
      <span style={{opacity: 0.85}}>{numeral}</span>
      <span style={{width: 20 * u, height: 1, background: PALETTE.mint, opacity: 0.45}} />
      <span style={{color: PALETTE.ink, opacity: 0.82}}>{verb}</span>
    </div>
    <div
      style={{
        fontFamily: SANS,
        fontSize: 40 * u,
        lineHeight: 1.24,
        fontWeight: 400,
        letterSpacing: -0.012 * 40 * u,
        color: PALETTE.ink,
      }}
    >
      {line}
    </div>
  </div>
)

const Header: React.FC<{
  format: Format
  placed: PlacedEdit
  u: number
  frame: number
  opacity: number
}> = ({format, placed, u, frame, opacity}) => {
  const activeCut = placed.cuts.find(
    (cut) => frame >= cut.from && frame < cut.from + cut.durationInFrames,
  )
  const rate = activeCut && activeCut.kind === 'play' ? activeCut.rate : 1
  const margin = format.margin * format.width

  return (
    <div
      style={{
        position: 'absolute',
        left: margin,
        right: margin,
        top: format.headerY * format.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity,
        fontFamily: MONO,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 11 * u}}>
        {/* Full opacity so the header mark renders the canonical #F7F4EA exactly,
            not a dimmed approximation of it. Never mint — the mark is off-white
            everywhere; mint stays on rules, ticks and numerals only. */}
        <WireMark size={19 * u} />
        <span
          style={{fontSize: 13 * u, letterSpacing: 0.3 * 13 * u, color: PALETTE.ink, opacity: 0.9}}
        >
          OPENSCOUT
        </span>
      </div>
      <span style={{fontSize: 11 * u, letterSpacing: 0.2 * 11 * u, color: PALETTE.inkFaint}}>
        {rate === 1 ? 'CAPTURE · REAL TIME' : `CAPTURE · ${rate.toFixed(1)}×`}
      </span>
    </div>
  )
}

const Footer: React.FC<{
  format: Format
  placed: PlacedEdit
  u: number
  chapterIndex: number
  opacity: number
  hostLabel: string
}> = ({format, placed, u, chapterIndex, opacity, hostLabel}) => {
  const margin = format.margin * format.width
  return (
    <div
      style={{
        position: 'absolute',
        left: margin,
        right: margin,
        top: format.footerY * format.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity,
        fontFamily: MONO,
        fontSize: 11 * u,
        letterSpacing: 0.2 * 11 * u,
        color: PALETTE.inkFaint,
      }}
    >
      <span>{hostLabel}</span>
      <span style={{display: 'flex', alignItems: 'center', gap: 7 * u}}>
        {placed.chapters.map((chapter) => (
          <span
            key={chapter.numeral + chapter.index}
            style={{
              width: chapter.index === chapterIndex ? 22 * u : 12 * u,
              height: 2,
              borderRadius: 1,
              background: chapter.index === chapterIndex ? PALETTE.mint : PALETTE.hairline,
              opacity: chapter.index === chapterIndex ? 0.9 : 1,
            }}
          />
        ))}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Outro
// ---------------------------------------------------------------------------

const Outro: React.FC<{format: Format; edit: MontageEdit; u: number; local: number}> = ({
  format,
  edit,
  u,
  local,
}) => {
  const end = edit.outroFrames + 40
  const mark = envelope(local, 16, end, 20)
  const word = envelope(local, 24, end, 22)
  const rule = clampInterpolate(local, [34, 62], [0, 1])
  const line = envelope(local, 40, end, 20)
  const foot = envelope(local, 54, end, 20)
  const rise = clampInterpolate(local, [24, 66], [16 * u, 0])

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        transform: `translateY(${rise}px)`,
      }}
    >
      <div style={{opacity: mark, marginBottom: 26 * u}}>
        <WireMark size={62 * u} />
      </div>
      <div
        style={{
          opacity: word,
          fontFamily: MONO,
          fontSize: 34 * u,
          letterSpacing: 0.3 * 34 * u,
          color: PALETTE.ink,
          paddingLeft: 0.3 * 34 * u,
        }}
      >
        OPENSCOUT
      </div>
      <div style={{marginTop: 26 * u, width: 300 * u * rule, height: 1, background: PALETTE.hairline}} />
      <div
        style={{
          opacity: line,
          marginTop: 26 * u,
          fontFamily: SANS,
          fontSize: 27 * u,
          fontWeight: 400,
          letterSpacing: -0.01 * 27 * u,
          color: PALETTE.ink,
          textAlign: 'center',
          maxWidth: format.width * 0.78,
        }}
      >
        {edit.outro.line}
      </div>
      <div
        style={{
          opacity: foot,
          marginTop: 38 * u,
          fontFamily: MONO,
          fontSize: 13 * u,
          letterSpacing: 0.2 * 13 * u,
          color: PALETTE.inkSoft,
          textAlign: 'center',
        }}
      >
        {edit.outro.foot}
      </div>
      <div
        style={{
          opacity: foot,
          marginTop: 22 * u,
          fontFamily: MONO,
          fontSize: 11 * u,
          letterSpacing: 0.24 * 11 * u,
          color: PALETTE.inkFaint,
        }}
      >
        {edit.outro.tag}
      </div>
    </AbsoluteFill>
  )
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const OpenScoutMontage: React.FC<{format: Format; edit: MontageEdit}> = ({format, edit}) => {
  const frame = useCurrentFrame()
  const placed = getPlacedEdit(edit)
  const {contentFrames, outroFrom, totalFrames} = placed
  const {width: W, height: H} = format
  const u = (Math.min(W, H) / 1080) * format.typeScale

  const chapterIndex = Math.max(
    0,
    placed.chapters.findIndex((c) => frame >= c.from && frame < c.from + c.durationInFrames),
  )
  const chapter =
    placed.chapters[frame >= contentFrames ? placed.chapters.length - 1 : chapterIndex]
  const local = frame - chapter.from

  const lensAmount = chapter.lens ? envelope(local, chapter.lens.from, chapter.lens.to, 16) : 0
  const layout = lerpLayout(format.base, format.lensed, lensAmount)

  // Stage tone travels linearly across its chapter — it is a mood change, not a
  // camera move, so it should not settle early.
  const toneRaw = chapter.stageTone ?? [0, 0]
  const tone = mix(
    toneRaw[0],
    toneRaw[1],
    Math.max(0, Math.min(1, local / Math.max(1, chapter.durationInFrames))),
  )

  // Device geometry
  const screenH = layout.deviceH * H
  const screenW = screenH * SOURCE_ASPECT
  const deviceCx = layout.deviceCx * W
  const deviceCy = layout.deviceCy * H

  // No camera. The phone shell is locked: no rotation, no drift, no per-chapter
  // pose, no scale ease on lens arrival. Eye candy comes from the capture, the
  // cuts, the score and the detail lens — which is the only thing that moves.
  // Operator direction 2026-08-13.

  // Outro handover
  const outroLocal = frame - outroFrom
  const outroIn = clampInterpolate(frame, [outroFrom - 10, outroFrom + 34], [0, 1])
  const stageOpacity = 1 - outroIn
  const stageRecede = 1 - outroIn * 0.075

  const typeOpacity = envelope(local, 8, chapter.durationInFrames - 4, 14) * (1 - outroIn)
  const typeRise = clampInterpolate(local, [8, 34], [14 * u, 0])

  const chromeOpacity = envelope(frame, 6, contentFrames + 6, 18) * (1 - outroIn)

  const textW = layout.textW * W
  const textLeft = layout.textAlign === 'center' ? layout.textX * W - textW / 2 : layout.textX * W

  const lensW = layout.lensW * W
  const lensH = chapter.lens ? (chapter.lens.rect.h / chapter.lens.rect.w) * lensW : 0

  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.stage}}>
      <Stage
        format={format}
        frame={frame}
        deviceCx={deviceCx}
        deviceCy={deviceCy}
        deviceW={screenW}
        deviceH={screenH}
        deviceFade={stageOpacity}
        tone={tone}
      />

      {/* Device stage */}
      <AbsoluteFill style={{opacity: stageOpacity}}>
        <div
          style={{
            position: 'absolute',
            left: deviceCx,
            top: deviceCy,
            transform: `translate(-50%, -50%) scale(${stageRecede})`,
          }}
        >
          <PhoneShell screenW={screenW} screenH={screenH} frame={frame}>
            <CaptureStack placed={placed} w={screenW} h={screenH} />
          </PhoneShell>
        </div>
      </AbsoluteFill>

      {/* Detail lens */}
      {chapter.lens && lensAmount > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: layout.lensCx * W - lensW / 2,
            top: layout.lensCy * H - lensH / 2,
            opacity: stageOpacity,
          }}
        >
          <DetailLensHost
            placed={placed}
            chapter={chapter.index}
            rect={chapter.lens.rect}
            width={lensW}
            caption={chapter.lens.caption}
            amount={lensAmount}
            u={u}
            align={layout.textAlign}
          />
        </div>
      ) : null}

      {/* Chapter type */}
      <div
        style={{
          position: 'absolute',
          left: textLeft,
          top: layout.textY * H,
          transform: 'translateY(-50%)',
        }}
      >
        <ChapterType
          numeral={chapter.numeral}
          verb={chapter.verb}
          line={chapter.line}
          align={layout.textAlign}
          width={textW}
          u={u}
          opacity={typeOpacity}
          rise={typeRise}
        />
      </div>

      <Header format={format} placed={placed} u={u} frame={frame} opacity={chromeOpacity} />
      <Footer
        format={format}
        placed={placed}
        u={u}
        chapterIndex={chapter.index}
        opacity={chromeOpacity}
        hostLabel={edit.hostLabel ?? 'iOS · ARTS MAC MINI'}
      />

      {frame >= outroFrom - 12 ? (
        <Outro format={format} edit={edit} u={u} local={outroLocal} />
      ) : null}

      <Vignette tone={tone} />

      {SCORE_ENABLED ? (
        <Audio
          src={staticFile(edit.score)}
          volume={(f) =>
            Math.min(
              clampInterpolate(f, [0, SCORE_FADE_IN], [0, 1], Easing.out(Easing.quad)),
              clampInterpolate(
                f,
                [totalFrames - SCORE_FADE_OUT, totalFrames],
                [1, 0],
                Easing.in(Easing.quad),
              ),
            ) * edit.scoreGain
          }
        />
      ) : null}
    </AbsoluteFill>
  )
}

/**
 * Draws the magnified crop for the active chapter using the same cut stack, so
 * the lens is always the live frame rather than a still.
 */
const DetailLensHost: React.FC<{
  placed: PlacedEdit
  chapter: number
  rect: LensRect
  width: number
  caption: string
  amount: number
  u: number
  align: 'left' | 'center'
}> = ({placed, chapter, rect, width, caption, amount, u, align}) => {
  const frame = useCurrentFrame()
  const scale = width / rect.w
  const height = rect.h * scale
  const radius = 14 * u

  const cuts = placed.cuts.filter((cut) => cut.chapter === chapter)

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        opacity: amount,
        transform: `translateY(${(1 - amount) * 20 * u}px) scale(${0.986 + amount * 0.014})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          overflow: 'hidden',
          background: PALETTE.glass,
          boxShadow: `0 ${26 * u}px ${58 * u}px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.10)`,
          // Lines clipped by the crop soften out instead of being sliced.
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)',
        }}
      >
        {cuts.map((cut, i) => {
          const start = cut.from
          const end = cut.from + cut.durationInFrames + cut.tail
          if (frame < start || frame >= end) return null
          return (
            <Sequence
              key={`lens-${chapter}-${i}`}
              from={start}
              durationInFrames={Math.max(1, end - start)}
              layout="none"
              name={`lens cut ${i}`}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -rect.x * scale,
                  top: -rect.y * scale,
                  width: SOURCE_WIDTH * scale,
                  height: SOURCE_HEIGHT * scale,
                }}
              >
                <CutVideo cut={cut} w={SOURCE_WIDTH * scale} h={SOURCE_HEIGHT * scale} />
              </div>
            </Sequence>
          )
        })}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(168deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 34%)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: -22 * u,
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          gap: 8 * u,
          fontFamily: MONO,
          fontSize: 12 * u,
          letterSpacing: 0.22 * 12 * u,
          color: PALETTE.inkFaint,
        }}
      >
        <span style={{width: 14 * u, height: 1, background: PALETTE.mint, opacity: 0.7}} />
        {caption}
      </div>
    </div>
  )
}
