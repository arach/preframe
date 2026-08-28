// Edit 1 — "Hype / appetizer", beat-led.
//
// A preview, not a feature tour. Four beats and out:
//
//   CONNECT → CHOOSE the agent and model → CONVERSE → DISPATCH → mark
//
// No relay explanation, no settings, no logs exposition, no repeated surfaces —
// all of that lives in Edit 2. The physical camera is locked; the cuts, the
// score and the detail lens carry it.
//
// Rhythm. The bed is the same MiniMax generation as before, re-mastered to a
// 21.667 s window at exactly 144.000 BPM, so one bar is exactly 50 frames at
// 30 fps and every chapter boundary lands on a downbeat:
//
//   3 + 3 + 2 + 2 = 10 bars = 500 frames = 16.667 s content
//   + 3 bars outro (150 frames)          = 13 bars = 650 frames = 21.667 s
//
// Timecodes refer to the CFR-30 masters; `legacy` is the original montage's
// capture, used only for the agent/model picker (see SOURCES).

import type { Chapter, MontageEdit } from './edit'

const CHAPTERS: readonly Chapter[] = [
  {
    // 0–150 · 3 bars
    numeral: 'I',
    verb: 'CONNECT',
    line: 'Your Macs, discovered and online.',
    cuts: [
      {
        kind: 'play',
        source: 'dark',
        sourceStart: 1.2,
        sourceEnd: 6.2,
        rate: 1,
        note: 'dark home feed — WORKING NOW, host online, agent updates',
      },
    ],
  },
  {
    // 150–300 · 3 bars — the hook
    numeral: 'II',
    verb: 'CHOOSE',
    line: 'Pick the agent, the model, the effort.',
    cuts: [
      {
        kind: 'play',
        source: 'legacy',
        sourceStart: 98.9,
        sourceEnd: 101.6,
        rate: 1,
        note: 'agent + model picker opens over the composer',
      },
      {
        kind: 'hold',
        source: 'legacy',
        holdAt: 101.6,
        durationInFrames: 69,
        note: 'hold on the agent/model list while the lens reads it',
      },
    ],
    lens: {
      rect: { x: 58, y: 650, w: 1098, h: 750 },
      from: 20,
      to: 140,
      caption: 'AGENT · MODEL',
    },
  },
  {
    // 300–400 · 2 bars
    numeral: 'III',
    verb: 'CONVERSE',
    line: 'Message an agent. Read the reply in the thread.',
    cuts: [
      {
        kind: 'play',
        source: 'dark',
        sourceStart: 28.4,
        sourceEnd: 31.733333,
        rate: 1,
        note: 'dark conversation — agent reply, Agent responded ✓',
      },
    ],
    // Sits high on the reply receipt: the capture carries a "Reactions and
    // replies" toast low in this whole passage and there is no toast-free dark
    // conversation frame anywhere in the V3 master.
    lens: {
      rect: { x: 300, y: 620, w: 866, h: 550 },
      from: 20,
      to: 88,
      caption: 'AGENT RESPONDED',
    },
  },
  {
    // 400–500 · 2 bars
    numeral: 'IV',
    verb: 'DISPATCH',
    line: 'Describe the task. Send it to the host.',
    cuts: [
      {
        kind: 'play',
        source: 'dark',
        sourceStart: 108.9,
        sourceEnd: 112.233333,
        rate: 1,
        note: 'hex compose — project inventory landed, composer ready',
      },
    ],
    lens: {
      rect: { x: 24, y: 1330, w: 1130, h: 820 },
      from: 20,
      to: 88,
      caption: 'HOST · PROJECTS · MODEL',
    },
  },
] as const

export const EDIT_A: MontageEdit = {
  id: 'openscout-v3-hype',
  slug: 'Hype',
  chapters: CHAPTERS,
  score: 'tracks/openscout/openscout-v3-beat-score-short.wav',
  scoreGain: 0.92,
  // Short dissolve: the cut should land, not melt.
  dissolve: 4,
  outroFrames: 150,
  outro: {
    line: 'A local-first control plane for coding agents.',
    foot: 'YOUR AGENTS · YOUR PROJECTS · YOUR OWN MACS',
    tag: 'EARLY · LOCAL DEVELOPER PILOTS',
  },
}
