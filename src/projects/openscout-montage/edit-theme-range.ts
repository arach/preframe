// OpenScout — theme range. Edit core for the A/B score test.
//
// This module is deliberately self-contained rather than built on `edit.ts`.
// That module's whole geometry is a 1178×2556 phone held on a stage; this film
// is a 1514×1072 desktop capture of one settings surface. Sharing it would mean
// bending every constant in it, so the two live side by side and share nothing
// but the palette idea and the wire mark.
//
// ---------------------------------------------------------------------------
// THE ONE RULE OF THIS FILM
// ---------------------------------------------------------------------------
//
// There is ONE picture. `THEME_RANGE_EDIT` below is the complete visual edit —
// cuts, timing, typography, lens, grade, transitions — and it is frozen. The two
// deliverables are `EDIT_THEME_RANGE_BEAT` and `EDIT_THEME_RANGE_DRIFT`, which
// are that same object with a different `score` and `scoreGain`. Nothing else
// may differ, and `validate-openscout-theme-range.ts` proves it two ways: by
// diffing the two edit objects field by field, and by hashing every rendered
// video frame of both MP4s.
//
// If you are tempted to give one film a different cut, make a third edit. Do not
// widen the A/B.
//
// ---------------------------------------------------------------------------
// SOURCE
// ---------------------------------------------------------------------------
//
// One capture, normalised to constant 60 fps with dense keyframes so every
// `sourceStart` below lands on the frame it names:
//
//   ffmpeg -i theme-range.mp4 -vf fps=60 -c:v libx264 -crf 14 -preset slow \
//     -g 30 -keyint_min 30 -sc_threshold 0 -pix_fmt yuv420p \
//     -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
//     -movflags +faststart -an openscout-theme-range-cfr60.mp4
//
// 60 fps, not the house 30. The source is a 60 fps browser capture of an
// interface whose whole subject is a colour transition; decimating it would
// throw away half of every recolour and half of the cursor's motion for no gain.
// Nothing is resampled anywhere in this film: every cut plays at `rate: 1`, and
// the render fps equals the source fps.
//
// ---------------------------------------------------------------------------
// THE THEME JOURNEY, AS MEASURED ON THE MASTER
// ---------------------------------------------------------------------------
//
// Boundaries were measured, not eyeballed: mean luma per frame over the whole
// timeline for the light/dark switches, and mean chroma (U/V) over the LIVE
// SPECIMEN panel for the palette switches, then confirmed against contact sheets.
//
//   0.000 –  3.850   Dark · Scout      the conservative default
//   3.850 –  9.117   Dark · Graphite
//   9.117 – 15.317   Dark · Polar
//  15.317 – 19.017   Dark · Solar
//  19.017 – 22.700   LIGHT · Solar     the reveal — whole-frame luminance flip
//  22.700 – 27.350   Light · Scout
//  27.350 – 34.583   Dark · Scout      the return
//
// The capture already tells the story the brief asks for — open conservative,
// show the range, come home — so the edit's job is to time it, not to reorder it.
//
// ---------------------------------------------------------------------------
// THE GRID
// ---------------------------------------------------------------------------
//
// MiniMax does not honour a requested BPM exactly. The replacement BEAT was
// asked for at 100 and delivered at a measured 105.08, so the film is built on
// what the music actually is. Mastering conforms BEAT to a round 100.000
// BPM, which makes one 4/4 bar 2.400 s, and at 60 fps that is exactly 144 frames.
// Every chapter below is a whole number of those bars, so every chapter boundary
// is a downbeat.
//
// PRE-ROLL. Each chapter opens exactly ONE BEAT (0.600 s / 36 frames) before its
// theme switch. So the cut lands on the downbeat showing the outgoing theme, and
// the interface recolours on beat two — the edit asks the question, the product
// answers it. This is what "let UI state changes motivate transitions" buys: no
// chapter needs a decorative transition, because the transition is the product
// doing its job, in full, on screen. Nothing is cut away mid-recolour.
//
// The skips between chapters are all forward and all sit inside a dwell, never
// across a recolour.

export const FPS = 60

/** 100.000 BPM in 4/4 → 2.400 s → exactly 144 frames at 60 fps. */
export const BAR = 144
export const BEAT = BAR / 4
export const BPM = 100

export const SOURCE = 'demos/openscout/openscout-theme-range-cfr60.mp4'
export const SOURCE_WIDTH = 1514
export const SOURCE_HEIGHT = 1072
export const SOURCE_ASPECT = SOURCE_WIDTH / SOURCE_HEIGHT

/** One beat of pre-roll, in seconds — the recolour lands on beat two. */
const PRE = BEAT / FPS

/** Measured theme-switch instants in the CFR-60 master, in seconds. */
export const SWITCHES = {
  graphite: 3.85,
  polar: 9.117,
  solar: 15.317,
  light: 19.017,
  lightScout: 22.7,
  dark: 27.35,
} as const

// ---------------------------------------------------------------------------
// Palette — the stage, not the product. Sampled off the capture so the frame
// agrees with whatever theme is on screen at the time.
// ---------------------------------------------------------------------------

export const PALETTE = {
  /** Stage behind the dark half. Below the capture's own black so the surface reads as lit. */
  stage: '#05060A',
  /** Stage behind the light half. Warm graphite, never white: the screen stays the brightest object. */
  stageLift: '#181A20',
  ink: '#F2F3F5',
  inkSoft: 'rgba(242,243,245,0.56)',
  inkFaint: 'rgba(242,243,245,0.26)',
  hairline: 'rgba(242,243,245,0.13)',
  /** Canonical OpenScout wire mark colour — off-white, never the green mark. */
  mark: '#F7F4EA',
} as const

export const SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui, sans-serif'
export const MONO = '"SF Mono", "JetBrains Mono", Menlo, Monaco, monospace'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A settling push-in, expressed as a magnification about a point in source
 * pixels.
 *
 * This is a camera move on the whole frame, NOT an overlay loupe. An inset
 * magnifier would have had to sit on top of the capture, and the brief is
 * explicit that the real interaction must not be obscured — so the film moves
 * the camera instead and keeps one unbroken image.
 *
 * The envelope is ease-in → REST → ease-out, and the rest is the long part. A
 * push that arrives and then keeps creeping reads as a wandering camera; a push
 * that arrives, stops, and lets you look is a held shot. Only two chapters have
 * one, and the reveal and the return have none at all: the last four chapters
 * are locked so the strongest idea in the film carries attention by itself.
 */
export type Push = {
  /** Magnification at rest. Kept small — this is a detail shot, not a zoom. */
  scale: number
  /** Focal point in source pixels. */
  cx: number
  cy: number
  /** Frames, relative to the chapter, for ease-in start/end and ease-out start/end. */
  in: [number, number]
  out: [number, number]
}

export type Cut =
  | { kind: 'hold'; holdAt: number; durationInFrames: number; note: string }
  | { kind: 'play'; sourceStart: number; sourceEnd: number; rate: 1; note: string }

export type Chapter = {
  /** Roman numeral shown in the index line. */
  numeral: string
  /** The theme this chapter lands on — set as the mono index label. */
  label: string
  /** Optional single quiet line. Most chapters have none: this is a vignette. */
  line?: string
  /**
   * Stage tone: 0 = dark stage, 1 = lifted stage. Interpolated across the
   * chapter head so the room turns with the product rather than snapping.
   */
  tone: number
  cuts: readonly Cut[]
  /**
   * Present only where the interface has something worth reading closely — the
   * theme cards and the live specimen — and absent from the reveal, which is a
   * whole-frame event and must not be framed down.
   */
  push?: Push
}

export type ThemeRangeEdit = {
  id: string
  slug: string
  chapters: readonly Chapter[]
  /** Public-relative path to the score. THE ONLY FIELD THAT MAY DIFFER A vs B. */
  score: string
  /** In-composition gain. Also allowed to differ, since the two scores master differently. */
  scoreGain: number
  /** Cross-dissolve length at chapter heads, in frames. */
  dissolve: number
  outroFrames: number
  outro: { line?: string; foot: string }
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

export type PlacedCut = Cut & {
  from: number
  durationInFrames: number
  fadeIn: number
  tail: number
  chapter: number
}
export type PlacedChapter = Chapter & { index: number; from: number; durationInFrames: number }
export type PlacedEdit = {
  edit: ThemeRangeEdit
  chapters: PlacedChapter[]
  cuts: PlacedCut[]
  contentFrames: number
  outroFrom: number
  totalFrames: number
}

const cutFrames = (cut: Cut) =>
  cut.kind === 'hold'
    ? cut.durationInFrames
    : Math.round((cut.sourceEnd - cut.sourceStart) * FPS)

const placedCache = new WeakMap<ThemeRangeEdit, PlacedEdit>()

export const placeEdit = (edit: ThemeRangeEdit): PlacedEdit => {
  const chapters: PlacedChapter[] = []
  const cuts: PlacedCut[] = []
  let cursor = 0

  edit.chapters.forEach((chapter, index) => {
    const from = cursor
    chapter.cuts.forEach((cut, cutIndex) => {
      const durationInFrames = cutFrames(cut)
      const fadeIn = index > 0 && cutIndex === 0 ? edit.dissolve : 0
      cuts.push({ ...cut, from: cursor, durationInFrames, fadeIn, tail: 0, chapter: index })
      cursor += durationInFrames
    })
    chapters.push({ ...chapter, index, from, durationInFrames: cursor - from })
  })

  // Every cut keeps running underneath whatever dissolves in on top of it, so a
  // dissolve never reveals a frozen frame.
  cuts.forEach((cut, i) => {
    cut.tail = cuts[i + 1]?.fadeIn ?? edit.dissolve
  })

  const contentFrames = cursor
  return {
    edit,
    chapters,
    cuts,
    contentFrames,
    outroFrom: contentFrames,
    totalFrames: contentFrames + edit.outroFrames,
  }
}

export const getPlacedEdit = (edit: ThemeRangeEdit): PlacedEdit => {
  const hit = placedCache.get(edit)
  if (hit) return hit
  const value = placeEdit(edit)
  placedCache.set(edit, value)
  return value
}

// ---------------------------------------------------------------------------
// The cut — 11 bars of content + 2 bars of outro = 13 bars = 31.200 s
// ---------------------------------------------------------------------------
//
//   I    OPEN            2 bars   hold, then move to the first switch
//   II   GRAPHITE        2 bars
//   III  POLAR           2 bars
//   IV   SOLAR           1 bar
//   V    LIGHT           1 bar    the reveal
//   VI   LIGHT · SCOUT   1 bar
//   VII  RETURN          2 bars
//   —    outro           2 bars
//
// The shape is deliberate. The range section holds Graphite and Polar for two
// bars each — they are comparisons, and comparisons need dwell. Then the film
// accelerates: Solar, Light and Light·Scout land one bar apiece, so the reveal
// arrives with momentum rather than being announced. The return gets two bars
// back, and the outro two more, so the film rests on the identity it came from.
// One idea, given the most time, at the end.

const CHAPTERS: readonly Chapter[] = [
  {
    // 0 – 288 · 2 bars
    numeral: 'I',
    label: 'SCOUT · DARK',
    tone: 0,
    cuts: [
      {
        kind: 'hold',
        holdAt: SWITCHES.graphite - PRE - BAR / FPS,
        durationInFrames: BAR,
        note: 'open — held on the conservative default while the type lands',
      },
      {
        kind: 'play',
        sourceStart: SWITCHES.graphite - PRE - BAR / FPS,
        sourceEnd: SWITCHES.graphite - PRE,
        rate: 1,
        note: 'scout dark, moving to the first switch',
      },
    ],
  },
  {
    // 288 – 576 · 2 bars
    numeral: 'II',
    label: 'GRAPHITE',
    tone: 0,
    cuts: [
      {
        kind: 'play',
        sourceStart: SWITCHES.graphite - PRE,
        sourceEnd: SWITCHES.graphite - PRE + (2 * BAR) / FPS,
        rate: 1,
        note: 'scout → graphite recolour on beat two, then dwell',
      },
    ],
    // The wider of the two pushes: holds the card grid AND the live specimen in
    // one frame, because this chapter is where the film establishes that the two
    // are connected. Measured on the master at 6.0 s — cards span x 398–1030,
    // specimen x 1063–1404 — and cx is set so the right edge of the visible
    // region lands past 1404 rather than slicing the specimen in half.
    push: { scale: 1.2, cx: 990, cy: 596, in: [30, 74], out: [246, 286] },
  },
  {
    // 576 – 864 · 2 bars
    numeral: 'III',
    label: 'POLAR',
    tone: 0,
    cuts: [
      {
        kind: 'play',
        sourceStart: SWITCHES.polar - PRE,
        sourceEnd: SWITCHES.polar - PRE + (2 * BAR) / FPS,
        rate: 1,
        note: 'graphite → polar recolour on beat two, then dwell',
      },
    ],
    // The tighter of the two, and the only real detail shot in the film: the
    // live specimen, where a palette change is actually legible — conversation
    // rows, the active-flight card and its accent all move at once. Measured on
    // the master at 11.5 s: the panel spans x 1063–1404, y 365–695, which sits
    // well inside the visible region this push leaves (x 364–1430, y 157–912).
    // Still only 1.42×: enough to read, not enough to feel like a zoom.
    push: { scale: 1.42, cx: 1230, cy: 530, in: [30, 74], out: [246, 286] },
  },
  {
    // 864 – 1008 · 1 bar
    numeral: 'IV',
    label: 'SOLAR',
    tone: 0,
    cuts: [
      {
        kind: 'play',
        sourceStart: SWITCHES.solar - PRE,
        sourceEnd: SWITCHES.solar - PRE + BAR / FPS,
        rate: 1,
        note: 'polar → solar recolour on beat two',
      },
    ],
  },
  {
    // 1008 – 1152 · 1 bar — the reveal. No lens: this is a whole-frame event.
    numeral: 'V',
    label: 'LIGHT',
    line: 'And the whole room turns.',
    tone: 1,
    cuts: [
      {
        kind: 'play',
        sourceStart: SWITCHES.light - PRE,
        sourceEnd: SWITCHES.light - PRE + BAR / FPS,
        rate: 1,
        note: 'dark → light mode; the reveal, played whole',
      },
    ],
  },
  {
    // 1152 – 1296 · 1 bar
    numeral: 'VI',
    label: 'SCOUT · LIGHT',
    tone: 1,
    cuts: [
      {
        kind: 'play',
        sourceStart: SWITCHES.lightScout - PRE,
        sourceEnd: SWITCHES.lightScout - PRE + BAR / FPS,
        rate: 1,
        note: 'solar → scout in light mode; the identity, seen in daylight',
      },
    ],
  },
  {
    // 1296 – 1584 · 2 bars
    numeral: 'VII',
    label: 'SCOUT · DARK',
    tone: 0,
    cuts: [
      {
        kind: 'play',
        sourceStart: SWITCHES.dark - PRE,
        sourceEnd: SWITCHES.dark - PRE + (2 * BAR) / FPS,
        rate: 1,
        note: 'light → dark; the return, given room to settle',
      },
    ],
  },
] as const

/**
 * The locked picture. Both deliverables are this object with a score attached;
 * see the rule at the top of the file.
 */
const THEME_RANGE_EDIT: Omit<ThemeRangeEdit, 'id' | 'slug' | 'score' | 'scoreGain'> = {
  chapters: CHAPTERS,
  // Short. Every chapter head is a real cut inside a dwell, and the point of the
  // dissolve is to absorb the cursor's jump, not to soften the edit.
  dissolve: 7,
  outroFrames: 2 * BAR,
  // Minimal and deliberately claim-free. The foot simply names the themes that
  // were on screen; there is no explanatory slogan for a small appearance
  // vignette to carry.
  outro: {
    foot: 'SCOUT · GRAPHITE · POLAR · SOLAR · LIGHT · DARK',
  },
}

export const EDIT_THEME_RANGE_BEAT: ThemeRangeEdit = {
  ...THEME_RANGE_EDIT,
  id: 'openscout-theme-range-beat',
  slug: 'ThemeRangeBeat',
  score: 'tracks/openscout/openscout-theme-range-vibe-original.wav',
  scoreGain: 1,
}

export const EDIT_THEME_RANGE_DRIFT: ThemeRangeEdit = {
  ...THEME_RANGE_EDIT,
  id: 'openscout-theme-range-drift',
  slug: 'ThemeRangeDrift',
  score: 'tracks/openscout/openscout-theme-range-vibe-refined.wav',
  scoreGain: 1,
}

/**
 * A third deliverable carrying a fresh score — the same locked picture again,
 * not a new cut. It spreads `THEME_RANGE_EDIT` exactly as A and B do, so the one
 * rule at the top of this file still holds: the only fields that differ are the
 * ones named in `AB_VARIABLE_KEYS`, and the composition has no code path from
 * any of them to a pixel.
 *
 * The score is an original MiniMax generation made for this pass —
 * `scripts/generate-theme-range-vibe-score.ts` — chosen from three candidates
 * and conformed to 125.000 BPM so that the film's open, its POLAR midpoint, its
 * reveal and its outro land on musical downbeats. See
 * `public/tracks/openscout/openscout-theme-range-glasshouse.provenance.json`.
 */
export const EDIT_THEME_RANGE_GLASSHOUSE: ThemeRangeEdit = {
  ...THEME_RANGE_EDIT,
  id: 'openscout-theme-range-glasshouse',
  slug: 'ThemeRangeGlasshouse',
  score: 'tracks/openscout/openscout-theme-range-glasshouse.wav',
  scoreGain: 1,
}

/**
 * The fields that are allowed to differ between the two deliverables. The
 * validator asserts that every other key of the two edit objects is deep-equal,
 * so adding a field here is the only way to widen the A/B — and it should be
 * treated as a change to the brief.
 */
export const AB_VARIABLE_KEYS = ['id', 'slug', 'score', 'scoreGain'] as const

// ---------------------------------------------------------------------------
// Format — one delivered layout.
// ---------------------------------------------------------------------------

export type ThemeRangeFormat = { id: string; width: number; height: number }

/**
 * 1920×1080 only. The capture is 1514×1072, so the screen is presented BELOW
 * 1:1 and never upscaled — see `SCREEN_W` in the composition. A vertical or
 * square cut of a wide desktop settings page would have to crop away the very
 * grid the film is about, so it is not offered.
 */
export const THEME_RANGE_FORMATS: readonly ThemeRangeFormat[] = [
  { id: 'Landscape', width: 1920, height: 1080 },
] as const
