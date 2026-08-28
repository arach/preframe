// OpenScout Reimagined — refined composition.
//
// A sibling of `OpenScoutMontage`, not a replacement: that component still
// renders the two films kept for A/B comparison and is untouched apart from the
// primitives this module reuses (stage, phone shell, capture stack, wire mark),
// which are now exported rather than reimplemented here.
//
// Three things are genuinely different:
//
//  1. THE LAYOUT DOES NOT MOVE. `OpenScoutMontage` interpolates between a `base`
//     and a `lensed` layout state, which is what makes its titles travel upward
//     as a lens arrives. Here there is one standing composition per format —
//     phone, type column and lens slot are all fixed — and elements only fade in
//     and out of it. There is no `lerpLayout` call in this file, and no
//     transform on the type or the lens: opacity is the whole reveal vocabulary.
//
//  2. THERE IS AN OPENING. Two bars of brand breath before the product, handed
//     over by a crossfade rather than a cut.
//
//  3. THE TYPE IS QUIETER. A small mono index line for metadata, a sentence-case
//     title at a considered weight, and a soft explanatory line beneath it.
//     Mint carries rules and ticks only — never a word of the message.

import React from 'react'
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion'
import {
  getPlacedEdit,
  LensRect,
  MONO,
  MontageEdit,
  PALETTE,
  PlacedEdit,
  SANS,
  SOURCE_ASPECT,
  SOURCE_HEIGHT,
  SOURCE_WIDTH,
} from './edit'
import type {RefinedFormat} from './edit-refined'
import {
  CaptureStack,
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
// Opening
// ---------------------------------------------------------------------------

/**
 * The brand breath. Four elements, revealed in order and held, then taken away
 * together as the device comes up underneath.
 *
 * Nothing here moves. No orbit, no logo draw-on, no scale, no travel — the
 * ceremony is in the pacing and the spacing, which is what the first montage's
 * ending got right and what this film's opening was missing.
 */
const Preamble: React.FC<{
  format: RefinedFormat
  u: number
  frame: number
  line: string
  frames: number
}> = ({format, u, frame, line, frames}) => {
  const mark = clampInterpolate(frame, [10, 32], [0, 1])
  const word = clampInterpolate(frame, [22, 46], [0, 1])
  const rule = clampInterpolate(frame, [34, 66], [0, 1])
  const copy = clampInterpolate(frame, [42, 70], [0, 1])
  // The whole lockup leaves together, over the last ~0.7 s, while the phone
  // fades up beneath it.
  const out = clampInterpolate(frame, [frames - 22, frames - 2], [1, 0])

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
          // The tracking is applied to the right of every glyph, including the
          // last, so the word reads off-centre unless the trailing space is
          // pushed back.
          paddingLeft: 0.28 * 24 * u,
          color: PALETTE.ink,
        }}
      >
        OPENSCOUT
      </div>
      <div
        style={{
          marginTop: 30 * u,
          width: 240 * u * rule,
          height: 1,
          background: PALETTE.hairline,
        }}
      />
      <div
        style={{
          opacity: copy,
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
        {line}
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
  opacity: number
}> = ({numeral, verb, line, sub, align, width, u, titleScale, opacity}) => {
  // The explanatory line is pulled back far less than the headline: it is
  // already small, and at the square's 0.72 title scale a proportional cut would
  // have taken it under 13 px.
  const subScale = (1 + titleScale) / 2

  return (
    <div
      style={{
        width,
        opacity,
        textAlign: align,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {/* Index line. Mono, small, faint — metadata, not a headline. The numeral
          and verb used to run in mint at 0.26em; that read as HUD chrome rather
          than as an editorial folio. Mint is now on the tick alone. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10 * u,
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

      {/* Title. Sentence case, regular weight, tight tracking, open leading. */}
      <div
        style={{
          marginTop: 18 * u,
          fontFamily: SANS,
          fontSize: 34 * u * titleScale,
          lineHeight: 1.26,
          fontWeight: 400,
          letterSpacing: -0.02 * 34 * u * titleScale,
          color: PALETTE.ink,
        }}
      >
        {line}
      </div>

      {sub ? (
        <div
          style={{
            marginTop: 15 * u,
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
  format: RefinedFormat
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
  format: RefinedFormat
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
 * caption sit in exactly the same place in every chapter. Chapter rectangles
 * have very different aspect ratios — VIII is 1045×470, II is 1130×790 — and a
 * vertically centred panel would arrive at a different height each time, which
 * is precisely the "negotiating for position" the layout is meant to have
 * stopped doing. Only the panel's depth varies.
 */
const DetailLens: React.FC<{
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
  const radius = 13 * u

  const cuts = placed.cuts.filter((cut) => cut.chapter === chapter)

  return (
    <div style={{position: 'relative', width, height, opacity: amount}}>
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
          return (
            // The Sequence is load-bearing, not decoration. `OffthreadVideo`
            // resolves `startFrom` against the frame of its enclosing Sequence;
            // without one it reads the absolute composition frame, so a play-cut
            // in the lens seeks to startFrom + (absolute frame / fps) and runs
            // clean off the end of a 109.533 s source. Hold-cuts are wrapped in
            // `Freeze` and so are immune, which is exactly why this survived a
            // still-by-still layout check — every lens still happened to land on
            // a hold. It surfaced on the full render as a delayRender timeout
            // fetching t=114.567 s at frame 1173.
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
            background: 'linear-gradient(168deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 34%)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: -20 * u,
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
// Outro — the first montage's hierarchy
// ---------------------------------------------------------------------------

/**
 * Four steps, in the order the operator signed off on: mark and wordmark, the
 * positioning line, the agent list, the pilot tag. Revealed by opacity alone —
 * the only thing that moves in the whole lockup is the hairline drawing out.
 */
const Outro: React.FC<{
  format: RefinedFormat
  edit: MontageEdit
  u: number
  local: number
}> = ({format, edit, u, local}) => {
  const mark = clampInterpolate(local, [10, 34], [0, 1])
  const word = clampInterpolate(local, [22, 48], [0, 1])
  const rule = clampInterpolate(local, [36, 70], [0, 1])
  const line = clampInterpolate(local, [46, 74], [0, 1])
  const foot = clampInterpolate(local, [62, 88], [0, 1])
  const tag = clampInterpolate(local, [74, 100], [0, 1])

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
          opacity: line,
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
        {edit.outro.line}
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

export const OpenScoutRefined: React.FC<{format: RefinedFormat; edit: MontageEdit}> = ({
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

  const lensAmount = chapter.lens ? envelope(local, chapter.lens.from, chapter.lens.to, 16) : 0

  // Device geometry — read straight off the format. There is nothing to
  // interpolate: this is the same framing in every chapter, in every format.
  const screenH = format.deviceH * H
  const screenW = screenH * SOURCE_ASPECT
  const deviceCx = format.deviceCx * W
  const deviceCy = format.deviceCy * H

  // Handovers. The phone comes up under the tail of the opening lockup; the
  // stage recedes under the outro.
  // The phone must never be on screen before it has something to show. The
  // first cut starts at `preambleFrames`, so the shell fades in from there
  // rather than under the tail of the opening: an earlier pass began it 14
  // frames sooner and put an empty black-screened handset on the stage for half
  // a second, which reads as a missing asset, not as a handover.
  const deviceIn = preambleFrames
    ? clampInterpolate(frame, [preambleFrames - 2, preambleFrames + 22], [0, 1])
    : 1
  const outroIn = clampInterpolate(frame, [outroFrom - 10, outroFrom + 34], [0, 1])
  const stageOpacity = deviceIn * (1 - outroIn)

  const typeOpacity = envelope(local, 8, chapter.durationInFrames - 4, 14) * (1 - outroIn)
  const chromeOpacity =
    envelope(frame, preambleFrames + 2, contentFrames + 6, 20) * (1 - outroIn)

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
        tone={0}
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
            <CaptureStack placed={placed} w={screenW} h={screenH} />
          </PhoneShell>
        </div>
      </AbsoluteFill>

      {/* Detail lens — fixed slot, top-anchored, present only when a chapter
          has something worth magnifying. */}
      {chapter.lens && lensAmount > 0.001 ? (
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
            amount={lensAmount}
            u={u}
            align={format.textAlign}
          />
        </div>
      ) : null}

      {/* Chapter type — fixed column, top-anchored, opacity only. */}
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
          opacity={typeOpacity}
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

      <Vignette tone={0} />

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
