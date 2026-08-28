// OpenScout Reimagined — the flagship cut for the redesigned era.
//
// A new film, not a continuation of V3. Every frame comes from one capture,
// `openscout-reimagined-dark-device-master-cfr30.mp4` (1178×2556, 109.533 s,
// 3286 frames, CFR 30). No V3 or legacy footage is used anywhere in this edit.
//
// STORY
//
//   I    COMMAND   the surface itself — an agent has answered
//   II   INDEX     every conversation, one broker
//   III  SEE       what is working right now
//   IV   START     from a host and a project
//   V    CHOOSE    the agent, the model, the effort
//   VI   OBSERVE   the live Tail — the work proving itself
//   VII  BROWSE    projects and workspaces
//   VIII PRESENT   the real Presentation control, cycling its real values
//   IX   RETURN    back to the thread
//
// DIRECTION
//
// The device is locked. `FORMATS` holds the phone identical between `base` and
// `lensed` in all three aspect ratios, so nothing orbits, drifts, pulses or
// reposes. Energy is carried by the cuts, by the UI acting on its own, by the
// score, and by the detail lens — the only element that moves.
//
// COPY DISCIPLINE
//
// Nine lines, each under eight words, each describing exactly what is on screen
// at that moment. No claim is made beyond coordination and reachability: no
// delivery guarantees, no consensus, no cloud sync, no autonomy language. The
// mark is the canonical off-white #F7F4EA (`PALETTE.mark`); mint stays on rules,
// numerals and ticks.
//
// TWO FINDINGS FROM THE FRAME-ACCURATE SOURCE AUDIT
//
//  1. The Presentation control in this build offers **Scout, Messages, WhatsApp
//     and Original** — there is no "Split". The brief and CAPTURE_NOTES.md both
//     name Split; the footage does not contain it. Chapter VIII therefore plays
//     the four values the product actually shows, in the order it shows them.
//
//  2. The conversation at 0.000–12.90 s and the conversation at 96.166–109.53 s
//     are **pixel-identical** (verified by a difference blend over the full
//     frame: pure black). The capture does not re-render the thread in different
//     presentations, so this cut does not imply that it does. Chapter VIII shows
//     the selector and its four values; chapters I and IX use the thread as the
//     film's bookend, which is what the footage actually supports.
//
// GRID
//
// The bed is 144 BPM, so one bar is exactly 50 frames at 30 fps. Every chapter
// is a whole number of bars and every boundary lands on a downbeat:
//
//   3 + 3 + 3 + 3 + 4 + 3 + 3 + 4 + 3 = 29 bars content (1450 f)
//                                     +  4 bars outro   ( 200 f)
//                                     = 33 bars total   (1650 f = 55.000 s)

import type { Chapter, MontageEdit } from './edit'

const CHAPTERS: readonly Chapter[] = [
  {
    // 0–150 · 3 bars
    numeral: 'I',
    verb: 'COMMAND',
    line: 'One surface for the agents already working.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 1.0,
        sourceEnd: 5.0,
        rate: 1,
        note: 'talkie-epicurus — the agent reply and its receipt',
      },
      {
        kind: 'hold',
        source: 'reimagined',
        holdAt: 4.95,
        durationInFrames: 30,
        note: 'hold on the answered thread',
      },
    ],
    // The bubble's closing lines, "Read more", and the "Agent responded"
    // receipt. The top edge starts below the bubble's first line on purpose: at
    // y=420 the receipt landed inside the panel's 5% bottom mask and rendered as
    // a ghost. Verified on a rendered 1920×1080 still.
    lens: {
      rect: { x: 180, y: 468, w: 980, h: 686 },
      from: 30,
      to: 140,
      caption: 'AGENT · RESPONDED',
    },
  },
  {
    // 150–300 · 3 bars
    //
    // The broker index is only clean for ~0.85 s: the push transition settles at
    // 13.45 and the capture leaves for the For You surface at 14.33. Verified
    // frame by frame — an earlier pass started at 13.30 and caught the rail
    // still sliding. The beat therefore plays the real arrival at 1× and then
    // holds the captured frame while the lens reads the list.
    numeral: 'II',
    verb: 'INDEX',
    line: 'Every conversation, one broker.',
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
    // Header through the fifth row: names, last messages, ages.
    lens: {
      rect: { x: 25, y: 360, w: 1130, h: 790 },
      from: 28,
      to: 140,
      caption: 'SCOUT BROKER',
    },
  },
  {
    // 300–450 · 3 bars
    numeral: 'III',
    verb: 'SEE',
    line: 'See what is working, right now.',
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
    // WORKING NOW, the running session card, then mahler and lavoisier.
    lens: {
      rect: { x: 30, y: 490, w: 1120, h: 780 },
      from: 28,
      to: 140,
      caption: 'WORKING NOW',
    },
  },
  {
    // 450–600 · 3 bars
    numeral: 'IV',
    verb: 'START',
    line: 'Start from a host and a project.',
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
    // HOST row, the three projects, the 68-project count, and the composer
    // carrying its Opus 5 · MEDIUM chip.
    lens: {
      rect: { x: 30, y: 1310, w: 1120, h: 780 },
      from: 30,
      to: 140,
      caption: 'HOST · PROJECT',
    },
  },
  {
    // 600–800 · 4 bars
    //
    // The real selection happens at 22.498: the dot moves from Claude · Opus 5
    // (DEFAULT) to Codex · Sonnet 4.6 and the composer chip changes with it. The
    // window is chosen to sit either side of that frame so the change is watched
    // rather than asserted.
    numeral: 'V',
    verb: 'CHOOSE',
    line: 'Pick the agent, the model, the effort.',
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
    // Codex through Pi, plus the AUTO → MAX effort scale under them.
    lens: {
      rect: { x: 40, y: 1170, w: 1100, h: 770 },
      from: 34,
      to: 188,
      caption: 'AGENT · MODEL · EFFORT',
    },
  },
  {
    // 800–950 · 3 bars
    //
    // Five continuous seconds of the Tail, played straight. It scrolls on its
    // own from ~41.9, so this beat needs no hold and no rate change: the surface
    // supplies the motion.
    numeral: 'VI',
    verb: 'OBSERVE',
    line: 'Watch the work as it happens.',
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
    // 950–1100 · 3 bars
    numeral: 'VII',
    verb: 'BROWSE',
    line: 'Every project. Every workspace.',
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
    // 1100–1300 · 4 bars
    //
    // The film's centre of gravity, and the one beat that is worth its full
    // 6.667 s. The CHAT inspector arrives at 75.498 and the Presentation row
    // then cycles the product's own values, each with its own descriptor:
    //
    //   75.498 – 77.166   Scout      · "focused paper-and-ink"
    //   77.332 – 78.664   Messages   · "compact familiar…"
    //   78.830 – 80.166   WhatsApp   · "warm conversation…"
    //   80.332 –          Original   · "Scout's native con…"
    //
    // All four were read off the source at 6 fps. There is no Split value in
    // this build. The lens sits on the row for almost the whole beat so the
    // names and their descriptions are legible rather than implied.
    numeral: 'VIII',
    verb: 'PRESENT',
    line: 'Read it the way you read best.',
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
    // Wide enough to clear the per-row revert glyphs at x≈1130, which a 1000-wide
    // rect sliced in half. Verified on a rendered 1920×1080 still.
    lens: {
      rect: { x: 100, y: 496, w: 1045, h: 470 },
      from: 20,
      to: 190,
      caption: 'PRESENTATION',
    },
  },
  {
    // 1300–1450 · 3 bars
    //
    // Deliberately lens-free: the film has been magnifying detail for eight
    // chapters and the payoff should be the whole surface, quiet, before the
    // mark arrives.
    numeral: 'IX',
    verb: 'RETURN',
    line: 'Then back to the work.',
    cuts: [
      {
        kind: 'play',
        source: 'reimagined',
        sourceStart: 96.35,
        sourceEnd: 101.35,
        rate: 1,
        note: 'back to talkie-epicurus — the thread, whole',
      },
    ],
  },
] as const

export const EDIT_REIMAGINED: MontageEdit = {
  id: 'openscout-reimagined',
  slug: 'Reimagined',
  chapters: CHAPTERS,
  // A new 55.000 s master, cut and mastered for this film. See
  // public/tracks/openscout/openscout-reimagined-score.provenance.json.
  score: 'tracks/openscout/openscout-reimagined-score.wav',
  scoreGain: 0.92,
  // Between the 4-frame beat cuts of Edit A and the 24-frame dissolves of Edit
  // B. Fast enough that the film keeps moving, slow enough that a chapter is
  // never yanked away from the eye.
  dissolve: 12,
  outroFrames: 200,
  // The capture names its own host on screen.
  hostLabel: 'iOS · ARACHS MAC MINI',
  outro: {
    line: 'A command surface for the agents already working.',
    foot: 'YOUR AGENTS · YOUR PROJECTS · YOUR OWN MACS',
    tag: 'EARLY · LOCAL DEVELOPER PILOTS',
  },
}
