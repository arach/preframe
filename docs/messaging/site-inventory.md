# Preframe site — full text & taxonomy inventory

Aggregated snapshot for messaging rework. **Quoted text is verbatim** from deployed/static pages as of packaging date.

---

## Site map

| Path | File | Role |
|------|------|------|
| `/` | `docs/index.html` | **Production landing** — player embed, walkthrough, loop, try band |
| `/concepts/` | `docs/concepts/index.html` | **Design drafts** — three toggleable concept modes |
| `/hero-prototype` | `docs/hero-prototype.html` | **Alt hero** — split editor / revise-loop prototype (not linked from prod nav) |

**Footer on `/`:** links to Hudson + design drafts (`/concepts/`).

**Dev:** `bun run dev:site` → `http://localhost:4321/`

---

## Product context (README — not on site, but shapes tone)

Tagline: *stage the prompt, review the cut, ship the frame.*

Three app parts: **Catalog**, **Reviewer**, **Composer** (Remotion + Hyperframes).

Cycle: Capture → Review → Revise → Ship. Source and MP4 should agree.

---

## PAGE: `/` (`docs/index.html`)

### Meta
- **title:** Preframe
- **description:** I use this to make product videos from screen recordings. Watch takes, leave notes, re-render.

### Information architecture

```
topbar (brand + nav)
intro
hero#watch
  hudson-window
    window-head
    workspace
      sidebar (studio rail)
      player-area (tabs + stage + meta + status)
      inspector (playlist + meter)
    window-foot
  loop-band#loop
  try-band#try
footer
```

### Nav
- Watch → `#watch`
- How it works → `#loop`
- GitHub → github.com/arach/preframe

### Intro
- **h1:** Preframe
- **body:** I make product videos from screen recordings. Watch a take, mark a frame, leave a note, render again. The source is in the repo. This page is just the player.

### Window chrome
- **head:** `preframe / player` · status `ready`
- **sidebar label:** studio | local
- **sidebar rail:** Catalog (active), Review, Composer, Render
- **tabs:** Watch, Review, Effects
- **inspector label:** playlist | local clips
- **meter:** mode preview · tabs watch/review/fx · notes timestamped
- **foot:** video file + source file · local preview

### Default player meta (talkie-promo)
- **eyebrow/kind:** clip
- **title:** Talkie promo
- **description:** Finished video for Talkie. Made the same way as the rest of this stuff.
- **actions:** Quick tour · How it works · GitHub
- **status:** now playing Talkie promo · tab watch · format mp4

### Playlist taxonomy

**Groups:** `clips` · `other takes` · `fx tries`

| id | group | label | badge | listNote | title | description |
|----|-------|-------|-------|----------|-------|-------------|
| talkie-promo | clips | Talkie promo | clip | Finished Talkie video. | Talkie promo | Finished video for Talkie. Made the same way as the rest of this stuff. |
| mira-produced | other takes | Produced reference | take | Reference take. | Produced reference | Reference version I kept to compare against later notes. |
| mira-intro | other takes | Intro first cut | take | Short first cut. | Intro first cut | Early cut. Watch, note, render again. |
| mira-control | other takes | Control lanes | take | Cut from a long capture. | Control lanes | Long capture cut into lanes. |
| glass-grade | fx tries | Glass grade | fx | Soft grade. | Glass grade | Light glass grade on the same clip. |
| glass-fx | fx tries | Glass FX | fx | More motion. | Glass FX | Same clip with heavier glass motion. |
| lattice-born | fx tries | Lattice grid | fx | Grid intro. | Lattice grid | Short grid intro from the Lattices work. |

### View panels (decorative, tab-specific)

**Watch pills:** take-02 or treatment · source/wip/final · {format}

**Review (takes):**
- 00:14 — Hold this beat longer.
- 00:18 — Softer transition into the UI.
- general — Mostly timing notes now.

**Review (fx):**
- general — Grain is a bit heavy on the UI.
- general — Dial back bloom on the logo.
- general — Background can move more, UI should stay readable.

**Effects:** clean/glass/grain/scan or fx-specific — on/off labels

### Walkthrough (story mode)

**Button states:** Quick tour · Restart · Watch again · esc

**Narration beats (6):**
1. Product video. There's source code for it, but mostly I'm just watching playback.
2. Starts as a long screen recording. Gets cut down with presets I already have.
3. Bad frame? I put a box on it.
4. Add a note. Something like, more motion here.
5. It renders again. I check the queue later.
6. The export and the source file stay together.

**Stills:** studio-code · studio-assets · reviewer-clean · reviewer-annotated · studio-queue · studio-detail

### Loop band `#loop`
- **h2:** How it works
- **1 capture:** Put a screen recording in the inbox, or render something new.
- **2 review:** Watch it. Box the frames that look wrong. Add a note if needed.
- **3 revise:** It reads the notes, updates the source, queues another render.
- **4 done:** Pick a take. Export it. The video and the source file should match.

### Try band `#try`
- To run it locally:
- `git clone github.com/arach/preframe && cd preframe && bun install && bun run dev`

### Footer
- preframe.dev
- built on Hudson · design drafts

---

## PAGE: `/concepts/` (`docs/concepts/index.html`)

### Meta
- **title:** Preframe concept modes
- **description:** A toggleable Preframe landing concept with Pre-roll, Source, and Hudson Shell creative modes.

### IA
```
topbar (brand + mode bar + nav)
stage (copy rail + workbench)
notes#notes (3 columns)
footer
```

### Nav
- Home → /
- Notes → #notes
- GitHub

### Mode bar
Pre-roll · Source (default) · Hudson

### Variant: Pre-roll
- **eyebrow:** Source. Brief. Revise. Wip. Final.
- **headline:** Every frame, before the final frame.
- **subcopy:** Preframe stages the prompt, the cut, and the revise loop as one scrub-able take. Move through the work before the final render exists.
- **chips:** timeline-native · review loop · prompt staging · render queue
- **workbench:** preframe/pre-roll · playhead 00:14
- **foot:** source -> brief -> revise -> wip -> final · take-03 · 64% staged
- **timeline beats:** source / brief / revise / wip / final (with sublabels)

### Variant: Source
- **eyebrow:** Review the cut. Rewrite the source. Render again.
- **headline:** The source is the output.
- **subcopy:** Preframe turns timestamped review notes into code changes for Remotion and Hyperframe projects. The cut stays watchable, the diff stays inspectable, and every rendered frame has a source trail.
- **chips:** Remotion TSX · Hyperframe HTML · timestamped notes · inspectable diffs
- **workbench:** preframe/source-view · render queued take-04.mp4
- **foot:** review-notes.json -> revise-brief -> HeroScene.tsx · frame 418/720
- **sample note:** hold the dashboard beat longer → HeroScene.tsx
- **diff sample:** durationInFrames, ease, holdBeat
- **takes:** source take-01 · wip take-04 · final pending

### Variant: Hudson
- **eyebrow:** A multi-app shell for creative media work.
- **headline:** Your cut, before the cut.
- **subcopy:** Preframe stages source clips, motion prompts, and output loops inside Hudson before your timeline ever opens. The public page can preview the workspace without exposing the full app yet.
- **chips:** Hudson slots · catalog studio · review modal · composer handoff
- **workbench:** preframe/hudson-shell · 3 loops ready · 12 frames queued
- **foot:** catalog -> reviewer -> composer -> render worker · read-only workspace preview
- **sidebar:** Catalog · Reviewer · Composer · Render
- **notes:** 00:14 hold reveal · 00:18 soften music · general ending earned
- **inspector:** stage wip · engine remotion · source HeroScene · status queued

### Notes section
- **h2:** One design. Three readings.
- **Pre-roll:** landing as scrub-able take — source, brief, revise, wip, final
- **Source:** developer angle — reviewers mark video, Preframe changes the program
- **Hudson:** app-shell angle — Hudson-powered workspace

### Footer
- Concept route for preframe.dev
- Static HTML · deployable on Cloudflare Pages

---

## PAGE: `/hero-prototype` (`docs/hero-prototype.html`)

### Meta
- **title:** preframe - a video is just code.

### Nav
- preframe v0.1 · studio · engines · docs · github · branch main

### Hero
- **kicker:** scene 01 / the loop
- **h1:** A video is just code.
- **sub:** Mark the frame that's wrong. The agent rewrites the source and renders a new take. preframe is the studio where that loop lives - catalog, review, compose.
- **CTAs:** Clone the studio · Watch a revise loop

### Stage demo copy
- reviewer — product-launch.tsx
- wip · take_03 / rendering · take_04 / final · take_04
- wordmark aurora. · tagline ship the launch, not the timeline
- fx bloom-halation · annotation 00:02:14 logo lands too early
- change plan items + apply
- render queue take_04

*(Contains decorative Remotion TSX in code pane — not user-facing marketing copy.)*

---

## Cross-page tension map

| Theme | `/` (prod) | `/concepts/` | `/hero-prototype` | README |
|-------|------------|--------------|-------------------|--------|
| Tagline energy | Low/plain | High/manifesto | High/manifesto | Medium/tagline |
| Source=code thesis | Mentioned quietly | Central headline | Central headline | Central |
| Hudson visibility | Footer only | Whole mode | Absent | Framework mention |
| Loop naming | capture/review/revise/done | source/brief/revise/wip/final | revise loop | capture/review/revise/ship |
| First person | Yes | No | Mixed | No |
| Ship language | "done/export" | "final/ship" | "ship the launch" | "ship the frame" |

---

## Zones needing taxonomy decision

1. **Site entry** — intro h1 + one paragraph: what is this page?
2. **Player meta** — per-clip title + description pattern
3. **Playlist** — group names, badge vocabulary, listNote style
4. **Walkthrough** — beat count, line length, how technical
5. **Loop section** — step names, step count, relationship to README cycle
6. **Try band** — clone CTA tone
7. **Chrome labels** — sidebar rail, window head/foot, meter (dev-facing vs user-facing?)
8. **Concepts page** — keep, merge, or demote? Align with prod or stay exploratory?
9. **Relationship** between `/`, README, and app UI proper