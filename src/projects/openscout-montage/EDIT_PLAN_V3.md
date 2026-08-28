# OpenScout V3 — two-edit production note

Two films of deliberately different length and purpose, sharing one composition
system. `EDIT_PLAN.md` remains the record of the first montage.

- **Edit 1 — Hype / appetizer.** `edit-a.ts`, 650 frames / **21.667 s**, beat-led,
  score `openscout-v3-beat-score-short.wav` (144 BPM).
- **Edit 2 — Extended / explainer.** `edit-b.ts`, 1350 frames / **45.000 s**,
  ambient, score `openscout-montage-score.wav` (existing, reused).

## Script summaries

**Edit 1 (21.667 s).** A preview, not a tour. Four beats: the fleet is already
discovered and online; you open the picker and choose the agent, the model and
the effort; you read an agent's reply in the thread; you describe the next task
and send it to the host. Then the off-white mark. No relay explanation, no
settings, no logs exposition, no repeated surfaces — it exists to make someone
want the product, and it gets out in under twenty-two seconds.

**Edit 2 (45.000 s).** An explanation of how the thing actually works, told
entirely through real settings surfaces rather than diagrams. Your Macs are
discovered and online; you make the app yours with light or dark; this iPhone is
keyed to your Mac by a public key that authenticates the bridge; work reaches the
host by first-reachable-wins across LAN, tailnet and relay; **the same thread is
shown twice — as chat bubbles and as a plain document — with the global control
that changes it in between**; you route the work to the right agent and model; you
watch the work happen in the live tail; and you continue on the paired Mac from a
shell on the phone. Then the off-white mark. Every claim is coordination and
reachability — nothing asserts exactly-once delivery, consensus or cloud sync.

## Edit 1 — EDL (50-frame bars at 144 BPM)

| # | verb | bars | frames | source | lens |
|---|---|---:|---|---|---|
| I | CONNECT | 3 | 0–150 | dark 1.200–6.200 | — |
| II | CHOOSE | 3 | 150–300 | legacy 98.900–101.600 + hold @101.6 (69 f) | AGENT · MODEL |
| III | CONVERSE | 2 | 300–400 | dark 28.400–31.733 | AGENT RESPONDED |
| IV | DISPATCH | 2 | 400–500 | dark 108.900–112.233 | HOST · PROJECTS · MODEL |
| — | outro | 3 | 500–650 | — | — |

10 bars content + 3 bars outro = **650 frames / 21.667 s**.

## Edit 2 — EDL

| # | verb | frames | source | lens |
|---|---|---|---|---|
| I | CONNECT | 0–150 | light 1.600–6.600 | — |
| II | PERSONALIZE | 150–300 | light 75.000–78.000 → dark 117.900–119.900 | — |
| III | AUTHORIZE | 300–420 | legacy 65.650–66.183 + hold @66.15 (104 f) | DEVICE · KEY |
| IV | ROUTE | 420–570 | legacy 64.850–65.450 + hold @65.45 (132 f) | PRIORITY |
| V | COMMUNICATE | 570–810 | legacy 59.400–61.000 + hold @60.95 (12 f) → legacy 66.450–68.150 + hold @68.1 (39 f) → legacy 71.500–74.500 | VIEW · STYLE · DETAIL |
| VI | CHOOSE | 810–960 | legacy 98.900–101.600 + hold @101.6 (69 f) | AGENT · MODEL |
| VII | OBSERVE | 960–1110 | dark 55.200–60.200 | LIVE TAIL |
| VIII | REACH | 1110–1200 | dark 85.800–88.800 | — |
| — | outro | 1200–1350 | — | — |

**1350 frames / 45.000 s.**

### Beat V — conversation styles (source provenance)

The brief asked for a sequence proving OpenScout supports **distinct conversation
presentations**, not just one WhatsApp-like view — and said to record fresh
footage only if the audit found none. **The audit found it.** No footage was
recorded or recreated; all three windows are from the original montage capture
(`openscout-ios-2026-08-12-cfr30.mp4`), and they show the same `feynman-2` thread
before and after a real change to the global control:

| window | what is on screen |
|---|---|
| 59.400–61.000 | `feynman-2` rendered as **chat bubbles** — avatar, rounded bubbles, `Read more`, `11:03 AM` |
| 66.450–68.150 | `SETTINGS · INSPECTOR · CHAT`, where **`View` visibly flips `Messaging` → `Original`** on screen |
| 71.500–74.500 | **the same `feynman-2` thread** re-rendered as a **plain full-width document** — no bubbles, no per-message avatars |

The style names are the product's own, read off the control and not invented:

- **View** — `Original` / `Messaging` (`Original keeps Scout's exist…`)
- **Style** — `Messages` / `WhatsApp` (`Messages or WhatsApp co…`)
- **Detail** — `Normie` / `Techie` (`Normie talks like a person; Te…`)

The chapter line quotes four of them directly. The lens sits on the control while
it is on screen so the names are readable at 1080p, and the phone carries the two
conversation presentations full-frame either side of it.

Two capture facts shaped the cut: the thread leaves the screen at 61.3 s, so the
bubble beat **freezes on its last bubble frame** rather than cutting to the feed
behind it; and the plain/`Original` presentation carries **no tutorial toast**,
unlike every bubble-style conversation in these captures.

Several inspector panels are on screen for well under a second — Routes is ~0.6 s,
Identity ~0.5 s — because the capture taps quickly through the rail. Those beats
play the real transition at 1x and then **hold the captured frame** while the lens
reads it, the same technique the first montage used for Routes. Captured pixels,
no slow-motion judder.

## Story beats removed in this pass

Dropped from both films as redundant surface tours: the **Chats list** (in both
light and dark — the conversation beat already establishes threads), the **agent
identity sheet**, the **light/dark home and thread "rhyme" pairs**, the standalone
**TUNE / settings-appearance** beat in the beat-led cut, and the second
**DISPATCH** pass in the long cut. The beat-led cut additionally dropped **logs**,
**shell** and all **settings** exposition — it is now a four-beat preview.

## Camera — locked (operator direction 2026-08-13)

There is no camera. `rotY`, `rotX`, drift and per-chapter pose are gone from the
data model entirely (the `camera` field was removed from `Chapter`, and `settle`
from `MontageEdit`), the lens-driven scale ease is gone, and the phone's specular
sheen no longer travels with the frame. The device fields are identical between
each format's `base` and `lensed` states, so the shell does not move, shrink or
repose when a lens arrives — only the lens and the type recompose. Formats were
re-proportioned so the lensed arrangement fits around a stationary phone.

"Centered" is read as centred in the phone's own column rather than the frame:
the landscape and square layouts put type and lens in the opposite column, and
frame-centring the device would leave nowhere for them.

## Brand — off-white mark, verified on pixels

`WireMark` inlines the canonical `openscout-wire-mark.svg` geometry at
`#F7F4EA`, at full opacity in both header and outro. Verified by sampling the
rendered PNGs, not the source: the outro mark's brightest pixel is exactly
**rgb(247,244,234) = #F7F4EA**, and the header mark is a neutral off-white
(R≥G>B). Nothing renders the logo mint. Mint remains only on rules, chapter
numerals, progress ticks and the lens caption dash.

## Architecture

`edit.ts` holds only what both films share: sources, palette, types, the
placement function, and the three format layouts. Each film is a `MontageEdit`
value (`edit-a.ts`, `edit-b.ts`) consumed by one `OpenScoutMontage` component.
Adding a third edit is a data file; adding a fourth aspect ratio is an entry in
`FORMATS`. Cuts carry their own `source`, so a single film can draw from both
masters — which is what makes Edit B's turn possible at all.

Compositions register as `<EditSlug>-<Format>`: `Hype-Landscape`,
`Explainer-Vertical`, and so on — six in total.

## Renders

```sh
bun run scripts/render-openscout-v3.ts   # all six: 3 formats x 2 edits
bun run scripts/validate-openscout-v3.ts # media checks + representative stills
bun run scripts/register-openscout-v3-treatments.ts  # into the Preframe catalog
```

Two stages per target. Remotion writes to `out/openscout-v3/_raw/`; a lossless
`-c copy` remux then completes the BT.709 signalling in both the SPS VUI and the
container and moves `moov` before `mdat`. Delivered files are
`out/openscout-v3/*.mp4`.

## Known compromise

**The dark conversation carries a tutorial toast.** A `Reactions and replies ·
Touch and hold any message.` toast is present across the *entire* dark
conversation passage (27–40 s) — verified frame by frame on the CFR master;
there is no toast-free dark conversation frame anywhere in the V3 dark capture.
Edit A therefore makes CONVERSE its shortest chapter (2 bars / 3.33 s) and aims
the lens at the reply payoff — the end of the agent's message and the
`4:34 PM · Agent responded ✓` receipt — high above the toast, so the eye is
pulled away from it. The toast remains legible on the phone itself at that size.

Edit 2 shows the same dark conversation and carries the same toast for its
4.0 s CONVERSE beat, with the lens likewise aimed above it.

**Two smaller continuity notes on the legacy-sourced beats.** The original
capture's status bar shows a green *charging* battery where the V3 masters show a
white one, and its footer reads `Arts Mac mini` where V3 reads `Arachs Mac mini`
— the host was renamed between captures. Both are a few pixels at the very top
and bottom of the phone at delivered sizes.
