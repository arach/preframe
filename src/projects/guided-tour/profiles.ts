/** Example apps for the guided tour — swap subject, keep the Preframe workflow.
 *
 * A "project" is the subject (OpenScout / Talkie / Lattices): shared identity +
 * raw capture. Each project carries several script "variants" — distinct creative
 * takes on the same six-beat workflow (diary / problem / terse / craft).
 *
 * Selection:
 *   TOUR_EXAMPLE   scout (default) | talkie | lattices   — which subject
 *   TOUR_SCRIPT    diary (default) | problem | terse | craft — which take
 */

import { TOUR_PROJECTS } from './scripts.data';

export type TourExampleId = 'scout' | 'talkie' | 'lattices';
export type TourVariantId = 'diary' | 'problem' | 'terse' | 'craft';

/** One beat of the tour — a still, its spoken VO, and the on-screen caption that
 *  echoes it. caption[i] is authored to match narration[i] (no drift). */
export interface TourBeat {
  /** One of the six fixed stills, in order. */
  still: string;
  /** Spoken voiceover line for this beat. */
  narration: string;
  /** Shorter on-screen caption echoing this same beat. */
  caption: string;
  /** Seconds into the video; null for the first beat (uses narration start). */
  markerAtSec: number | null;
}

/** A single creative take on the workflow for one subject. */
export interface TourScriptVariant {
  id: TourVariantId;
  /** Human label, e.g. "Process diary". */
  label: string;
  /** One line on what makes this take distinct. */
  angleSummary: string;
  /** On-screen Remotion scene label. */
  sceneLabel: string;
  sceneSublabel: string;
  /** Brief typed into /new during capture. */
  ingestPrompt: string;
  /** Note typed onto the boxed frame during review. */
  reviewNote: string;
  /** Long-form first-person paragraph for landing / about. */
  story: string;
  beats: TourBeat[];
  landingTitle: string;
  landingDescription: string;
  landingListNote: string;
}

/** A subject: shared media + identity, plus its script variants. */
export interface TourProject {
  id: TourExampleId;
  /** Raw capture dropped in /new. */
  sampleVideo: string;
  /** Catalog project id for code + review beats. */
  projectVideo: string;
  defaultVariant: TourVariantId;
  variants: Record<TourVariantId, TourScriptVariant>;
}

/** @deprecated Per-beat landing still. */
export interface TourLandingBeat {
  still: string;
  narration: string;
}

export interface TourCaption {
  /** Offset from tour marker atSec; first caption uses narration start instead. */
  markerAtSec?: number;
  line: string;
}

/** Flattened project+variant — the shape every consumer (capture, render,
 *  narration, beats) reads. Backward-compatible with the old TourExample. */
export interface ResolvedTour {
  id: TourExampleId;
  variantId: TourVariantId;
  label: string;
  angleSummary: string;
  sceneLabel: string;
  sceneSublabel: string;
  sampleVideo: string;
  projectVideo: string;
  ingestPrompt: string;
  reviewNote: string;
  story: string;
  landingBeats: TourLandingBeat[];
  captions: TourCaption[];
  landingTitle: string;
  landingDescription: string;
  landingListNote: string;
  /** '' for the canonical scout/diary (legacy flat assets), else `<project>-<variant>`. */
  assetSlug: string;
  /** staticFile prefix for this variant's narration mp3s. */
  narrationPrefix: string;
  /** ElevenLabs voice id for this subject's narrator. */
  voice: string;
  /** Human name of that voice (for docs / manifests). */
  voiceLabel: string;
}

/** One narrator per subject so the set isn't all the same voice. All low-key,
 *  conversational picks that fit the "here's what I use" tone (not announcer). */
const PROJECT_VOICES: Record<TourExampleId, { voice: string; voiceLabel: string }> = {
  scout: { voice: 'SAz9YHcvj6GT2YYXdXww', voiceLabel: 'River' }, // relaxed, neutral, informative
  talkie: { voice: 'EXAVITQu4vr4xnSDxMaL', voiceLabel: 'Sarah' }, // mature, reassuring
  lattices: { voice: 'CwhRBWXzGAHq8TQ4Fs17', voiceLabel: 'Roger' }, // laid-back, casual, resonant
};

/** @deprecated Use ResolvedTour. Kept for callers that referenced TourExample. */
export type TourExample = ResolvedTour;

export const DEFAULT_TOUR_EXAMPLE: TourExampleId = 'scout';
export const DEFAULT_TOUR_VARIANT: TourVariantId = 'diary';

export { TOUR_PROJECTS };

/** scout/diary keeps the legacy flat asset paths; every other take is namespaced. */
export function assetSlugFor(project: TourExampleId, variant: TourVariantId): string {
  return project === DEFAULT_TOUR_EXAMPLE && variant === DEFAULT_TOUR_VARIANT
    ? ''
    : `${project}-${variant}`;
}

export function narrationPrefixFor(project: TourExampleId, variant: TourVariantId): string {
  const slug = assetSlugFor(project, variant);
  return slug ? `guided-tour/${slug}/narration` : 'guided-tour/narration';
}

function flatten(project: TourProject, variant: TourScriptVariant): ResolvedTour {
  return {
    id: project.id,
    variantId: variant.id,
    label: variant.label,
    angleSummary: variant.angleSummary,
    sceneLabel: variant.sceneLabel,
    sceneSublabel: variant.sceneSublabel,
    sampleVideo: project.sampleVideo,
    projectVideo: project.projectVideo,
    ingestPrompt: variant.ingestPrompt,
    reviewNote: variant.reviewNote,
    story: variant.story,
    landingBeats: variant.beats.map((b) => ({ still: b.still, narration: b.narration })),
    captions: variant.beats.map((b) => ({
      markerAtSec: b.markerAtSec ?? undefined,
      line: b.caption,
    })),
    landingTitle: variant.landingTitle,
    landingDescription: variant.landingDescription,
    landingListNote: variant.landingListNote,
    assetSlug: assetSlugFor(project.id, variant.id),
    narrationPrefix: narrationPrefixFor(project.id, variant.id),
    voice: PROJECT_VOICES[project.id].voice,
    voiceLabel: PROJECT_VOICES[project.id].voiceLabel,
  };
}

export function resolveTourExample(
  id?: string | null,
  variantId?: string | null,
): ResolvedTour {
  const projectKey = (id ?? process.env.TOUR_EXAMPLE ?? DEFAULT_TOUR_EXAMPLE) as TourExampleId;
  const project = TOUR_PROJECTS[projectKey];
  if (!project) {
    throw new Error(
      `Unknown TOUR_EXAMPLE: ${id ?? projectKey} (expected scout, talkie, or lattices)`,
    );
  }

  const variantKey = (variantId ?? process.env.TOUR_SCRIPT ?? project.defaultVariant) as TourVariantId;
  const variant = project.variants[variantKey];
  if (!variant) {
    const known = Object.keys(project.variants).join(', ');
    throw new Error(`Unknown TOUR_SCRIPT: ${variantId ?? variantKey} for ${projectKey} (expected ${known})`);
  }

  return flatten(project, variant);
}
