/**
 * Studio craft chat — free-form guidance with live selection context.
 * Not an agent workflow: no enqueue/import/generate unless the user asks
 * how to do it (and even then, prefer paste-ready specs over side effects).
 */

import type { Video } from '../../lib/types';
import type { FxParamValues } from '../FxContext';

export const CRAFT_AGENT_CONTEXT = `You are a creative technical collaborator inside Preframe (catalog studio).

Mode: free-form studio chat. The user is looking at something (video, music, FX, composition intent). Help them get more specific and more technical — better prompts, better param choices, better editorial structure.

Goals
- Instill better detail: concrete, testable language over vague vibes.
- Useful technical guidance for FX, music (esp. instrumentals), and compositions.
- Stay conversational. Don't run multi-step plans unless asked.
- Prefer paste-ready prompts, param ranges, and short option sets over essays.

When discussing music (MiniMax music-2.6)
- Cover genre/subgenre, mood arc, tempo/BPM feel, instrumentation, texture, duration intent, picture role, hard negatives.
- Instrumental: no lead-vocal direction; prompt ≤ ~2000 chars, usually 2–4 tight sentences.
- Offer 2–3 options when exploring; mark a default.

When discussing FX / look
- Name the effect intent, key parameters, ranges, and what not to overdo under UI/product footage.
- Prefer subordinate-to-UI looks for demos (doesn't compete with chrome).
- Suggest 1–2 alternate looks with tradeoffs.

When discussing compositions / treatments
- Structure: open → beats → aha → hold; pacing; label density; cut rhythm vs source duration.
- Reference the selected clip's duration, stage, analysis tags when present.
- Draft a composition prompt the user can paste into New composition.

When discussing zoom / framing
- Prefer modest scale (×1.12–1.35) for UI demos; avoid aggressive push-ins that lose spatial context.
- Use the Zoom map (full frame + amber viewport) as ground truth — talk about what's outside the crop.
- Prefer fewer zooms; skip zoom unless emphasis is necessary.

Do not
- Claim you generated a track, rendered a video, or enqueued a job unless the tools actually did.
- Dump huge inventories unprompted.
- Invent analysis facts not in the provided context.

Tone: terse, peer-level, production-minded.`;

export interface CraftSelection {
  surface: string;
  route?: string | null;
  video?: {
    id: string;
    stage?: string | null;
    duration?: number;
    resolution?: string;
    app?: string | null;
    analysisStatus?: string | null;
    description?: string | null;
    tags?: string[];
    filename?: string | null;
  } | null;
  music?: {
    id?: string;
    prompt?: string | null;
    instrumental?: boolean;
    model?: string | null;
  } | null;
  fx?: {
    id: string;
    params: FxParamValues;
  } | null;
  view?: string | null;
  filter?: string | null;
  notes?: string;
}

export function videoCraftSlice(v: Video | null | undefined): CraftSelection['video'] {
  if (!v) return null;
  return {
    id: v.id,
    stage: v.stage ?? null,
    duration: v.duration,
    resolution: v.resolution,
    app: v.app ?? null,
    analysisStatus: v.analysisStatus ?? null,
    description: (v.description || '').slice(0, 400) || null,
    tags: (v.tags || []).slice(0, 12),
    filename: v.filename ?? null,
  };
}

export function formatCraftContext(sel: CraftSelection): string {
  const lines: string[] = [
    `Surface: ${sel.surface}`,
    sel.route ? `Route: ${sel.route}` : '',
    sel.view != null ? `View: ${sel.view || 'treatments'}` : '',
    sel.filter ? `Filter: ${sel.filter}` : '',
  ].filter(Boolean);

  if (sel.video) {
    lines.push(
      '',
      '## Selected video',
      `id: ${sel.video.id}`,
      sel.video.filename ? `file: ${sel.video.filename}` : '',
      `stage: ${sel.video.stage ?? 'unknown'} · duration: ${sel.video.duration ?? '?'}s · ${sel.video.resolution ?? '?'}`,
      sel.video.app ? `app: ${sel.video.app}` : '',
      sel.video.analysisStatus ? `analysis: ${sel.video.analysisStatus}` : '',
      sel.video.description ? `description: ${sel.video.description}` : '',
      sel.video.tags?.length ? `tags: ${sel.video.tags.join(', ')}` : '',
    );
  }

  if (sel.music) {
    lines.push(
      '',
      '## Music context',
      sel.music.id ? `id: ${sel.music.id}` : '',
      `instrumental: ${sel.music.instrumental ? 'yes' : 'no'}`,
      sel.music.model ? `model: ${sel.music.model}` : '',
      sel.music.prompt ? `prompt: ${sel.music.prompt}` : '(no prompt yet)',
    );
  }

  if (sel.fx) {
    lines.push(
      '',
      '## Selected FX',
      `id: ${sel.fx.id}`,
      `params: ${JSON.stringify(sel.fx.params)}`,
    );
  }

  if (sel.notes) {
    lines.push('', '## Notes', sel.notes);
  }

  if (!sel.video && !sel.music && !sel.fx) {
    lines.push('', '(No specific selection — talk generally about craft for the current view.)');
  }

  return lines.filter(Boolean).join('\n');
}

export function craftContextLabel(sel: CraftSelection): string {
  if (sel.video) return sel.video.id;
  if (sel.music?.id) return sel.music.id;
  if (sel.music?.prompt) return 'music draft';
  if (sel.fx) return `fx:${sel.fx.id}`;
  if (sel.view) return sel.view;
  return sel.surface;
}
