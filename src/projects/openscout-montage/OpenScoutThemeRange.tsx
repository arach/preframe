// OpenScout — theme range. The composition.
//
// One picture, rendered twice with two different scores. Nothing in this file
// reads anything score-related except `<Audio>` at the very bottom, which is the
// structural reason the A/B can be frame-identical: there is no code path by
// which the choice of track can reach a pixel.
//
// The design brief in three constraints, and how each is met here:
//
//  1. STABLE FRAMING. The screen never moves. There is no drift, no parallax, no
//     breathing scale, no floating device. The only camera move in the film is
//     `Push`, which appears in two of seven chapters, settles, and rests — see
//     `pushAt` below. The last four chapters, which carry the reveal and the
//     return, are locked absolutely still.
//
//  2. THE INTERACTION IS NEVER OBSCURED. Nothing is ever drawn on top of the
//     capture. Type lives in the margins the layout reserves for it, the grade
//     is applied to the stage rather than the screen, and the one effect that
//     does touch the screen — `Bloom` — is drawn strictly outside its bounds.
//
//  3. THE PRODUCT SUPPLIES THE TRANSITIONS. Every chapter opens one beat before
//     a theme switch, so the recolour the viewer sees is the real interface
//     doing it, in full, at true speed. There is not one artificial wipe,
//     luma-ramp or colour flash in the film.
//
// The stage is graded but the screen is not. `tone` moves the room from near
// black to a warm graphite when the product turns light, so the turn reads as a
// change to the whole frame rather than to a rectangle inside it — but the
// capture's own pixels are passed through untouched. No LUT, no curve, no
// saturation push, no overlay blend on the screen anywhere in this file.

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
  BEAT,
  FPS,
  getPlacedEdit,
  MONO,
  PALETTE,
  PlacedCut,
  PlacedEdit,
  Push,
  SANS,
  SOURCE,
  SOURCE_HEIGHT,
  SOURCE_WIDTH,
  ThemeRangeEdit,
  ThemeRangeFormat,
} from './edit-theme-range'

const SCORE_FADE_IN = 10
const SCORE_FADE_OUT = 26

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/**
 * Screen width on a 1920-wide frame.
 *
 * 1340 of a 1514-pixel-wide source is a 0.885 downscale. That is the point: the
 * capture is never resampled upward anywhere in this film, so what reaches the
 * encoder is at worst a minified version of the original pixels and at best —
 * inside a push, where 1.26–1.3 magnification brings the effective scale back to
 * ~1.12–1.15 — very close to 1:1. Filling 1920 would have meant a 1.27 upscale
 * of a text-dense interface for the entire runtime.
 */
const SCREEN_W = 1340
const SCREEN_H = Math.round((SCREEN_W * SOURCE_HEIGHT) / SOURCE_WIDTH) // 949

/** Slightly above centre: more air beneath than above, which is where the type sits. */
const SCREEN_CY = 0.474

const clampInterpolate = (
  frame: number,
  range: readonly [number, number],
  out: readonly [number, number],
  easing?: (t: number) => number,
) =>
  interpolate(frame, range as [number, number], out as [number, number], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  })

/** Fade up, hold, fade down — used for every piece of type in the film. */
const envelope = (frame: number, from: number, to: number, rise = 14, fall = 14) =>
  Math.min(
    clampInterpolate(frame, [from, from + rise], [0, 1], Easing.out(Easing.quad)),
    clampInterpolate(frame, [to - fall, to], [1, 0], Easing.in(Easing.quad)),
  )

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

/**
 * The room. Two flat fields cross-faded by `tone`, plus a soft key light above
 * the screen and a vignette below it.
 *
 * Deliberately static. `OpenScoutMontage`'s stage drifts its grid with the frame
 * number; this one does not move at all, because this film's subject is a
 * colour change and a moving background would compete with it for exactly the
 * attention the change needs.
 */
const Stage: React.FC<{format: ThemeRangeFormat; tone: number}> = ({format, tone}) => {
  const {width: W, height: H} = format
  const base = tone > 0.5 ? PALETTE.stageLift : PALETTE.stage
  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.stage}}>
      <AbsoluteFill style={{backgroundColor: PALETTE.stageLift, opacity: tone}} />
      {/* Key light, above and behind the screen. Lifts with the product. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 78% at 50% ${18 - tone * 4}%, rgba(255,255,255,${
            0.045 + tone * 0.05
          }) 0%, rgba(255,255,255,0) 62%)`,
        }}
      />
      {/* Floor shadow, so the screen sits on something. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(90% 45% at 50% 104%, rgba(0,0,0,${
            0.55 - tone * 0.22
          }) 0%, rgba(0,0,0,0) 70%)`,
        }}
      />
      {/* Corner vignette. Constant, so it never reads as a move. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(128% 108% at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,${
            0.5 - tone * 0.16
          }) 100%)`,
        }}
      />
      <AbsoluteFill style={{opacity: 0, backgroundColor: base, width: W, height: H}} />
    </AbsoluteFill>
  )
}

/**
 * Fine luminance texture over the whole frame.
 *
 * An SVG fractal-noise tile at very low opacity. It exists for a practical
 * reason as much as an aesthetic one: large near-flat dark gradients band badly
 * in 8-bit H.264, and a little noise dithers the ramp away. It is drawn beneath
 * the screen's own layer, so it never lands on the capture's pixels.
 */
const Grain: React.FC<{format: ThemeRangeFormat; tone: number}> = ({format, tone}) => (
  <AbsoluteFill style={{opacity: 0.05 + (1 - tone) * 0.025, mixBlendMode: 'overlay'}}>
    <svg width={format.width} height={format.height}>
      <filter id="tr-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={7} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#tr-grain)" />
    </svg>
  </AbsoluteFill>
)

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const screenStyle: React.CSSProperties = {
  width: SCREEN_W,
  height: SCREEN_H,
  objectFit: 'cover',
  display: 'block',
}

const CutVideo: React.FC<{cut: PlacedCut}> = ({cut}) => {
  const src = staticFile(SOURCE)
  if (cut.kind === 'hold') {
    return (
      <Freeze frame={0}>
        <OffthreadVideo src={src} startFrom={Math.round(cut.holdAt * FPS)} muted style={screenStyle} />
      </Freeze>
    )
  }
  return (
    <OffthreadVideo
      src={src}
      startFrom={Math.round(cut.sourceStart * FPS)}
      playbackRate={cut.rate}
      muted
      style={screenStyle}
    />
  )
}

/**
 * A/B dissolve stack: every cut keeps playing underneath whatever fades in over
 * it, so a chapter head never cross-fades into a frozen frame.
 */
const CaptureStack: React.FC<{placed: PlacedEdit}> = ({placed}) => {
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
              <CutVideo cut={cut} />
            </AbsoluteFill>
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}

/**
 * The magnification in force at an absolute frame.
 *
 * Ease-in → rest → ease-out, with the rest deliberately the longest phase: at
 * the chapter lengths this film uses, a push is moving for 84 of 288 frames and
 * still for the other 204.
 */
const pushAt = (placed: PlacedEdit, frame: number): {scale: number; ox: number; oy: number} => {
  const chapter = placed.chapters.find(
    (c) => frame >= c.from && frame < c.from + c.durationInFrames,
  )
  const push: Push | undefined = chapter?.push
  if (!chapter || !push) return {scale: 1, ox: 50, oy: 50}
  const local = frame - chapter.from
  const scale = Math.min(
    clampInterpolate(local, [push.in[0], push.in[1]], [1, push.scale], Easing.inOut(Easing.cubic)),
    clampInterpolate(local, [push.out[0], push.out[1]], [push.scale, 1], Easing.inOut(Easing.cubic)),
  )
  return {
    scale,
    ox: (push.cx / SOURCE_WIDTH) * 100,
    oy: (push.cy / SOURCE_HEIGHT) * 100,
  }
}

/**
 * Light thrown by the screen onto the room.
 *
 * Drawn as a blurred box strictly BEHIND and OUTSIDE the screen — the screen's
 * own layer paints over it — so it colours the stage without laying a single
 * pixel over the interface.
 */
const Bloom: React.FC<{tone: number; w: number; h: number}> = ({tone, w, h}) => (
  <div
    style={{
      position: 'absolute',
      width: w,
      height: h,
      borderRadius: 26,
      backgroundColor: tone > 0.5 ? '#EDE9DE' : '#2A3340',
      filter: `blur(${64 + tone * 34}px)`,
      opacity: 0.2 + tone * 0.3,
      transform: 'translateY(6px)',
    }}
  />
)

// ---------------------------------------------------------------------------
// Wire mark — the canonical off-white OpenScout mark. Never the green one.
// ---------------------------------------------------------------------------

const WireMark: React.FC<{size: number; opacity?: number}> = ({size, opacity = 1}) => (
  <svg
    width={size * (224 / 236)}
    height={size}
    viewBox="0 0 224 236"
    style={{display: 'block', overflow: 'visible', opacity}}
  >
    <path
      d="M103.01 13.21 Q112 8 120.99 13.21 L198.01 57.79 Q207 63 207 73.39 L207 162.61 Q207 173 198.01 178.21 L120.99 222.79 Q112 228 103.01 222.79 L25.99 178.21 Q17 173 17 162.61 L17 73.39 Q17 63 25.99 57.79 Z"
      fill="none"
      stroke={PALETTE.mark}
      strokeWidth={24}
      strokeLinejoin="round"
    />
    <path d="M112 70 154 94v48l-42 24-42-24V94Z" fill={PALETTE.mark} />
  </svg>
)

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

/**
 * The index line and the one written line, both sitting in the margin the layout
 * reserves beneath the screen. Nothing is ever drawn over the capture.
 */
const TypeBand: React.FC<{format: ThemeRangeFormat; placed: PlacedEdit; frame: number}> = ({
  format,
  placed,
  frame,
}) => {
  const chapter = placed.chapters.find(
    (c) => frame >= c.from && frame < c.from + c.durationInFrames,
  )
  if (!chapter) return null

  const {width: W, height: H} = format
  const left = (W - SCREEN_W) / 2
  const screenBottom = H * SCREEN_CY + SCREEN_H / 2
  const baseline = screenBottom + (H - screenBottom) * 0.52

  const end = chapter.from + chapter.durationInFrames
  // Held right to the chapter edge, then handed over — the label should change
  // when the theme does, not fade out and leave the band empty.
  const on = envelope(frame, chapter.from + 4, end, 16, 8)

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left,
          top: baseline - 9,
          fontFamily: MONO,
          fontSize: 15,
          letterSpacing: 2.4,
          color: PALETTE.inkSoft,
          opacity: on,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{color: PALETTE.inkFaint, marginRight: 14}}>{chapter.numeral}</span>
        {chapter.label}
      </div>
      {chapter.line ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: W - left,
            top: baseline - 13,
            textAlign: 'right',
            fontFamily: SANS,
            fontSize: 21,
            fontWeight: 400,
            letterSpacing: 0.1,
            color: PALETTE.ink,
            opacity: on * 0.92,
          }}
        >
          {chapter.line}
        </div>
      ) : null}
    </>
  )
}

/**
 * The ending. Mark, wordmark, hairline and one quiet theme ledger — revealed in
 * that order and then simply held. No motion, no scale, no drift: after a film
 * whose whole subject is change, the last two bars are the one thing that does
 * not move.
 */
const Outro: React.FC<{format: ThemeRangeFormat; edit: ThemeRangeEdit; frames: number}> = ({
  format,
  edit,
  frames,
}) => {
  const frame = useCurrentFrame()
  const {width: W} = format
  const u = W / 1920

  const mark = envelope(frame, 6, frames + 40, 20, 1)
  const word = envelope(frame, 18, frames + 40, 20, 1)
  const rule = clampInterpolate(frame, [30, 62], [0, 1], Easing.inOut(Easing.cubic))
  const line = envelope(frame, 40, frames + 40, 22, 1)
  const foot = envelope(frame, edit.outro.line ? 58 : 42, frames + 40, 22, 1)

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div style={{opacity: mark}}>
        <WireMark size={62 * u} />
      </div>
      <div
        style={{
          marginTop: 22 * u,
          fontFamily: SANS,
          fontSize: 30 * u,
          fontWeight: 500,
          letterSpacing: 0.6,
          color: PALETTE.ink,
          opacity: word,
        }}
      >
        OpenScout
      </div>
      <div
        style={{
          marginTop: 26 * u,
          width: 190 * u * rule,
          height: 1,
          backgroundColor: PALETTE.hairline,
        }}
      />
      {edit.outro.line ? (
        <div
          style={{
            marginTop: 26 * u,
            fontFamily: SANS,
            fontSize: 20 * u,
            color: PALETTE.inkSoft,
            opacity: line,
          }}
        >
          {edit.outro.line}
        </div>
      ) : null}
      <div
        style={{
          marginTop: (edit.outro.line ? 30 : 28) * u,
          fontFamily: MONO,
          fontSize: 12.5 * u,
          letterSpacing: 3,
          color: PALETTE.inkFaint,
          opacity: foot,
        }}
      >
        {edit.outro.foot}
      </div>
    </AbsoluteFill>
  )
}

// ---------------------------------------------------------------------------
// Film
// ---------------------------------------------------------------------------

export const OpenScoutThemeRange: React.FC<{format: ThemeRangeFormat; edit: ThemeRangeEdit}> = ({
  format,
  edit,
}) => {
  const placed = getPlacedEdit(edit)
  const frame = useCurrentFrame()
  const {width: W, height: H} = format

  // Stage tone, cross-faded across the chapter head that changes it, so the room
  // turns with the product instead of snapping a frame before or after it.
  const tone = (() => {
    const i = placed.chapters.findIndex(
      (c) => frame >= c.from && frame < c.from + c.durationInFrames,
    )
    if (i < 0) return placed.chapters[placed.chapters.length - 1].tone
    const cur = placed.chapters[i]
    const prev = placed.chapters[i - 1]
    if (!prev || prev.tone === cur.tone) return cur.tone
    // The room turns WITH the interface, not ahead of it. Every chapter opens one
    // beat before its switch, so the recolour lands at `from + BEAT`; the stage
    // ramp is centred on that frame rather than on the cut. Starting it at the
    // cut lifted the room a beat early and gave the reveal away.
    const recolour = cur.from + BEAT
    return clampInterpolate(
      frame,
      [recolour - 6, recolour + BEAT],
      [prev.tone, cur.tone],
      Easing.inOut(Easing.quad),
    )
  })()

  const {scale, ox, oy} = pushAt(placed, frame)

  // The film fades from and to black at the very edges only.
  const open = clampInterpolate(frame, [0, 18], [0, 1], Easing.out(Easing.quad))
  const close = clampInterpolate(
    frame,
    [placed.totalFrames - 20, placed.totalFrames],
    [1, 0],
    Easing.in(Easing.quad),
  )
  const contentOut = clampInterpolate(
    frame,
    [placed.outroFrom - 20, placed.outroFrom],
    [1, 0],
    Easing.inOut(Easing.quad),
  )

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: Math.min(open, close)}}>
        <Stage format={format} tone={tone} />
        <Grain format={format} tone={tone} />

        <Sequence from={0} durationInFrames={placed.outroFrom + 24} layout="none">
          <AbsoluteFill style={{opacity: contentOut}}>
            {/* Screen — bloom behind, capture in front, hairline on top of neither. */}
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start'}}>
              <div
                style={{
                  position: 'absolute',
                  top: H * SCREEN_CY - SCREEN_H / 2,
                  left: (W - SCREEN_W) / 2,
                  width: SCREEN_W,
                  height: SCREEN_H,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bloom tone={tone} w={SCREEN_W} h={SCREEN_H} />
                {/*
                  Two divs, not one, and the split is load-bearing. `overflow:
                  hidden` clips to the element's OWN border box, so putting the
                  push transform on the clipping element scales the clip along
                  with the picture and the screen grows to fill the frame. The
                  outer div is the fixed window; the inner one is the only thing
                  that moves.
                */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: `0 30px 90px rgba(0,0,0,${0.6 - tone * 0.2})`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      // Scaling about an interior origin always covers the
                      // original box, so a push can never expose the stage
                      // through the screen.
                      transform: `scale(${scale})`,
                      transformOrigin: `${ox}% ${oy}%`,
                    }}
                  >
                    <CaptureStack placed={placed} />
                  </div>
                </div>
                {/* Hairline edge, drawn as an inset ring so it sits ON the
                    boundary rather than over the interface. */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 12,
                    boxShadow: `inset 0 0 0 1px rgba(242,243,245,${0.16 - tone * 0.05})`,
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </AbsoluteFill>

            <TypeBand format={format} placed={placed} frame={frame} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={placed.outroFrom} durationInFrames={edit.outroFrames} layout="none">
          <Outro format={format} edit={edit} frames={edit.outroFrames} />
        </Sequence>
      </AbsoluteFill>

      {/*
        The only place in this component that reads anything score-related, and
        it produces no pixels. This is what makes A and B frame-identical by
        construction rather than by discipline.
      */}
      <Audio
        src={staticFile(edit.score)}
        volume={(f) =>
          Math.min(
            clampInterpolate(f, [0, SCORE_FADE_IN], [0, 1]),
            clampInterpolate(f, [placed.totalFrames - SCORE_FADE_OUT, placed.totalFrames], [1, 0]),
          ) * edit.scoreGain
        }
      />
    </AbsoluteFill>
  )
}
