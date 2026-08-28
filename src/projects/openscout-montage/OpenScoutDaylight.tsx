// OpenScout — daylight composition.
//
// A sibling of `OpenScoutRefined`, not a replacement. That component still
// renders the refined film, which is the cut this one is reviewed against, and
// it is untouched — as are `OpenScoutMontage` and the two V3 films.
//
// The spatial composition is deliberately identical to the refined cut's: one
// standing layout per format, a full fixed phone, a stable title-and-explanation
// column, and a preallocated detail-lens slot. Nothing recenters, nothing
// travels between layout states, and there is no camera.
//
// What is new is a transition framework, which is the whole point of this pass.
// The refined cut had exactly one verb — opacity — applied uniformly to every
// element at every boundary. Here motion is authored and it is scheduled:
//
//  1. TITLES ARE TYPED. Chapter titles reveal character by character on a short
//     stagger. The glyphs do not move: each one fades up in place, so the line
//     is composed from the start and nothing reflows. See `TypeReveal`.
//
//  2. THE LENS ARRIVES AND LEAVES ON AN EASE. It opens behind a soft top-down
//     wipe, settles from 98.6% to 100% on a decisive-then-slow curve, and leaves
//     on a different, gentler curve. See `lensPhase`.
//
//  3. CHAPTERS HAND OVER RATHER THAN CROSS-FADE. The type and the lens are
//     taken away *before* the picture dissolves, and the next chapter's type
//     starts *after* it has settled. A boundary is a phrase — out, change,
//     in — instead of three things happening at once. See `CHOREOGRAPHY`.
//
//  4. THE MODE TURN IS A WHOLE-FRAME EVENT. At the hinge the stage tone travels
//     with the picture dissolve, on exactly the same frames, so the film turns
//     dark rather than the phone alone turning dark. See `DAYLIGHT_TURN`.
//
// Everything else is still opacity. There is no phone motion, no title travel,
// no recentering, no drifting camera and no decorative movement anywhere.

import React from 'react'
import {AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame} from 'remotion'
import {
  getPlacedEdit,
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
} from './edit'
import type {DaylightFormat} from './edit-daylight'
import {DAYLIGHT_TURN} from './edit-daylight'
import {
  CutVideo,
  clampInterpolate,
  envelope,
  PhoneShell,
  Stage,
  Vignette,
  WireMark,
} from './OpenScoutMontage'

const SCORE_FADE_IN = 8
const SCORE_FADE_OUT = 18

// ---------------------------------------------------------------------------
// Timing vocabulary
// ---------------------------------------------------------------------------

/**
 * Chapter choreography, in frames from the chapter's first frame (and, for the
 * outgoing values, from its last).
 *
 * The ordering is the point. `TYPE_OUT_LEAD` is larger than the edit's
 * 16-frame picture dissolve, so the type is already gone by the time the next
 * chapter's footage begins to appear; `EYEBROW_IN` is larger still on the way
 * back in, so the new title lands on a picture that has settled.
 *
 * The whole schedule has to fit inside the SHORTEST chapter, which is the
 * two-bar bookend at 100 frames. Budgeted against it: the eyebrow is up by 30,
 * a 22-character title has typed itself by 42, the explanatory line is at full
 * opacity from 58, and the block does not begin to leave until 78 — so even the
 * shortest chapter holds its complete type for two thirds of a second. An
 * earlier build ran a slower stagger and a longer lead-in, and on rendered
 * stills the short chapters' explanatory lines reached full opacity roughly a
 * frame before they started fading out again.
 */
const CHOREOGRAPHY = {
  /** Chapter index line starts fading up. */
  EYEBROW_IN: 18,
  EYEBROW_RAMP: 12,
  /** Title starts typing. */
  TITLE_IN: 24,
  /** Per-character stagger, and how long each character takes to arrive. */
  CHAR_STAGGER: 0.64,
  CHAR_RAMP: 5,
  /** Gap between the title finishing and the explanatory line starting. */
  SUB_GAP: 3,
  SUB_RAMP: 13,
  /** How long before the chapter ends the whole type block starts leaving. */
  TYPE_OUT_LEAD: 22,
  TYPE_OUT_RAMP: 12,
} as const

/** Arrival: moves off decisively, then settles. */
const EASE_ARRIVE = Easing.bezier(0.16, 0.72, 0.22, 1)
/** Departure: eases away rather than snapping — deliberately not the inverse. */
const EASE_DEPART = Easing.bezier(0.5, 0.02, 0.62, 0.38)
/** Type reveal, per character. */
const EASE_GLYPH = Easing.out(Easing.quad)
/** The mode reveal: leaves promptly, then a long settle as it clears the frame. */
const EASE_REVEAL = Easing.bezier(0.34, 0.02, 0.16, 1)

/** How long a title takes to type, given its length. */
const typeDuration = (text: string) =>
  Math.max(0, text.length - 1) * CHOREOGRAPHY.CHAR_STAGGER + CHOREOGRAPHY.CHAR_RAMP

/**
 * The detail lens's arrival and departure.
 *
 * `wipe` opens the panel top-down on arrival only — things arrive with more
 * ceremony than they leave, and a closing wipe on the way out read as the panel
 * being deleted rather than withdrawn. Departure is carried by opacity and a
 * small negative scale, on a different curve from the arrival.
 *
 * The scale range is deliberately tiny (1.4% on the way in, 0.6% on the way
 * out). This is a lens settling into a slot it already owns, not a zoom.
 */
const lensPhase = (local: number, from: number, to: number) => {
  const arrive = clampInterpolate(local, [from, from + 20], [0, 1], EASE_ARRIVE)
  const depart = clampInterpolate(local, [to - 15, to], [1, 0], EASE_DEPART)
  return {
    opacity: Math.min(arrive, depart),
    scale: 0.986 + 0.014 * arrive - 0.006 * (1 - depart),
    wipe: arrive,
    // The caption is a label for a panel, so it waits for the panel.
    caption: Math.min(clampInterpolate(local, [from + 10, from + 26], [0, 1]), depart),
  }
}

// ---------------------------------------------------------------------------
// Typed reveal
// ---------------------------------------------------------------------------

/**
 * A line of type revealed character by character.
 *
 * Every glyph is rendered from frame zero at its final position and only its
 * opacity changes, so the line never reflows and no glyph ever moves — which is
 * what keeps this on the right side of the operator's direction against title
 * travel. Words are `inline-block` so they still wrap; the spaces between them
 * are ordinary breakable text nodes outside those boxes.
 *
 * Character indices are assigned once, ahead of render, rather than by mutating
 * a counter inside `map` — the same text must always produce the same schedule.
 */
const TypeReveal: React.FC<{
  text: string
  /** Frames since the reveal began. Negative is simply "not yet". */
  local: number
  stagger?: number
  ramp?: number
}> = ({text, local, stagger = CHOREOGRAPHY.CHAR_STAGGER, ramp = CHOREOGRAPHY.CHAR_RAMP}) => {
  const words = React.useMemo(() => {
    let cursor = 0
    return text.split(' ').map((word) => {
      const chars = [...word].map((ch) => ({ch, at: cursor++}))
      // The space costs a tick too, so the cadence stays even across words.
      cursor += 1
      return chars
    })
  }, [text])

  return (
    <>
      {words.map((chars, wi) => (
        <React.Fragment key={wi}>
          <span style={{display: 'inline-block'}}>
            {chars.map(({ch, at}, ci) => (
              <span
                key={ci}
                style={{
                  opacity: clampInterpolate(local, [at * stagger, at * stagger + ramp], [0, 1], EASE_GLYPH),
                }}
              >
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Redacted playback
// ---------------------------------------------------------------------------

/**
 * How an incoming cut arrives, for an element of size `w`×`h` that represents
 * the whole source frame.
 *
 * The default is the film's cross-dissolve, returned as an opacity. A cut that
 * declares `enter: {kind: 'radial'}` instead returns a mask: a soft-edged circle
 * growing from a point in source coordinates until it has covered the element,
 * with the cut beneath fully visible outside it. That is what carries the mode
 * turn — see `CutEnter` in `edit.ts` for why a dissolve could not.
 *
 * Both the phone and the detail lens draw the source into an element of exactly
 * this shape, so the same call serves both and the two stay in step to the
 * frame: the magnified `Mode` row inverts on the same arc as the panel behind
 * it.
 */
const cutEntry = (
  cut: PlacedCut,
  frame: number,
  w: number,
  h: number,
): {opacity: number; maskImage?: string} => {
  if (!cut.fadeIn) return {opacity: 1}
  const t = clampInterpolate(
    frame,
    [cut.from, cut.from + cut.fadeIn],
    [0, 1],
    cut.enter ? EASE_REVEAL : Easing.inOut(Easing.quad),
  )
  if (!cut.enter) return {opacity: t}

  const px = (cut.enter.cx / SOURCE_WIDTH) * w
  const py = (cut.enter.cy / SOURCE_HEIGHT) * h
  // Far enough to clear the furthest corner, so the reveal finishes complete.
  const maxR = Math.max(
    Math.hypot(px, py),
    Math.hypot(w - px, py),
    Math.hypot(px, h - py),
    Math.hypot(w - px, h - py),
  )
  const r = maxR * t
  // A feather of roughly constant width rather than a constant fraction of the
  // radius, so the leading edge does not turn into a wide gradient wash as the
  // circle grows. 4.5%: at 8% the arc read as fog on a rendered still at frame
  // 720 and the rail's two orderings ghosted through each other inside it.
  const edge = maxR * 0.045
  const inner = r > 0 ? Math.max(0, ((r - edge) / r) * 100) : 0
  const mask = `radial-gradient(circle ${r}px at ${px}px ${py}px, #000 0%, #000 ${inner.toFixed(
    2,
  )}%, rgba(0,0,0,0) 100%)`
  return {opacity: 1, maskImage: mask}
}

/**
 * A cut's pixels with a block of source rows removed and the surface closed up.
 *
 * Three clipped views of the same frame, all in source coordinates scaled by
 * `k`, so this works identically inside the phone (where the video is drawn at
 * screen size) and inside the detail lens (where it is drawn magnified):
 *
 *   A  dest [0, from)                 ← source [0, from)          unshifted
 *   B  dest [from, floor - band)      ← source [to, floor)        pulled up by band
 *   C  dest [floor - band, H)         ← source [floor - band, H)  unshifted
 *
 * B closes the gap; C leaves the chrome below the scroll region exactly where
 * the capture put it. The strip C re-shows at the bottom of the scroll region
 * was already empty surface in the capture, so the join is invisible and
 * nothing is invented to fill it.
 *
 * `CutVideo` is mounted three times rather than once. Remotion resolves the same
 * source frame for all three, and this only applies to cuts that ask for it.
 */
const RedactedVideo: React.FC<{
  cut: PlacedCut
  w: number
  h: number
  /**
   * The source rows this element will actually show, when the caller knows.
   * The detail lens crops hard to its rectangle, and a rectangle that stops
   * above the redacted block cannot reveal it — so there is no reason to mount
   * three video elements to serve one visible pane. Chapter I's lens is exactly
   * that case. Omit when the whole frame is visible, as it is inside the phone.
   */
  visible?: {from: number; to: number}
}> = ({cut, w, h, visible}) => {
  const r = cut.redact
  // `visible.to <= r.from` is the only safe skip: anything reaching below the
  // block is affected by the close-up shift even if the block itself is off-pane.
  if (!r || (visible && visible.to <= r.from)) return <CutVideo cut={cut} w={w} h={h} />

  const k = h / SOURCE_HEIGHT
  const band = (r.to - r.from) * k
  const top = r.from * k
  const seam = r.floor * k - band

  const pane = (destTop: number, destHeight: number, shift: number) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: destTop,
        width: w,
        height: destHeight,
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', left: 0, top: -destTop - shift, width: w, height: h}}>
        <CutVideo cut={cut} w={w} h={h} />
      </div>
    </div>
  )

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden'}}>
      {pane(0, top, 0)}
      {pane(top, seam - top, band)}
      {pane(seam, h - seam, 0)}
    </div>
  )
}

/** A/B dissolve stack: every cut keeps playing beneath whatever fades in. */
const DaylightCaptureStack: React.FC<{placed: PlacedEdit; w: number; h: number}> = ({
  placed,
  w,
  h,
}) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      {placed.cuts.map((cut, i) => {
        const start = cut.from
        const end = cut.from + cut.durationInFrames + cut.tail
        const entry = cutEntry(cut, frame, w, h)
        return (
          <Sequence
            key={`${i}-${cut.note}`}
            name={cut.note}
            from={start}
            durationInFrames={Math.max(1, end - start)}
            layout="none"
          >
            <AbsoluteFill
              style={{
                opacity: entry.opacity,
                maskImage: entry.maskImage,
                WebkitMaskImage: entry.maskImage,
              }}
            >
              <RedactedVideo cut={cut} w={w} h={h} />
            </AbsoluteFill>
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}

// ---------------------------------------------------------------------------
// Opening
// ---------------------------------------------------------------------------

/**
 * The brand breath. Mark, wordmark, a rule that draws, and the positioning line
 * typed rather than faded — this is where the film teaches the reveal it then
 * uses on every chapter title.
 *
 * The lockup leaves as a group while the phone comes up underneath, so the
 * handover is a crossfade rather than a cut. Nothing here moves.
 */
const Preamble: React.FC<{
  format: DaylightFormat
  u: number
  frame: number
  line: string
  frames: number
}> = ({format, u, frame, line, frames}) => {
  const mark = clampInterpolate(frame, [10, 32], [0, 1])
  const word = clampInterpolate(frame, [22, 46], [0, 1])
  const rule = clampInterpolate(frame, [34, 66], [0, 1])
  const out = clampInterpolate(frame, [frames - 22, frames - 2], [1, 0], EASE_DEPART)

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity: out,
      }}
    >
      <div style={{opacity: mark, marginBottom: 30 * u}}>
        <WireMark size={54 * u} />
      </div>
      <div
        style={{
          opacity: word,
          fontFamily: MONO,
          fontSize: 24 * u,
          fontWeight: 400,
          letterSpacing: 0.28 * 24 * u,
          // Tracking is applied to the right of every glyph, including the last,
          // so the word reads off-centre unless the trailing space is pushed back.
          paddingLeft: 0.28 * 24 * u,
          color: PALETTE.ink,
        }}
      >
        OPENSCOUT
      </div>
      <div
        style={{marginTop: 30 * u, width: 240 * u * rule, height: 1, background: PALETTE.hairline}}
      />
      <div
        style={{
          marginTop: 30 * u,
          fontFamily: SANS,
          fontSize: 26 * u,
          fontWeight: 400,
          letterSpacing: -0.014 * 26 * u,
          lineHeight: 1.3,
          color: PALETTE.ink,
          textAlign: 'center',
          maxWidth: format.width * 0.74,
        }}
      >
        {/* Slower than a chapter title: this is the film's thesis, and it has
            two bars to arrive in. */}
        <TypeReveal text={line} local={frame - 44} stagger={0.9} ramp={7} />
      </div>
    </AbsoluteFill>
  )
}

// ---------------------------------------------------------------------------
// Chapter type — one fixed column, top-anchored
// ---------------------------------------------------------------------------

const ChapterType: React.FC<{
  numeral: string
  verb: string
  line: string
  sub?: string
  align: 'left' | 'center'
  width: number
  u: number
  titleScale: number
  /** Frames since this chapter began. */
  local: number
  /** The chapter's whole-block departure, 1 → 0. */
  out: number
}> = ({numeral, verb, line, sub, align, width, u, titleScale, local, out}) => {
  // The explanatory line is pulled back far less than the headline: it is
  // already small, and at the square's 0.72 title scale a proportional cut would
  // have taken it under 13 px.
  const subScale = (1 + titleScale) / 2

  const eyebrow =
    clampInterpolate(
      local,
      [CHOREOGRAPHY.EYEBROW_IN, CHOREOGRAPHY.EYEBROW_IN + CHOREOGRAPHY.EYEBROW_RAMP],
      [0, 1],
    ) * out
  const subAt = CHOREOGRAPHY.TITLE_IN + typeDuration(line) + CHOREOGRAPHY.SUB_GAP
  const subIn =
    clampInterpolate(local, [subAt, subAt + CHOREOGRAPHY.SUB_RAMP], [0, 1]) * out

  return (
    <div
      style={{
        width,
        textAlign: align,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {/* Index line. Mono, small, faint — metadata, not a headline. Mint is on
          the tick alone and never on a word of the message. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10 * u,
          opacity: eyebrow,
          fontFamily: MONO,
          fontSize: 10.5 * u,
          fontWeight: 400,
          letterSpacing: 0.2 * 10.5 * u,
          color: PALETTE.inkFaint,
        }}
      >
        <span>{numeral}</span>
        <span style={{width: 16 * u, height: 1, background: PALETTE.mint, opacity: 0.5}} />
        <span style={{color: PALETTE.ink, opacity: 0.5}}>{verb}</span>
      </div>

      {/* Title. Sentence case, regular weight, tight tracking, open leading —
          typed in, then taken away as a block. */}
      <div
        style={{
          marginTop: 18 * u,
          opacity: out,
          fontFamily: SANS,
          fontSize: 34 * u * titleScale,
          lineHeight: 1.26,
          fontWeight: 400,
          letterSpacing: -0.02 * 34 * u * titleScale,
          color: PALETTE.ink,
        }}
      >
        <TypeReveal text={line} local={local - CHOREOGRAPHY.TITLE_IN} />
      </div>

      {sub ? (
        <div
          style={{
            marginTop: 15 * u,
            opacity: subIn,
            fontFamily: SANS,
            fontSize: 17 * u * subScale,
            lineHeight: 1.5,
            fontWeight: 400,
            letterSpacing: 0,
            color: PALETTE.inkSoft,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

const Header: React.FC<{
  format: DaylightFormat
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
      <div style={{display: 'flex', alignItems: 'center', gap: 10 * u}}>
        {/* Full opacity, so the mark renders the canonical #F7F4EA exactly
            rather than a dimmed approximation of it. Never mint. */}
        <WireMark size={17 * u} />
        <span
          style={{fontSize: 12 * u, letterSpacing: 0.22 * 12 * u, color: PALETTE.ink, opacity: 0.82}}
        >
          OPENSCOUT
        </span>
      </div>
      <span style={{fontSize: 10 * u, letterSpacing: 0.18 * 10 * u, color: PALETTE.inkFaint}}>
        {rate === 1 ? 'CAPTURE · REAL TIME' : `CAPTURE · ${rate.toFixed(1)}×`}
      </span>
    </div>
  )
}

const Footer: React.FC<{
  format: DaylightFormat
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
        fontSize: 10 * u,
        letterSpacing: 0.18 * 10 * u,
        color: PALETTE.inkFaint,
      }}
    >
      <span>{hostLabel}</span>
      <span style={{display: 'flex', alignItems: 'center', gap: 7 * u}}>
        {placed.chapters.map((chapter) => (
          <span
            key={chapter.numeral + chapter.index}
            style={{
              width: chapter.index === chapterIndex ? 20 * u : 11 * u,
              height: 2,
              borderRadius: 1,
              background: chapter.index === chapterIndex ? PALETTE.mint : PALETTE.hairline,
              opacity: chapter.index === chapterIndex ? 0.75 : 1,
            }}
          />
        ))}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail lens — a fixed slot, anchored by its top edge
// ---------------------------------------------------------------------------

/**
 * Anchored at the top rather than centred, so the panel's top edge and its
 * caption sit in exactly the same place in every chapter — only the panel's
 * depth varies with the rectangle's aspect.
 *
 * Two nested masks, rather than one composited pair: the outer element carries
 * the arrival wipe and the inner one the permanent soft edge. `mask-composite`
 * would do it in a single element, but nesting is legible and cannot be got
 * wrong by a vendor-prefix difference.
 *
 * The scale is applied about the slot's top centre, so a settling panel grows
 * downward out of its own top edge and its caption — which sits above that edge
 * and is not scaled — never moves.
 */
const DetailLens: React.FC<{
  placed: PlacedEdit
  chapter: number
  rect: LensRect
  width: number
  caption: string
  phase: ReturnType<typeof lensPhase>
  u: number
  align: 'left' | 'center'
}> = ({placed, chapter, rect, width, caption, phase, u, align}) => {
  const frame = useCurrentFrame()
  const scale = width / rect.w
  const height = rect.h * scale
  const radius = 13 * u

  const cuts = placed.cuts.filter((cut) => cut.chapter === chapter)
  // A soft 6% leading edge, so the panel opens rather than being unrolled by a
  // hard line. Clamped past 100% so a fully open panel carries no seam at all.
  const stop = phase.wipe * 106

  return (
    <div style={{position: 'relative', width, height}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: phase.opacity,
          transform: `scale(${phase.scale})`,
          transformOrigin: '50% 0%',
          maskImage: `linear-gradient(to bottom, #000 0%, #000 ${stop}%, rgba(0,0,0,0) ${stop + 6}%)`,
          WebkitMaskImage: `linear-gradient(to bottom, #000 0%, #000 ${stop}%, rgba(0,0,0,0) ${stop + 6}%)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            overflow: 'hidden',
            background: PALETTE.glass,
            boxShadow: `0 ${24 * u}px ${54 * u}px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.10)`,
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
            // The lens changes cuts on exactly the schedule the phone does, and
            // by exactly the same instrument — which is what carries the hinge:
            // the magnified `Mode` row is revealed from `Light` to `Dark` on the
            // same growing circle, at the same moment, as the panel behind it.
            const entry = cutEntry(cut, frame, SOURCE_WIDTH * scale, SOURCE_HEIGHT * scale)
            return (
              // The Sequence is load-bearing, not decoration. `OffthreadVideo`
              // resolves `startFrom` against the frame of its enclosing
              // Sequence; without one it reads the absolute composition frame,
              // so a play-cut in the lens seeks past the end of the source.
              <Sequence
                key={`lens-${chapter}-${i}`}
                from={start}
                durationInFrames={Math.max(1, end - start)}
                layout="none"
                name={`lens cut ${i}`}
              >
                <AbsoluteFill>
                  {/* The mask belongs on the full-source element, not on the
                      panel: the reveal's centre is given in source pixels, and
                      this is the element those pixels address. */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -rect.x * scale,
                      top: -rect.y * scale,
                      width: SOURCE_WIDTH * scale,
                      height: SOURCE_HEIGHT * scale,
                      opacity: entry.opacity,
                      maskImage: entry.maskImage,
                      WebkitMaskImage: entry.maskImage,
                    }}
                  >
                    <RedactedVideo
                      cut={cut}
                      w={SOURCE_WIDTH * scale}
                      h={SOURCE_HEIGHT * scale}
                      visible={{from: rect.y, to: rect.y + rect.h}}
                    />
                  </div>
                </AbsoluteFill>
              </Sequence>
            )
          })}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(168deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 34%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: -20 * u,
          opacity: phase.caption,
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          gap: 8 * u,
          fontFamily: MONO,
          fontSize: 10.5 * u,
          letterSpacing: 0.2 * 10.5 * u,
          color: PALETTE.inkFaint,
        }}
      >
        <span style={{width: 13 * u, height: 1, background: PALETTE.mint, opacity: 0.55}} />
        {caption}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Outro
// ---------------------------------------------------------------------------

/**
 * Four steps in order: mark and wordmark, the positioning line, the agent list,
 * the pilot tag. The positioning line is typed, the same way it was in the
 * opening — it is the film's spine, stated once on the way in and once on the
 * way out, and the reveal is what makes the rhyme audible.
 */
const Outro: React.FC<{
  format: DaylightFormat
  edit: MontageEdit
  u: number
  local: number
}> = ({format, edit, u, local}) => {
  const mark = clampInterpolate(local, [10, 34], [0, 1])
  const word = clampInterpolate(local, [22, 48], [0, 1])
  const rule = clampInterpolate(local, [36, 70], [0, 1])
  const foot = clampInterpolate(local, [74, 100], [0, 1])
  const tag = clampInterpolate(local, [88, 114], [0, 1])

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      <div style={{opacity: mark, marginBottom: 28 * u}}>
        <WireMark size={58 * u} />
      </div>
      <div
        style={{
          opacity: word,
          fontFamily: MONO,
          fontSize: 26 * u,
          fontWeight: 400,
          letterSpacing: 0.28 * 26 * u,
          paddingLeft: 0.28 * 26 * u,
          color: PALETTE.ink,
        }}
      >
        OPENSCOUT
      </div>
      <div
        style={{marginTop: 28 * u, width: 260 * u * rule, height: 1, background: PALETTE.hairline}}
      />
      <div
        style={{
          marginTop: 28 * u,
          fontFamily: SANS,
          fontSize: 28 * u,
          fontWeight: 400,
          letterSpacing: -0.014 * 28 * u,
          lineHeight: 1.3,
          color: PALETTE.ink,
          textAlign: 'center',
          maxWidth: format.width * 0.78,
        }}
      >
        <TypeReveal text={edit.outro.line} local={local - 48} stagger={0.9} ramp={7} />
      </div>
      <div
        style={{
          opacity: foot,
          marginTop: 36 * u,
          fontFamily: MONO,
          fontSize: 12 * u,
          letterSpacing: 0.2 * 12 * u,
          color: PALETTE.inkSoft,
          textAlign: 'center',
          maxWidth: format.width * 0.86,
          lineHeight: 1.7,
        }}
      >
        {edit.outro.foot}
      </div>
      <div
        style={{
          opacity: tag,
          marginTop: 26 * u,
          fontFamily: MONO,
          fontSize: 10.5 * u,
          letterSpacing: 0.22 * 10.5 * u,
          color: PALETTE.inkFaint,
          textAlign: 'center',
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

export const OpenScoutDaylight: React.FC<{format: DaylightFormat; edit: MontageEdit}> = ({
  format,
  edit,
}) => {
  const frame = useCurrentFrame()
  const placed = getPlacedEdit(edit)
  const {contentFrames, outroFrom, totalFrames} = placed
  const {width: W, height: H} = format
  const u = (Math.min(W, H) / 1080) * format.typeScale

  const preambleFrames = edit.preamble?.frames ?? 0

  const chapterIndex = Math.max(
    0,
    placed.chapters.findIndex((c) => frame >= c.from && frame < c.from + c.durationInFrames),
  )
  const chapter =
    placed.chapters[frame >= contentFrames ? placed.chapters.length - 1 : chapterIndex]
  // Negative through the whole preamble, which is what keeps the chapter type
  // and the lens off screen there without a second code path.
  const local = frame - chapter.from

  /**
   * The hinge. 1 is the graphite stage the light half plays on — the same lift
   * the operator's reference frames were rendered with — and 0 is the near-black
   * the dark half uses. It travels on the same frames as the picture dissolve
   * at chapter V, so the stage, the phone and the lens all turn together.
   */
  const tone =
    1 - clampInterpolate(frame, [DAYLIGHT_TURN.from, DAYLIGHT_TURN.to], [0, 1], EASE_REVEAL)

  const phase = chapter.lens ? lensPhase(local, chapter.lens.from, chapter.lens.to) : null

  // Device geometry — read straight off the format. There is nothing to
  // interpolate: this is the same framing in every chapter, in every format.
  const screenH = format.deviceH * H
  const screenW = screenH * SOURCE_ASPECT
  const deviceCx = format.deviceCx * W
  const deviceCy = format.deviceCy * H

  // The phone must never be on screen before it has something to show: the
  // first cut starts at `preambleFrames`, so the shell fades in from there
  // rather than under the tail of the opening lockup.
  const deviceIn = preambleFrames
    ? clampInterpolate(frame, [preambleFrames - 2, preambleFrames + 22], [0, 1])
    : 1
  const outroIn = clampInterpolate(frame, [outroFrom - 10, outroFrom + 34], [0, 1])
  const stageOpacity = deviceIn * (1 - outroIn)

  // The chapter's whole type block leaves before the picture does — see
  // CHOREOGRAPHY. On the last chapter the outro takes over instead.
  const typeOut =
    clampInterpolate(
      local,
      [
        chapter.durationInFrames - CHOREOGRAPHY.TYPE_OUT_LEAD,
        chapter.durationInFrames - CHOREOGRAPHY.TYPE_OUT_LEAD + CHOREOGRAPHY.TYPE_OUT_RAMP,
      ],
      [1, 0],
      EASE_DEPART,
    ) *
    (1 - outroIn) *
    // Nothing of the chapter column exists during the opening.
    (frame >= preambleFrames ? 1 : 0)

  const chromeOpacity = envelope(frame, preambleFrames + 2, contentFrames + 6, 20) * (1 - outroIn)

  const textW = format.textW * W
  const textLeft = format.textAlign === 'center' ? format.textX * W - textW / 2 : format.textX * W
  const lensW = format.lensW * W

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

      {frame < preambleFrames ? (
        <Preamble
          format={format}
          u={u}
          frame={frame}
          line={edit.preamble?.line ?? ''}
          frames={preambleFrames}
        />
      ) : null}

      {/* Device — locked. Same place, same size, every frame of the film. */}
      <AbsoluteFill style={{opacity: stageOpacity}}>
        <div
          style={{
            position: 'absolute',
            left: deviceCx,
            top: deviceCy,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <PhoneShell screenW={screenW} screenH={screenH} frame={frame}>
            <DaylightCaptureStack placed={placed} w={screenW} h={screenH} />
          </PhoneShell>
        </div>
      </AbsoluteFill>

      {/* Detail lens — fixed slot, top-anchored, present only when a chapter
          has something worth magnifying. */}
      {chapter.lens && phase && phase.opacity > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: format.lensCx * W - lensW / 2,
            top: format.lensTop * H,
            opacity: stageOpacity,
          }}
        >
          <DetailLens
            placed={placed}
            chapter={chapter.index}
            rect={chapter.lens.rect}
            width={lensW}
            caption={chapter.lens.caption}
            phase={phase}
            u={u}
            align={format.textAlign}
          />
        </div>
      ) : null}

      {/* Chapter type — fixed column, top-anchored. Typed in, faded out. */}
      <div style={{position: 'absolute', left: textLeft, top: format.textTop * H}}>
        <ChapterType
          numeral={chapter.numeral}
          verb={chapter.verb}
          line={chapter.line}
          sub={chapter.sub}
          align={format.textAlign}
          width={textW}
          u={u}
          titleScale={format.titleScale}
          local={local}
          out={typeOut}
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
        <Outro format={format} edit={edit} u={u} local={frame - outroFrom} />
      ) : null}

      <Vignette tone={tone} />

      <Audio
        src={staticFile(edit.score)}
        volume={(f) =>
          Math.min(
            clampInterpolate(f, [0, SCORE_FADE_IN], [0, 1]),
            clampInterpolate(f, [totalFrames - SCORE_FADE_OUT, totalFrames], [1, 0]),
          ) * edit.scoreGain
        }
      />
    </AbsoluteFill>
  )
}
