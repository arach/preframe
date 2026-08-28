// OpenScout — daylight cut.
//
// The fourth film in the set, and a preserved iteration rather than a patch:
// `edit-a.ts`, `edit-b.ts`, `edit-reimagined.ts` and `edit-refined.ts` are all
// untouched and still render exactly as they did. This module is additive so
// every earlier treatment stays reviewable.
//
// WHAT THIS ITERATION IS FOR
//
// The refined cut opens cold, already inside the product, already dark. The
// operator's direction of 2026-08-13 is that the film should first meet the
// product in daylight — the airy host/agent overview, then the settings surface
// that says the app is yours to configure — and only afterwards turn dark, as a
// deliberate transformation rather than as the default first impression.
//
// So the story is now told in two halves with a hinge between them:
//
//   BRAND       a two-bar breath — mark, wordmark, rule, positioning line
//   ── light ────────────────────────────────────────────────────────────
//   I   CONNECT       your Macs, discovered and online
//   II  PERSONALIZE   make it yours — light or dark
//   III CONVERSE      an agent answers, with its finding
//   IV  DISPATCH      start work on a host and a project
//   ── the hinge ─────────────────────────────────────────────────────────
//   V   TRANSFORM     the same settings panel, flipped to dark
//   ── dark ─────────────────────────────────────────────────────────────
//   VI  CHOOSE        the agent, the model, the effort
//   VII OBSERVE       the live tail
//   VIII PRESENT      the real Presentation control
//   IX  RETURN        back to the thread
//   BRAND       the off-white mark and the payoff hierarchy
//
// Chapter II states the promise ("light or dark") on the product's own Mode row
// and does not cash it; chapter V returns to that exact row and cashes it. The
// film keeps its own promise, which is why the turn is a chapter of its own
// rather than a dissolve tucked inside another beat.
//
// WHAT IS CARRIED OVER UNCHANGED
//
//  · THE SCORE. Same asset, same gain, same 55.000 s. Not re-cut, not
//    re-mastered, not regenerated — the operator's correction of 2026-08-13
//    stands and the latest reimagined cue is the fixed quantity this edit was
//    built around. It is why the grid below has to balance to 33 bars exactly.
//  · THE SPATIAL COMPOSITION. One locked layout per format: a full, fixed
//    phone, a stable title-and-explanation column, and a preallocated detail
//    lens slot. No `base`/`lensed` pair, so nothing can travel between states.
//  · THE OFF-WHITE MARK. `PALETTE.mark` = #F7F4EA. There is no green logo.
//
// SOURCES — two captures, and why that is honest here
//
// The light half comes from `openscout-nav-light-v3-cfr30.mp4` and the dark half
// from `openscout-reimagined-dark-device-master-cfr30.mp4`. These are captures a
// day apart of the same architecture, not two product eras: both carry the same
// `All hosts` header, the same `For you` · `WORKING NOW` feed, the same
// `SCOUT · SETTINGS` inspector with its lettered rail, the same
// `HOST · Arachs Mac mini` composer and the same tab bar. Verified frame by
// frame on contact sheets before a line of this edit was written.
//
// The hinge depends on that: the light `INSPECTOR · APPEARANCE` panel and the
// dark one register to the pixel — `CANVAS`, `Mode`, `Tone`, `NAVIGATION` and
// `Style` all sit on identical source rows — so the cross-dissolve at chapter V
// reads as one panel inverting rather than as two different screens.
//
// Two honest differences across the hinge, neither of them load-bearing:
// the inspector rail is ordered differently between the captures (the highlight
// therefore sits at a different height on the rail), and the last row reads
// `v3 navigation (experimen…` in light against `Fleet navigation · home · ch…`
// in dark. Both are outside the lens rectangle at chapter V, which sits on the
// `Mode` row alone.
//
// GRID — the score is fixed, so every bar is spent, not added
//
// The bed is 144 BPM: one bar is exactly 50 frames at 30 fps and the master is
// 55.000 s = 1650 frames = 33 bars to the sample.
//
//   2 preamble
//   + 3 + 3 + 3 + 3 + 3 + 3 + 3 + 4 + 2  = 27 bars content
//   + 4 outro
//   = 33 bars = 1650 frames = 55.000 s.
//
// Every boundary lands on a downbeat: 100 / 250 / 400 / 550 / 700 / 850 /
// 1000 / 1150 / 1350 / 1450 / 1650.
//
// DISPATCH ran at 2 bars in the first build and CHOOSE at 4. That was wrong in
// both directions, and it showed on rendered stills: at 2 bars DISPATCH's
// explanatory line reached full opacity about a frame before the chapter began
// taking it away again, so it read as a flicker rather than as a line; and
// CHOOSE's fourth bar was a pure hold on a picker that had already finished
// moving. The bar was moved from the one to the other. CHOOSE still plays its
// whole interaction — the selection change at 22.498 is inside the play window,
// not the hold — so nothing was lost to pay for it.

import type {Chapter, MontageEdit} from './edit'

/**
 * The `System` row in the light For You feed, in source pixels, measured on a
 * gridded full-resolution frame at t=5.000 s.
 *
 * `from` is the hairline above the row, `to` the hairline below it, and `floor`
 * the top of the tab bar — the bottom of the scrolling region. The rows beneath
 * close up by the 275 px the block occupied; the tab bar and the status footer
 * do not move. The 275 px this frees at the bottom of the scroll region was
 * already empty surface in the capture, so nothing is invented to fill it.
 *
 * See `Redaction` in `edit.ts` for why this is here at all.
 */
const FEED_REDACTION = {from: 1244, to: 1519, floor: 2291} as const

const CHAPTERS: readonly Chapter[] = [
  {
    // 100–250 · 3 bars. The film's first product frame, and the one the operator
    // supplied as a visual reference. The feed is pixel-static across this whole
    // window, so the beat is played straight at 1× rather than held: there is
    // nothing to hold away from.
    numeral: 'I',
    verb: 'CONNECT',
    line: 'Your Macs, discovered and online.',
    sub: 'Hosts, agents, and what is running now.',
    cuts: [
      {
        kind: 'play',
        source: 'light',
        sourceStart: 3.0,
        sourceEnd: 8.0,
        rate: 1,
        note: 'light For You — WORKING NOW, the fleet reporting in',
        redact: FEED_REDACTION,
      },
    ],
    // Deliberately stops above the redacted block: the lens reads the running
    // session card and lavoisier's finding, which is the part of the feed that
    // carries the story. Top edge at 455 keeps `WORKING NOW` clear of the
    // panel's 5% top mask; bottom at 1045 keeps lavoisier's last line clear of
    // the bottom one.
    lens: {
      rect: {x: 26, y: 455, w: 1126, h: 590},
      from: 30,
      to: 130,
      caption: 'WORKING NOW',
    },
  },
  {
    // 250–400 · 3 bars. The promise, stated on the product's own Mode row and
    // deliberately not cashed here. `INSPECTOR · APPEARANCE` is clean from
    // 75.10 to 82.80; the window sits well inside that.
    numeral: 'II',
    verb: 'PERSONALIZE',
    line: 'Make it yours — light or dark.',
    sub: 'Mode, tone and navigation, in Settings.',
    cuts: [
      {
        kind: 'play',
        source: 'light',
        sourceStart: 76.0,
        sourceEnd: 81.0,
        rate: 1,
        note: 'light settings · Appearance — Mode Light, Tone Warm, Style Tabs',
      },
    ],
    // The CANVAS block plus its inspector header. Wider than chapter V's, and
    // higher, so the two appearance beats do not read as the same shot twice.
    lens: {
      rect: {x: 140, y: 350, w: 1010, h: 520},
      from: 30,
      to: 130,
      caption: 'CANVAS',
    },
  },
  {
    // 400–550 · 3 bars. The conversation is clean from 23.60 to 30.70 — it
    // arrives out of a white transition at 23.5 and the contact sheet starts
    // rising at 30.9.
    numeral: 'III',
    verb: 'CONVERSE',
    line: 'An agent answers in the thread.',
    sub: 'The question, the finding, and the root cause.',
    cuts: [
      {
        kind: 'play',
        source: 'light',
        sourceStart: 24.2,
        sourceEnd: 29.2,
        rate: 1,
        note: 'light thread — Openscout Agent returns a diagnosis and its root cause',
      },
    ],
    // Sits on the reply card: the quoted request, the diagnosis, and the first
    // lines of ROOT CAUSE. Stops above the truncated tail and `Read more`, which
    // magnify badly.
    lens: {
      rect: {x: 120, y: 960, w: 1020, h: 580},
      from: 28,
      to: 130,
      caption: 'AGENT · DIAGNOSIS',
    },
  },
  {
    // 550–700 · 3 bars. The composer is clean from 101.00 to 105.20; it arrives
    // out of the Shell view at 100.7 and the capture leaves for the feed at
    // 105.5. The play therefore stays inside the verified middle and the beat
    // holds out its last bar on a frame half a second clear of the change.
    numeral: 'IV',
    verb: 'DISPATCH',
    // Not "any of your Macs": the capture shows one host, `1/1 online`. The
    // fleet framing is already carried by chapter I and by the `All hosts`
    // header; this beat claims only what its own frame shows.
    line: 'Start from a host and a project.',
    sub: 'The host, its 68 projects, and the composer.',
    cuts: [
      {
        kind: 'play',
        source: 'light',
        sourceStart: 101.4,
        sourceEnd: 104.733333,
        rate: 1,
        note: 'light new session — HOST Arachs Mac mini, 68 projects, Opus 5 · AUTO',
      },
      {
        kind: 'hold',
        source: 'light',
        holdAt: 104.7,
        durationInFrames: 50,
        note: 'hold on the composer, ready to send',
      },
    ],
    // Projects, the inventory line and the composer with its model chip. The
    // HOST label above is left out on purpose: including it made the rectangle
    // tall enough (1140×850) to bring the panel within 28 px of the footer in
    // landscape.
    lens: {
      rect: {x: 20, y: 1380, w: 1140, h: 780},
      from: 26,
      to: 130,
      caption: 'HOST · PROJECT · MODEL',
    },
  },
  {
    // 700–850 · 3 bars. THE HINGE.
    //
    // Two bars of the light Appearance panel, then a full second of eased
    // cross-dissolve onto the dark one, then a bar holding there. Both windows
    // show `Style · Tabs` and `Tone · Warm`, so `Mode` is the only value that
    // changes across the dissolve — the panel inverts around one setting.
    //
    // The dark panel is clean with `Style · Tabs` from 72.30 to 73.50 only: the
    // capture flips Style to `Crown` at 73.67. The hold therefore sits at 73.35,
    // before that change, so the beat does not appear to alter two settings at
    // once.
    //
    // The stage tone turns with the picture rather than across the chapter —
    // see `DAYLIGHT_TURN` below.
    numeral: 'V',
    verb: 'TRANSFORM',
    line: 'Then turn the whole surface dark.',
    sub: 'The same panel, the same rows — one setting.',
    cuts: [
      {
        kind: 'play',
        source: 'light',
        sourceStart: 77.0,
        sourceEnd: 79.0,
        rate: 1,
        note: 'light settings · Appearance — Mode Light',
      },
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 72.4,
        sourceEnd: 73.4,
        rate: 1,
        note: 'dark settings · Appearance — the same panel, Mode Dark',
        // A full second, against the film's 16-frame house dissolve. This is the
        // one transition in the cut that is meant to be watched rather than
        // absorbed.
        fade: 30,
        // Revealed, not dissolved. Cross-fading a white panel onto a black one
        // spends its midpoint as a flat grey slab with both sets of rows ghosted
        // through each other — checked on a rendered still at frame 725 before
        // this was changed. The reveal grows from the `Mode` row's own value
        // chip, measured at (1005, 641) in source pixels on a gridded frame, so
        // the dark surface spreads out of the control that changed it.
        enter: {kind: 'radial', cx: 1005, cy: 641},
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 73.35,
        durationInFrames: 60,
        note: 'hold on Mode · Dark, before the capture changes Style',
      },
    ],
    // The CANVAS rows, wide and shallow, so `Light` → `Dark` is the visible
    // event and `Warm` staying `Warm` beneath it is the control. Deliberately
    // excludes the inspector rail, whose ordering differs between the two
    // captures, and sits over the point the reveal grows from.
    lens: {
      rect: {x: 140, y: 545, w: 1010, h: 280},
      from: 20,
      to: 134,
      caption: 'MODE · LIGHT → DARK',
    },
  },
  {
    // 850–1000 · 3 bars. The real selection happens at 22.498: the dot moves
    // from Claude · Opus 5 (DEFAULT) to Codex · Sonnet 4.6 and the composer chip
    // changes with it. The play window is the refined cut's and still sits
    // either side of that frame, so the change is watched rather than asserted;
    // only the hold after it is shorter, and it was holding on a picker that had
    // already stopped moving. The rectangle is the refined cut's, unchanged.
    numeral: 'VI',
    verb: 'CHOOSE',
    line: 'Pick the agent, the model, the effort.',
    sub: 'Claude, Codex, Grok, Kimi — and how hard they think.',
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
        durationInFrames: 42,
        note: 'hold on the chosen agent and effort',
      },
    ],
    lens: {
      rect: {x: 40, y: 1170, w: 1100, h: 770},
      from: 30,
      to: 130,
      caption: 'AGENT · MODEL · EFFORT',
    },
  },
  {
    // 1000–1150 · 3 bars. Five continuous seconds of the Tail, played straight.
    // It scrolls on its own from ~41.9, so this beat needs no hold and no rate
    // change: the surface supplies the motion.
    numeral: 'VII',
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
      rect: {x: 30, y: 620, w: 1120, h: 780},
      from: 26,
      to: 130,
      caption: 'LIVE TAIL',
    },
  },
  {
    // 1150–1350 · 4 bars. The Presentation row cycles the product's own values,
    // each with its own descriptor:
    //
    //   75.498 – 77.166   Scout      · "focused paper-and-ink"
    //   77.332 – 78.664   Messages   · "compact familiar…"
    //   78.830 – 80.166   WhatsApp   · "warm conversation…"
    //   80.332 –          Original   · "Scout's native con…"
    //
    // There is no Split value in this build, so the beat plays the four the
    // product really offers. Source window and rectangle are the refined cut's.
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
    lens: {
      rect: {x: 100, y: 496, w: 1045, h: 470},
      from: 20,
      to: 182,
      caption: 'PRESENTATION',
    },
  },
  {
    // 1350–1450 · 2 bars. Deliberately lens-free: the film has been magnifying
    // detail for eight chapters and the payoff is the whole surface, quiet,
    // before the mark.
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

/**
 * The hinge, in absolute composition frames.
 *
 * Chapter V runs 700–850 and its reveal of the dark capture runs 760–790.
 * The stage tone travels on exactly those frames, so the whole frame turns with
 * the picture instead of drifting across the chapter — `Chapter.stageTone`
 * interpolates linearly over a chapter and could not express this.
 *
 * Before it the stage is `PALETTE.stageLift`, the graphite the earlier light
 * treatment used and the operator's reference frames were rendered on; after it
 * the stage is `PALETTE.stage`, the near-black the dark films use.
 */
export const DAYLIGHT_TURN = {from: 760, to: 790} as const

export const EDIT_DAYLIGHT: MontageEdit = {
  id: 'openscout-daylight',
  slug: 'Daylight',
  chapters: CHAPTERS,
  // UNCHANGED, and deliberately so. Same asset, same gain, same 55.000 s length
  // as the reimagined and refined cuts — no re-cut, no re-master, no new
  // generation. Asserted against `EDIT_REFINED` in validation rather than
  // claimed here.
  score: 'tracks/openscout/openscout-reimagined-score.wav',
  scoreGain: 0.92,
  // 16 rather than the refined cut's 12: the chapter choreography now takes the
  // type and the lens out before the picture changes, and a slightly longer
  // picture dissolve keeps the boundary from arriving early against them.
  dissolve: 16,
  outroFrames: 200,
  // Both captures name this host on screen.
  hostLabel: 'iOS · ARACHS MAC MINI',
  preamble: {
    frames: 100,
    line: 'A local-first control plane for coding agents.',
  },
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
 * Identical in shape to `RefinedFormat`, and identical in value: the operator's
 * direction is that the refined cut's spatial composition works and is to be
 * kept, so the phone placement, the type column and the lens slot are carried
 * over unchanged in all three formats.
 *
 * It is redeclared here rather than imported so that a future change to this
 * film's layout cannot silently move the refined film, which still renders and
 * is still the comparison this one is reviewed against.
 *
 * Both the type column and the lens slot are anchored by their TOP edge. That
 * is what actually holds the composition still: chapter rectangles have very
 * different aspect ratios (V's is 1010×280, IV's is 1140×780), so a vertically
 * centred lens would arrive at a different height in every chapter.
 */
export type DaylightFormat = {
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
  textX: number
  textTop: number
  textW: number
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

export const DAYLIGHT_FORMATS: readonly DaylightFormat[] = [
  {
    id: 'Landscape',
    label: 'landscape master',
    width: 1920,
    height: 1080,
    deviceH: 0.845,
    deviceCx: 0.3,
    deviceCy: 0.5,
    textAlign: 'left',
    textX: 0.545,
    textTop: 0.175,
    textW: 0.4,
    titleScale: 1,
    lensW: 0.4,
    lensCx: 0.745,
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
    textAlign: 'center',
    textX: 0.5,
    textTop: 0.555,
    textW: 0.82,
    titleScale: 0.86,
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
