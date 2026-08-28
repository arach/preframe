// Edit 2 — "Extended / explainer", ambient.
//
// This cut explains how OpenScout actually works rather than showing more
// screens. Nine beats:
//
//   CONNECT → personalize (light ↔ dark) → AUTHORIZE the device → ROUTE the work
//   → COMMUNICATE (the same thread in two real presentations, with the control
//     that changes it) → CHOOSE the agent and model → OBSERVE the work
//   → REACH across devices → mark
//
// Every explanatory beat is a real settings surface, not a graphic: the
// Identity, Routes and Chat inspectors all exist in the original capture and are
// used here at their own words. Claims stay inside OpenScout's actual posture —
// coordination and reachability ("first reachable wins", "authenticates the
// bridge"), never exactly-once delivery, consensus or cloud sync.
//
// **Why the light→dark turn is early (beat II).** The explanatory surfaces —
// Identity, Routes, Chat, the agent picker — only exist in the dark capture, so
// they cannot precede the turn. Rather than break the film's light→dark identity,
// the turn is used as the second beat: the film opens in daylight clarity,
// personalises, and then goes operational for the machinery. That is the one
// place this EDL departs from the requested beat order, and it is a footage
// constraint, not a preference.
//
// Pacing is the opposite of Edit 1: 24-frame dissolves, long holds, and the
// existing eerie/spacious 45.000 s score reused rather than regenerated. Several
// inspector panels are only on screen for well under a second (Routes is ~0.6 s),
// so those beats play the real transition at 1× and then hold the captured frame
// while the lens reads it.
//
//   5 + 5 + 4 + 5 + 8 + 5 + 5 + 3 = 40.000 s content + 5.000 s outro = 45.000 s

import type { Chapter, MontageEdit } from './edit'

const LIGHT = 1
const DARK = 0

const CHAPTERS: readonly Chapter[] = [
  {
    // 0–150
    numeral: 'I',
    verb: 'CONNECT',
    line: 'Your Macs, discovered and online.',
    cuts: [
      {
        kind: 'play',
        source: 'light',
        sourceStart: 1.6,
        sourceEnd: 6.6,
        rate: 1,
        note: 'light home feed — host online, agents working',
      },
    ],
    stageTone: [LIGHT, LIGHT],
  },
  {
    // 150–300 — the turn, on the product's own Mode row
    numeral: 'II',
    verb: 'PERSONALIZE',
    line: 'Make it yours — light or dark.',
    cuts: [
      {
        kind: 'play',
        source: 'light',
        sourceStart: 75.0,
        sourceEnd: 78.0,
        rate: 1,
        note: 'light settings — Appearance, Mode · Light',
      },
      {
        kind: 'play',
        source: 'dark',
        sourceStart: 117.9,
        sourceEnd: 119.9,
        rate: 1,
        note: 'dark settings — the same row, Mode · Dark',
        fade: 30,
      },
    ],
    stageTone: [LIGHT, DARK],
  },
  {
    // 300–420
    numeral: 'III',
    verb: 'AUTHORIZE',
    line: 'This iPhone, keyed to your Mac.',
    cuts: [
      // Identity is clean for only ~0.25 s (65.75–65.98); it cross-fades to Chat
      // from 66.07. Verified frame by frame — an earlier pass held at 66.15 and
      // silently showed the Chat panel here instead.
      {
        kind: 'play',
        source: 'legacy',
        sourceStart: 65.7,
        sourceEnd: 65.966667,
        rate: 1,
        note: 'settings · Identity — this device, public key',
      },
      {
        kind: 'hold',
        source: 'legacy',
        holdAt: 65.93,
        durationInFrames: 112,
        note: 'hold on the device identity',
      },
    ],
    lens: {
      rect: { x: 130, y: 500, w: 1020, h: 360 },
      from: 25,
      to: 110,
      caption: 'DEVICE · KEY',
    },
    stageTone: [DARK, DARK],
  },
  {
    // 420–570 — the routing layer
    numeral: 'IV',
    verb: 'ROUTE',
    line: 'First reachable wins — LAN, then tailnet, then relay.',
    cuts: [
      // Routes is clean 65.0–65.5; 64.90 catches the rail arriving on it.
      {
        kind: 'play',
        source: 'legacy',
        sourceStart: 64.9,
        sourceEnd: 65.4,
        rate: 1,
        note: 'settings · Routes — priority order and saved routes',
      },
      {
        kind: 'hold',
        source: 'legacy',
        holdAt: 65.4,
        durationInFrames: 135,
        note: 'hold on the transport stack',
      },
    ],
    lens: {
      rect: { x: 152, y: 484, w: 1012, h: 700 },
      from: 25,
      to: 140,
      caption: 'PRIORITY',
    },
    stageTone: [DARK, DARK],
  },
  {
    // 570–810 — conversation styles, demonstrated rather than asserted.
    //
    // The same feynman-2 thread, twice, with the real global control in between:
    //   59.4–61.0  the thread in the bubble presentation (View · Messaging)
    //   66.45–68.15 settings · Chat, where View visibly flips Messaging → Original
    //   71.5–74.5  the same thread re-rendered as a plain document (View · Original)
    //
    // All three windows are from the original capture and were found by audit —
    // no footage was recorded or recreated for this. Style names on screen are the
    // product's own: View Original/Messaging, Style Messages/WhatsApp, Detail
    // Normie/Techie.
    numeral: 'V',
    verb: 'COMMUNICATE',
    line: 'Original or Messaging. Techie or Normie.',
    cuts: [
      {
        kind: 'play',
        source: 'legacy',
        sourceStart: 59.4,
        sourceEnd: 61.0,
        rate: 1,
        note: 'feynman-2 in the bubble presentation',
      },
      {
        // The capture leaves this thread at 61.3, so the beat freezes on the last
        // bubble frame rather than cutting to the feed behind it.
        kind: 'hold',
        source: 'legacy',
        holdAt: 60.95,
        durationInFrames: 12,
        note: 'hold on the bubble presentation',
      },
      {
        kind: 'play',
        source: 'legacy',
        sourceStart: 66.45,
        sourceEnd: 68.15,
        rate: 1,
        note: 'settings · Chat — View flips Messaging → Original on screen',
        fade: 18,
      },
      {
        kind: 'hold',
        source: 'legacy',
        holdAt: 68.1,
        durationInFrames: 39,
        note: 'hold on View · Style · Detail',
      },
      {
        kind: 'play',
        source: 'legacy',
        sourceStart: 71.5,
        sourceEnd: 74.5,
        rate: 1,
        note: 'the same thread, now a plain document — and no tutorial toast',
        fade: 18,
      },
    ],
    // Sits on the control while it is on screen, so the style names are readable.
    lens: {
      rect: { x: 130, y: 500, w: 1020, h: 470 },
      from: 75,
      to: 148,
      caption: 'VIEW · STYLE · DETAIL',
    },
    stageTone: [DARK, DARK],
  },
  {
    // 810–960
    numeral: 'VI',
    verb: 'CHOOSE',
    line: 'Route the work to the right agent and model.',
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
        note: 'hold on the agent/model list',
      },
    ],
    lens: {
      rect: { x: 58, y: 650, w: 1098, h: 750 },
      from: 30,
      to: 140,
      caption: 'AGENT · MODEL',
    },
    stageTone: [DARK, DARK],
  },
  {
    // 960–1110
    numeral: 'VII',
    verb: 'OBSERVE',
    line: 'Watch the work happen — tool calls, replies, plans.',
    cuts: [
      {
        kind: 'play',
        source: 'dark',
        sourceStart: 55.2,
        sourceEnd: 60.2,
        rate: 1,
        note: 'dark logs — live cross-agent tail',
      },
    ],
    lens: {
      rect: { x: 20, y: 500, w: 1138, h: 720 },
      from: 25,
      to: 140,
      caption: 'LIVE TAIL',
    },
    stageTone: [DARK, DARK],
  },
  {
    // 1110–1200
    numeral: 'VIII',
    verb: 'REACH',
    line: 'Continue across your devices.',
    cuts: [
      {
        kind: 'play',
        source: 'dark',
        sourceStart: 85.8,
        sourceEnd: 88.8,
        rate: 1,
        note: 'shell — this iPhone driving a terminal on the paired Mac',
      },
    ],
    stageTone: [DARK, DARK],
  },
] as const

export const EDIT_B: MontageEdit = {
  id: 'openscout-v3-explainer',
  slug: 'Explainer',
  chapters: CHAPTERS,
  // Reused, not regenerated: the existing eerie/spacious 45.000 s master.
  score: 'tracks/openscout/openscout-montage-score.wav',
  scoreGain: 0.94,
  dissolve: 24,
  outroFrames: 150,
  outro: {
    line: 'A local-first control plane for coding agents.',
    foot: 'YOUR AGENTS · YOUR PROJECTS · YOUR OWN MACS',
    tag: 'EARLY · LOCAL DEVELOPER PILOTS',
  },
}
