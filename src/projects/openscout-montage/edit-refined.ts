// OpenScout Reimagined — refined cut.
//
// The third film in the set, and the one that combines the first montage's
// ceremony and presentation with the reimagined era's footage, locked phone and
// improved assets. `edit-reimagined.ts` and the two V3 edits are untouched and
// still render; this module is additive so all three can be compared A/B.
//
// WHAT CHANGED, AND WHY
//
//  1. AN AUTHORED OPENING. The reimagined cut starts cold, already inside the
//     product. Two bars are now reserved ahead of chapter I for a brand breath:
//     mark, wordmark, a rule that draws, and the positioning line. No orbit, no
//     logo animation — it fades up, sits, and hands over to the product.
//
//  2. THE LAYOUT IS LOCKED. `REFINED_FORMATS` has ONE layout state per format,
//     not a `base`/`lensed` pair to travel between. In the reimagined cut the
//     titles began centred and slid up as the lens arrived — flagged in the
//     production notes as a known characteristic; the operator has now called it
//     out directly. Here the phone, the type column and the lens slot are all
//     fixed. Elements fade in and out of a standing composition; nothing
//     recenters or negotiates for position.
//
//  3. TITLE PLUS EXPLANATION. Every chapter carries a title and a short
//     explanatory line naming what is literally on screen, in one fixed column.
//
//  4. THE ESTABLISHED POSITIONING. The outro drops "A command surface for the
//     agents already working." for the first montage's stronger, accurate line
//     and its four-step hierarchy.
//
//  5. THE SCORE IS UNCHANGED. Same asset, same gain, same 55.000 s runtime.
//     See the grid note below — this is why the opening had to be paid for.
//
// GRID — the score is fixed, so the opening is bought, not added
//
// The bed is 144 BPM: one bar is exactly 50 frames at 30 fps, and the master is
// 55.000 s = 1650 frames = 33 bars to the sample. The opening therefore cannot
// extend the film; its two bars are taken out of picture. Chapters I and IX are
// each shortened by one bar — I because the preamble now does its arrival work,
// IX because three bars of a lens-free bookend was the loosest passage in the
// cut. Every other chapter keeps its exact source window.
//
//   2 preamble
//   + 2 + 3 + 3 + 3 + 4 + 3 + 3 + 4 + 2  = 27 bars content
//   + 4 outro
//   = 33 bars = 1650 frames = 55.000 s, unchanged.
//
// Every boundary still lands on a downbeat: 100 / 200 / 350 / 500 / 650 / 850 /
// 1000 / 1150 / 1350 / 1450 / 1650.
//
// SOURCE
//
// Unchanged from `edit-reimagined.ts`: every frame comes from
// `openscout-reimagined-dark-device-master-cfr30.mp4` (1178×2556, 109.533 s,
// CFR 30), and every window below is one the frame-accurate source audit already
// verified. The two audit findings still hold — there is no "Split" presentation
// in this build, and the two conversation passages are pixel-identical — so
// chapter VIII plays the four real values and the bookend claims nothing more
// than being the same thread.

import type { Chapter, MontageEdit } from './edit'

const CHAPTERS: readonly Chapter[] = [
  {
    // 100–200 · 2 bars. One bar shorter than the reimagined cut: the preamble
    // has already done the arriving, so this beat only has to be looked at.
    numeral: 'I',
    verb: 'COMMAND',
    line: 'One surface for the agents already working.',
    sub: 'A reply lands in the thread, with its receipt.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 1.0,
        sourceEnd: 4.0,
        rate: 1,
        note: 'talkie-epicurus — the agent reply and its receipt',
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 3.95,
        durationInFrames: 10,
        note: 'hold on the answered thread',
      },
    ],
    // Unchanged rectangle, retimed for the shorter chapter. The top edge sits
    // below the bubble's first line on purpose: at y=420 the receipt landed
    // inside the panel's 5% bottom mask and rendered as a ghost.
    lens: {
      rect: { x: 180, y: 468, w: 980, h: 686 },
      from: 22,
      to: 92,
      caption: 'AGENT · RESPONDED',
    },
  },
  {
    // 200–350 · 3 bars. The broker index is only clean for ~0.85 s: the push
    // transition settles at 13.45 and the capture leaves for For You at 14.33.
    numeral: 'II',
    verb: 'INDEX',
    line: 'Every conversation, one broker.',
    sub: 'Names, last messages, and how long ago.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 13.45,
        sourceEnd: 14.283333,
        rate: 1,
        note: 'Scout broker — the conversation index',
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 14.25,
        durationInFrames: 125,
        note: 'hold on the broker index',
      },
    ],
    lens: {
      rect: { x: 25, y: 360, w: 1130, h: 790 },
      from: 28,
      to: 140,
      caption: 'SCOUT BROKER',
    },
  },
  {
    // 350–500 · 3 bars
    numeral: 'III',
    verb: 'SEE',
    line: 'See what is working, right now.',
    sub: 'Sessions running now, across hosts and agents.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 14.55,
        sourceEnd: 16.45,
        rate: 1,
        note: 'For You — WORKING NOW across hosts and agents',
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 16.4,
        durationInFrames: 93,
        note: 'hold on the working-now feed',
      },
    ],
    lens: {
      rect: { x: 30, y: 490, w: 1120, h: 780 },
      from: 28,
      to: 140,
      caption: 'WORKING NOW',
    },
  },
  {
    // 500–650 · 3 bars
    numeral: 'IV',
    verb: 'START',
    line: 'Start from a host and a project.',
    sub: 'One machine, its projects, and the composer.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 16.75,
        sourceEnd: 18.75,
        rate: 1,
        note: 'new session — host, projects, composer',
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 18.7,
        durationInFrames: 90,
        note: 'hold before the picker opens',
      },
    ],
    lens: {
      rect: { x: 30, y: 1310, w: 1120, h: 780 },
      from: 30,
      to: 140,
      caption: 'HOST · PROJECT',
    },
  },
  {
    // 650–850 · 4 bars. The real selection happens at 22.498: the dot moves from
    // Claude · Opus 5 (DEFAULT) to Codex · Sonnet 4.6 and the composer chip
    // changes with it. The window sits either side of that frame so the change is
    // watched rather than asserted.
    numeral: 'V',
    verb: 'CHOOSE',
    line: 'Pick the agent, the model, the effort.',
    sub: 'The agent, its model, and the effort it spends.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 20.9,
        sourceEnd: 24.5,
        rate: 1,
        note: 'agent/model picker — Opus 5 → Sonnet 4.6, effort on MEDIUM',
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 24.45,
        durationInFrames: 92,
        note: 'hold on the chosen agent and effort',
      },
    ],
    lens: {
      rect: { x: 40, y: 1170, w: 1100, h: 770 },
      from: 34,
      to: 188,
      caption: 'AGENT · MODEL · EFFORT',
    },
  },
  {
    // 850–1000 · 3 bars. Five continuous seconds of the Tail, played straight. It
    // scrolls on its own from ~41.9, so this beat needs no hold and no rate
    // change: the surface supplies the motion.
    numeral: 'VI',
    verb: 'OBSERVE',
    line: 'Watch the work as it happens.',
    sub: 'Reasoning, tool calls, results — as they land.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 40.35,
        sourceEnd: 45.35,
        rate: 1,
        note: 'live Tail — reasoning, tool calls, results, task complete',
      },
    ],
    lens: {
      rect: { x: 30, y: 620, w: 1120, h: 780 },
      from: 26,
      to: 140,
      caption: 'LIVE TAIL',
    },
  },
  {
    // 1000–1150 · 3 bars
    numeral: 'VII',
    verb: 'BROWSE',
    line: 'Every project. Every workspace.',
    sub: 'Each with its host, agent, and last activity.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 45.6,
        sourceEnd: 49.2,
        rate: 1,
        note: 'projects · workspaces — host, agents, last active',
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 49.15,
        durationInFrames: 42,
        note: 'hold on the workspace inventory',
      },
    ],
    lens: {
      rect: { x: 25, y: 490, w: 1130, h: 790 },
      from: 28,
      to: 140,
      caption: 'PROJECTS · WORKSPACES',
    },
  },
  {
    // 1150–1350 · 4 bars. The film's centre of gravity. The CHAT inspector
    // arrives at 75.498 and the Presentation row then cycles the product's own
    // values, each with its own descriptor:
    //
    //   75.498 – 77.166   Scout      · "focused paper-and-ink"
    //   77.332 – 78.664   Messages   · "compact familiar…"
    //   78.830 – 80.166   WhatsApp   · "warm conversation…"
    //   80.332 –          Original   · "Scout's native con…"
    //
    // All four read off the source at 6 fps. There is no Split value in this
    // build, so the beat plays the four the product really offers.
    numeral: 'VIII',
    verb: 'PRESENT',
    line: 'Read it the way you read best.',
    sub: 'Scout, Messages, WhatsApp, Original.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 75.45,
        sourceEnd: 81.15,
        rate: 1,
        note: 'settings · Chat — Presentation cycles Scout, Messages, WhatsApp, Original',
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 81.1,
        durationInFrames: 29,
        note: 'hold on Original',
      },
    ],
    // Wide enough to clear the per-row revert glyphs at x≈1130, which a
    // 1000-wide rect sliced in half.
    lens: {
      rect: { x: 100, y: 496, w: 1045, h: 470 },
      from: 20,
      to: 190,
      caption: 'PRESENTATION',
    },
  },
  {
    // 1350–1450 · 2 bars. Deliberately lens-free: the film has been magnifying
    // detail for eight chapters and the payoff is the whole surface, quiet,
    // before the mark. One bar shorter than the reimagined cut — at three bars
    // this was the loosest passage in the film, and it is where the opening's
    // second bar came from.
    numeral: 'IX',
    verb: 'RETURN',
    line: 'Then back to the work.',
    sub: 'The thread, where it started.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 96.35,
        sourceEnd: 99.683333,
        rate: 1,
        note: 'back to talkie-epicurus — the thread, whole',
      },
    ],
  },
] as const

export const EDIT_REFINED: MontageEdit = {
  id: 'openscout-refined',
  slug: 'Refined',
  chapters: CHAPTERS,
  // UNCHANGED, and deliberately so. The operator's correction of 2026-08-13 is
  // binding: the latest reimagined score is the better cue and stays exactly as
  // it is. Same asset, same gain, same 55.000 s length — no re-cut, no re-master,
  // no new generation. It is the fixed quantity this edit was built around.
  score: 'tracks/openscout/openscout-reimagined-score.wav',
  scoreGain: 0.92,
  dissolve: 12,
  outroFrames: 200,
  // The capture names its own host on screen.
  hostLabel: 'iOS · ARACHS MAC MINI',
  preamble: {
    frames: 100,
    line: 'A local-first control plane for coding agents.',
  },
  // The first montage's hierarchy, restored. The vague "command surface" line is
  // gone; this is the accurate positioning and the exact agent list the operator
  // signed off on.
  outro: {
    line: 'A local-first control plane for coding agents.',
    foot: 'CLAUDE · CODEX · GROK · KIMI — ON YOUR OWN MACS',
    tag: 'EARLY · LOCAL DEVELOPER PILOTS',
  },
}

// ---------------------------------------------------------------------------
// Formats — one locked layout each
// ---------------------------------------------------------------------------

/**
 * A single standing composition per aspect ratio. There is no `base`/`lensed`
 * pair here on purpose: the shared `Format` in `edit.ts` carries two layout
 * states and interpolates between them, which is what made the reimagined cut's
 * titles travel. This type cannot express that.
 *
 * Both the type column and the lens slot are anchored by their TOP edge rather
 * than their centre. That matters: chapter rectangles have different aspect
 * ratios (VIII is 1045×470, II is 1130×790), so a centred lens would sit at a
 * different height in every chapter. Anchored at the top, the panel's top edge
 * and its caption are in exactly the same place all film — only the panel's
 * depth changes. The same applies to the type column, where a two-line title
 * would otherwise shift a three-line one.
 *
 * The device fields are the reimagined cut's, unchanged. The operator's
 * direction is that the phone placement is good and stays locked.
 */
export type RefinedFormat = {
  id: string
  label: string
  width: number
  height: number

  /** Device — locked. Identical framing all film, no per-chapter pose. */
  deviceH: number
  deviceCx: number
  deviceCy: number

  /** Type column — fixed, top-anchored. */
  textAlign: 'left' | 'center'
  /** Left edge when left-aligned; centre when centred. */
  textX: number
  textTop: number
  textW: number
  /** Headline size multiplier, so a narrow column can quieten its title. */
  titleScale: number

  /** Detail lens — a fixed preallocated slot, top-anchored. Empty in ch. IX. */
  lensW: number
  lensCx: number
  lensTop: number

  headerY: number
  footerY: number
  margin: number
  typeScale: number
}

export const REFINED_FORMATS: readonly RefinedFormat[] = [
  {
    id: 'Landscape',
    label: 'landscape master',
    width: 1920,
    height: 1080,
    deviceH: 0.845,
    deviceCx: 0.3,
    deviceCy: 0.5,
    // Type and lens share one editorial column: both start at x=0.545 and are
    // 0.40 wide, so their left and right edges line up exactly. The column's
    // right edge lands at 1814 against a stage margin of 100 — near enough
    // symmetric with the left.
    textAlign: 'left',
    textX: 0.545,
    textTop: 0.175,
    textW: 0.4,
    titleScale: 1,
    lensW: 0.4,
    lensCx: 0.745,
    // 0.385, not 0.40: at 0.40 the deepest rectangles (V's 1100×770, II's
    // 1130×790) bottomed out ~45 px above the footer while ~120 px of dead space
    // sat between the type column and the lens caption. Verified on stills.
    lensTop: 0.385,
    headerY: 0.058,
    footerY: 0.942,
    margin: 0.052,
    typeScale: 1,
  },
  {
    id: 'Vertical',
    label: 'vertical social',
    width: 1080,
    height: 1920,
    deviceH: 0.46,
    deviceCx: 0.5,
    deviceCy: 0.3,
    // Stacked: phone (ends at y≈1018), then the title column, then the lens.
    // The title reads before the detail it introduces. `titleScale` pulls the
    // headline back from the 1.34 type scale, which is sized for the mono
    // metadata and is too loud on a 43-character line.
    textAlign: 'center',
    textX: 0.5,
    // 0.555 = 1066 px. The device's own bottom edge is at 1030, not the 1018 the
    // screen height alone implies — `PhoneShell` adds a 12 px bezel on each side.
    // At 0.525 the chapter's index line printed across the phone's bottom bezel;
    // caught on a rendered still.
    textTop: 0.555,
    textW: 0.82,
    titleScale: 0.86,
    // 0.64 rather than the reimagined cut's 0.74: the tallest rectangle
    // (1130×790) is 483 px deep at this width and lands 49 px clear of the
    // footer. At 0.74 it collided with it.
    lensW: 0.64,
    lensCx: 0.5,
    lensTop: 0.675,
    headerY: 0.045,
    footerY: 0.962,
    margin: 0.062,
    typeScale: 1.34,
  },
  {
    id: 'Square',
    label: 'square social',
    width: 1080,
    height: 1080,
    deviceH: 0.7,
    deviceCx: 0.265,
    deviceCy: 0.5,
    // The narrowest type column in the set (475 px), so the headline is pulled
    // well back — at full size a 43-character title broke to four lines.
    textAlign: 'left',
    textX: 0.485,
    textTop: 0.155,
    textW: 0.44,
    titleScale: 0.72,
    lensW: 0.44,
    lensCx: 0.705,
    lensTop: 0.43,
    headerY: 0.062,
    footerY: 0.938,
    margin: 0.062,
    typeScale: 1.16,
  },
] as const
