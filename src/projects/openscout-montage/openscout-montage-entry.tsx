import React from 'react'
import {Composition, registerRoot} from 'remotion'
import {FORMATS, FPS, getPlacedEdit, MontageEdit} from './edit'
import {EDIT_A} from './edit-a'
import {EDIT_B} from './edit-b'
import {EDIT_REIMAGINED} from './edit-reimagined'
import {EDIT_REFINED, REFINED_FORMATS} from './edit-refined'
import {DAYLIGHT_FORMATS, EDIT_DAYLIGHT} from './edit-daylight'
import {
  EDIT_THEME_RANGE_BEAT,
  EDIT_THEME_RANGE_DRIFT,
  EDIT_THEME_RANGE_GLASSHOUSE,
  FPS as THEME_RANGE_FPS,
  getPlacedEdit as getPlacedThemeRange,
  THEME_RANGE_FORMATS,
} from './edit-theme-range'
import {OpenScoutMontage} from './OpenScoutMontage'
import {OpenScoutRefined} from './OpenScoutRefined'
import {OpenScoutDaylight} from './OpenScoutDaylight'
import {OpenScoutThemeRange} from './OpenScoutThemeRange'

/**
 * The three films kept for comparison. `EDIT_REIMAGINED` in particular is the
 * cut the refined film is reviewed against, so it stays registered and
 * renderable exactly as it was.
 */
const EDITS: readonly MontageEdit[] = [EDIT_A, EDIT_B, EDIT_REIMAGINED]

/**
 * Composition ids read `<EditSlug>-<Format>`, e.g. `DarkHero-Landscape`.
 * Every edit is registered in every delivered aspect ratio; the layouts are
 * recompositions driven by `FORMATS`, not crops.
 *
 * The refined film runs on its own component and its own locked-layout formats
 * (`Refined-Landscape` and friends), because its whole point is that it does not
 * interpolate between layout states the way `FORMATS` does.
 */
const Root: React.FC = () => (
  <>
    {EDITS.flatMap((edit) =>
      FORMATS.map((format) => (
        <Composition
          key={`${edit.slug}-${format.id}`}
          id={`${edit.slug}-${format.id}`}
          component={OpenScoutMontage}
          durationInFrames={getPlacedEdit(edit).totalFrames}
          fps={FPS}
          width={format.width}
          height={format.height}
          defaultProps={{format, edit}}
        />
      )),
    )}
    {REFINED_FORMATS.map((format) => (
      <Composition
        key={`${EDIT_REFINED.slug}-${format.id}`}
        id={`${EDIT_REFINED.slug}-${format.id}`}
        component={OpenScoutRefined}
        durationInFrames={getPlacedEdit(EDIT_REFINED).totalFrames}
        fps={FPS}
        width={format.width}
        height={format.height}
        defaultProps={{format, edit: EDIT_REFINED}}
      />
    ))}
    {DAYLIGHT_FORMATS.map((format) => (
      <Composition
        key={`${EDIT_DAYLIGHT.slug}-${format.id}`}
        id={`${EDIT_DAYLIGHT.slug}-${format.id}`}
        component={OpenScoutDaylight}
        durationInFrames={getPlacedEdit(EDIT_DAYLIGHT).totalFrames}
        fps={FPS}
        width={format.width}
        height={format.height}
        defaultProps={{format, edit: EDIT_DAYLIGHT}}
      />
    ))}
    {/*
      The theme-range score test. Three compositions, ONE picture: the edits
      differ only in `score` and `scoreGain`, and `OpenScoutThemeRange` has no
      code path from either field to a pixel. They run at 60 fps — the capture's
      own rate — rather than the house 30, so no recolour is decimated.
    */}
    {[EDIT_THEME_RANGE_BEAT, EDIT_THEME_RANGE_DRIFT, EDIT_THEME_RANGE_GLASSHOUSE].flatMap((edit) =>
      THEME_RANGE_FORMATS.map((format) => (
        <Composition
          key={`${edit.slug}-${format.id}`}
          id={`${edit.slug}-${format.id}`}
          component={OpenScoutThemeRange}
          durationInFrames={getPlacedThemeRange(edit).totalFrames}
          fps={THEME_RANGE_FPS}
          width={format.width}
          height={format.height}
          defaultProps={{format, edit}}
        />
      )),
    )}
  </>
)

registerRoot(Root)
