// OpenScout montage — shared edit core: sources, palette, types, placement and
// format layouts.
//
// Everything the composition needs that is not pixels lives here so the same
// cut plays back identically in 16:9, 9:16 and 1:1. Layout is expressed in
// normalised stage units, never in hard-coded pixels, so a new aspect ratio is
// a data change rather than a re-layout.
//
// This module holds nothing edit-specific. The two V3 films are `edit-a.ts`
// (dark hero, beat-led) and `edit-b.ts` (light ↔ dark, ambient). Both are
// `MontageEdit` values consumed by the same `OpenScoutMontage` component.

export const FPS = 30

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

/**
 * V3 masters, normalised once from the VFR originals to constant 30 fps so
 * every `sourceStart` in an EDL lands on the frame it names:
 *
 *   ffmpeg -i <master>.mp4 -vf fps=30 -c:v libx264 -crf 16 -preset slow \
 *     -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 \
 *     -colorspace bt709 -movflags +faststart -an <out>-cfr30.mp4
 *
 * Input seeking on the VFR originals drifts by seconds (sparse keyframes), so
 * every timecode in the EDLs refers to these CFR files and was mapped on them.
 */
export const SOURCES = {
  dark: 'demos/openscout/openscout-nav-dark-v3-cfr30.mp4',
  light: 'demos/openscout/openscout-nav-light-v3-cfr30.mp4',
  /**
   * The original montage's capture, kept for exactly one interaction: the agent
   * and model picker, which neither V3 master contains — V3 shows the composer's
   * `Opus 5 · AUTO` chip but never opens the sheet behind it.
   *
   * The V3 brief allows this master only as a fallback for a missing interaction
   * and warns it carries obsolete flat-tab navigation. The picker passage does
   * not: at 98.9–101.7 s the tab bar already reads the V3 chrome
   * `Home / Chats / Logs / [hex] / Projects / Shell / Alerts`, so this beat does
   * not undermine the V3 story. Nothing else is drawn from this file.
   */
  legacy: 'demos/openscout/openscout-ios-2026-08-12-cfr30.mp4',
  /**
   * The reimagined-era capture (2026-08-13): 1178×2556, 109.533 s, 3286 frames,
   * constant 30 fps, BT.709, no audio. Normalised by the capture pipeline, not
   * here — every timecode in `edit-reimagined.ts` was mapped on this file.
   *
   * This is a new product era rather than a continuation of the V3 masters: the
   * navigation, the Scout broker index, the For You surface, the Tail and the
   * whole SCOUT · SETTINGS inspector architecture are all redesigned. The
   * reimagined film draws on this capture and nothing else.
   */
  reimagined: 'demos/openscout/openscout-reimagined-dark-device-master-cfr30.mp4',
} as const

export type SourceId = keyof typeof SOURCES

export const SOURCE_WIDTH = 1178
export const SOURCE_HEIGHT = 2556
export const SOURCE_ASPECT = SOURCE_WIDTH / SOURCE_HEIGHT

// ---------------------------------------------------------------------------
// Palette — sampled from the capture so the stage agrees with the product.
// ---------------------------------------------------------------------------

export const PALETTE = {
  stage: '#06070A',
  /**
   * Lifted stage for the light half of Edit B. Deliberately graphite rather
   * than white: the phone has to stay the brightest object in frame, and the
   * brand's air is cold. The lift is what makes the turn to dark readable as a
   * whole-frame mood change instead of a screen-only one.
   */
  stageLift: '#1E232B',
  ink: '#F2F3F5',
  inkSoft: 'rgba(242,243,245,0.58)',
  inkFaint: 'rgba(242,243,245,0.30)',
  hairline: 'rgba(242,243,245,0.14)',
  mint: '#3FE0A0',
  mintDeep: '#10906A',
  glass: 'rgba(20,26,32,0.62)',
  /** Canonical OpenScout wire mark colour. */
  mark: '#F7F4EA',
} as const

export const SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui, sans-serif'
export const MONO = '"SF Mono", "JetBrains Mono", Menlo, Monaco, monospace'

// ---------------------------------------------------------------------------
// Edit decision list
// ---------------------------------------------------------------------------

/** A rectangle in source pixels, magnified into the detail lens. */
export type LensRect = { x: number; y: number; w: number; h: number }

/**
 * A redaction applied to a cut's own pixels, in source coordinates.
 *
 * The rows in `[from, to)` are removed and everything beneath them up to
 * `floor` is closed up by exactly that height, so the surface reads as a feed
 * that never contained the row rather than as a feed with a hole punched in it.
 * `floor` is the bottom of the scrolling region — the chrome below it (tab bar,
 * status footer) must not move, so it is left where it is.
 *
 * This exists for one reason, and it is a product-narrative one rather than an
 * aesthetic one: the light For You capture carries a `System` row reporting an
 * internal routing failure. Operator direction of 2026-08-13 is that routing
 * conditions are not user-facing product narrative and are to be removed,
 * replaced, cropped or sourced around. There is no clean alternative window —
 * the feed is pixel-static across both of its passes in the capture — so the row
 * is removed here.
 *
 * Read only by the daylight film. Unset everywhere else, so the earlier films'
 * placement and pixels are unchanged.
 */
export type Redaction = {
  /** First source row removed. */
  from: number
  /** First source row kept below the removed block. */
  to: number
  /** Bottom of the scrolling region, in source pixels. Chrome below is fixed. */
  floor: number
}

/**
 * How a cut arrives over the one beneath it, when a cross-dissolve is the wrong
 * instrument.
 *
 * `radial` reveals the incoming cut through a soft-edged circle growing from a
 * point given in source pixels. It exists for the light→dark mode turn: a
 * cross-dissolve between a white surface and a black one passes through a flat
 * grey midpoint with both sets of text ghosted over each other, which reads as a
 * broken frame rather than as a transformation. A reveal shows a real, finished
 * surface at every moment, and originating it at the control that was changed
 * makes the change legible as cause and effect.
 *
 * Read only by the daylight film; unset everywhere else.
 */
export type CutEnter = {kind: 'radial'; cx: number; cy: number}

type CutBase = {
  source: SourceId
  note: string
  /** Overrides the edit's dissolve for this cut's entry. */
  fade?: number
  /** Rows to remove from this cut's own pixels. See `Redaction`. */
  redact?: Redaction
  /** Non-dissolve arrival. Defaults to a cross-dissolve. See `CutEnter`. */
  enter?: CutEnter
}

export type Cut =
  | (CutBase & { kind: 'play'; sourceStart: number; sourceEnd: number; rate: number })
  | (CutBase & { kind: 'hold'; holdAt: number; durationInFrames: number })

export type Chapter = {
  numeral: string
  verb: string
  line: string
  /**
   * Short explanatory line beneath the chapter title, naming what is literally
   * on screen. Read only by the refined film, which composes each chapter as a
   * fixed title-plus-explanation type column; the two earlier films leave it
   * unset and render the title alone.
   */
  sub?: string
  cuts: readonly Cut[]
  /** Detail lens, timed relative to the chapter's first frame. */
  lens?: { rect: LensRect; from: number; to: number; caption: string }
  /**
   * Stage lift at chapter start → end. 0 is the near-black OpenScout stage,
   * 1 is the graphite stage that carries Edit B's light half. Interpolated
   * linearly across the chapter, so a chapter can carry the mood change itself.
   */
  stageTone?: readonly [number, number]
}

export type MontageEdit = {
  id: string
  /** Composition id prefix; formats append their own suffix. */
  slug: string
  chapters: readonly Chapter[]
  /** Audio bed, relative to public/. */
  score: string
  scoreGain: number
  /** Frames of A/B dissolve laid across chapter boundaries. */
  dissolve: number
  outroFrames: number
  /**
   * Footer provenance stamp. Defaults to the first montage's label; the
   * reimagined capture names its host `Arachs Mac mini` on screen, so that cut
   * overrides it rather than contradicting its own footage.
   */
  hostLabel?: string
  /**
   * An authored opening: a brand/title breath that plays before the first cut.
   * `frames` are reserved ahead of chapter I, so the product sequence starts on
   * a downbeat rather than on frame 0 and the film has somewhere to begin.
   *
   * Optional, and unset on the two earlier films — `placeEdit` reserves nothing
   * when it is absent, so their placement is byte-for-byte what it always was.
   */
  preamble?: {
    frames: number
    line: string
  }
  outro: {
    line: string
    foot: string
    tag: string
  }
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

export type PlacedCut = Cut & {
  from: number
  durationInFrames: number
  /** Frames of fade-in laid over the previous cut. */
  fadeIn: number
  /** Extra frames this cut keeps playing beneath the next one. */
  tail: number
  chapter: number
}

export type PlacedChapter = Chapter & {
  index: number
  from: number
  durationInFrames: number
}

export type PlacedEdit = {
  edit: MontageEdit
  chapters: readonly PlacedChapter[]
  cuts: readonly PlacedCut[]
  contentFrames: number
  outroFrom: number
  totalFrames: number
}

const cutFrames = (cut: Cut): number =>
  cut.kind === 'hold'
    ? cut.durationInFrames
    : Math.round(((cut.sourceEnd - cut.sourceStart) / cut.rate) * FPS)

const placedCache = new WeakMap<MontageEdit, PlacedEdit>()

/**
 * Placement is pure and identical for every render of an edit, so it is cached:
 * the composition registry and the component both need it, and Remotion asks
 * for `durationInFrames` before the component ever mounts.
 */
export const getPlacedEdit = (edit: MontageEdit): PlacedEdit => {
  const hit = placedCache.get(edit)
  if (hit) return hit
  const value = placeEdit(edit)
  placedCache.set(edit, value)
  return value
}

export const placeEdit = (edit: MontageEdit): PlacedEdit => {
  const chapters: PlacedChapter[] = []
  const cuts: PlacedCut[] = []
  // The preamble owns the head of the timeline; chapter I starts after it.
  // Absent on the earlier films, so their cursor still starts at 0.
  let cursor = edit.preamble?.frames ?? 0

  edit.chapters.forEach((chapter, index) => {
    const from = cursor
    chapter.cuts.forEach((cut, cutIndex) => {
      const durationInFrames = cutFrames(cut)
      const isChapterHead = cutIndex === 0
      const fadeIn =
        cut.fade ?? (index > 0 && isChapterHead ? edit.dissolve : 0)
      cuts.push({ ...cut, from: cursor, durationInFrames, fadeIn, tail: 0, chapter: index })
      cursor += durationInFrames
    })
    chapters.push({ ...chapter, index, from, durationInFrames: cursor - from })
  })

  // Every cut keeps running underneath whatever dissolves in on top of it.
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

// ---------------------------------------------------------------------------
// Formats — one entry per delivered aspect ratio.
// ---------------------------------------------------------------------------

/**
 * Normalised layout. `base` is the pose with no detail lens on screen;
 * `lensed` is the pose that makes room for it. The composition interpolates
 * between the two, so the layout genuinely recomposes instead of cropping.
 */
export type LayoutState = {
  /** Device screen height as a fraction of stage height. */
  deviceH: number
  deviceCx: number
  deviceCy: number
  lensW: number
  lensCx: number
  lensCy: number
  textAlign: 'left' | 'center'
  /** Left edge when left-aligned, centre when centred. */
  textX: number
  textY: number
  textW: number
}

export type Format = {
  id: string
  label: string
  width: number
  height: number
  base: LayoutState
  lensed: LayoutState
  headerY: number
  footerY: number
  margin: number
  typeScale: number
}

/**
 * The device fields are IDENTICAL between `base` and `lensed` in every format:
 * the phone shell is locked in place and never moves, shrinks or reposes when a
 * lens arrives. Only the lens and the type recompose. Operator direction
 * 2026-08-13: "keep the phone shell essentially locked … no alternating angles,
 * continual drift, or chapter-by-chapter pose changes."
 *
 * Each format's device size and position was therefore chosen so the lensed
 * arrangement fits around a stationary phone rather than by moving it out of the
 * way. "Centered" is read as centred within the phone's own column, not the
 * frame — the landscape and square layouts put type and lens in the opposite
 * column, and frame-centring the device would leave nowhere for them.
 */
export const FORMATS: readonly Format[] = [
  {
    id: 'Landscape',
    label: 'landscape master',
    width: 1920,
    height: 1080,
    base: {
      deviceH: 0.845,
      deviceCx: 0.3,
      deviceCy: 0.5,
      lensW: 0.44,
      lensCx: 0.735,
      lensCy: 0.615,
      textAlign: 'left',
      textX: 0.545,
      textY: 0.5,
      textW: 0.4,
    },
    lensed: {
      deviceH: 0.845,
      deviceCx: 0.3,
      deviceCy: 0.5,
      lensW: 0.44,
      lensCx: 0.735,
      lensCy: 0.625,
      textAlign: 'left',
      textX: 0.545,
      textY: 0.235,
      textW: 0.4,
    },
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
    // Device sized so the tallest lens (and its caption, which sits 22u above the
    // panel) clears the phone's bottom edge at 1018 px and still leaves the type
    // clear beneath. Verified on rendered frames — an earlier pass had the
    // caption sitting on top of the device's own footer row.
    base: {
      deviceH: 0.46,
      deviceCx: 0.5,
      deviceCy: 0.3,
      lensW: 0.74,
      lensCx: 0.5,
      lensCy: 0.72,
      textAlign: 'center',
      textX: 0.5,
      textY: 0.915,
      textW: 0.82,
    },
    lensed: {
      deviceH: 0.46,
      deviceCx: 0.5,
      deviceCy: 0.3,
      lensW: 0.74,
      lensCx: 0.5,
      lensCy: 0.72,
      textAlign: 'center',
      textX: 0.5,
      textY: 0.915,
      textW: 0.82,
    },
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
    base: {
      deviceH: 0.7,
      deviceCx: 0.265,
      deviceCy: 0.5,
      lensW: 0.48,
      lensCx: 0.725,
      lensCy: 0.6,
      textAlign: 'left',
      textX: 0.485,
      textY: 0.5,
      textW: 0.44,
    },
    lensed: {
      deviceH: 0.7,
      deviceCx: 0.265,
      deviceCy: 0.5,
      lensW: 0.48,
      lensCx: 0.725,
      lensCy: 0.63,
      textAlign: 'left',
      textX: 0.485,
      textY: 0.22,
      textW: 0.44,
    },
    headerY: 0.062,
    footerY: 0.938,
    margin: 0.062,
    typeScale: 1.16,
  },
] as const

export const lerpLayout = (a: LayoutState, b: LayoutState, t: number): LayoutState => ({
  deviceH: a.deviceH + (b.deviceH - a.deviceH) * t,
  deviceCx: a.deviceCx + (b.deviceCx - a.deviceCx) * t,
  deviceCy: a.deviceCy + (b.deviceCy - a.deviceCy) * t,
  lensW: a.lensW + (b.lensW - a.lensW) * t,
  lensCx: a.lensCx + (b.lensCx - a.lensCx) * t,
  lensCy: a.lensCy + (b.lensCy - a.lensCy) * t,
  textAlign: b.textAlign,
  textX: a.textX + (b.textX - a.textX) * t,
  textY: a.textY + (b.textY - a.textY) * t,
  textW: a.textW + (b.textW - a.textW) * t,
})
