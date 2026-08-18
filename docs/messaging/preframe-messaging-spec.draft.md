# Preframe site messaging & taxonomy — spec draft

Source mission: `preframe-messaging.mission.md` · shape: review-rewrite
Synthesized from: `site-inventory.md`, `tone-brief.md`, and `preframe-messaging.reviews.md` (grok-messaging + chatgpt-messaging).
Target reader: operator applying copy to the existing HTML scaffolding. **Words and IA only — no HTML/CSS edits in this mission.**

---

## A. Executive summary

- `/` is already close to the target voice. The work is **subtraction** — cut manifesto and system-voice lines, don't add new headlines.
- Adopt **one** cycle name everywhere: **Capture → Review → Revise → Export**, on `/`, `/concepts/`, and README.
- Demote `/concepts/` to a footer-linked draft; strip its three tagline headlines down to one-line blurbs.
- Say the source↔video relationship **once**, quietly, as an implication — never as a "should match" policy line.
- Every `/` zone follows current copy → problem → proposed copy below; nothing here proposes a redesign.

---

## B. Site taxonomy

```
/  (production landing — primary, first-person)
├── topbar            brand "Preframe" + nav
│                       Watch → #watch · How it works → #loop · GitHub
├── intro             h1 + one short personal paragraph
├── hero #watch
│   └── hudson-window
│       ├── window-head     preframe / player · status (chrome only)
│       ├── workspace
│       │   ├── sidebar      studio rail: Catalog / Review / Composer / Render (chrome only)
│       │   ├── player-area  tabs (Watch / Review / Effects) + stage + meta + status
│       │   └── inspector    playlist + meter
│       └── window-foot
├── loop-band #loop   "How it works" — 4 steps (Capture / Review / Revise / Export)
├── try-band  #try    local clone line
└── footer            preframe.dev · built on Hudson · design drafts → /concepts/

/concepts/  (SECONDARY — demoted; reachable only from footer "design drafts")
├── mode bar          Pre-roll · Source · Hudson
├── stage             one-line blurb per mode (no manifesto headlines)
└── notes #notes      short explanations only

/hero-prototype  (UNLINKED alt hero — leave out of nav; see Open Questions)

README  (external; not on site, but shares the cycle vocabulary)
```

No new top-level pages. Nav stays three anchors. Both contributors agree the only structural move is **demoting `/concepts/`** out of any nav-pillar role.

---

## C. Messaging map — every user-facing zone on `/`

Format: **current copy → problem → proposed copy.**

**Intro h1**
- Current: `Preframe`
- Problem: none.
- Proposed: `Preframe` (keep).

**Intro body**
- Current: "I make product videos from screen recordings. Watch a take, mark a frame, leave a note, render again. The source is in the repo. This page is just the player."
- Problem: last sentence restates the obvious; "The source is in the repo" verges on spec-note.
- Proposed: "I make product videos from screen recordings. Watch a take, mark a frame, leave a note, render again. The source lives in the repo." *(drop "This page is just the player.")*

**Default player meta — title / description (talkie-promo)**
- Current: title `Talkie promo`; description "Finished video for Talkie. Made the same way as the rest of this stuff."
- Problem: "the rest of this stuff" is filler.
- Proposed: title `Talkie promo`; description "Finished video for Talkie. Made with this same setup."

**Player status line**
- Current: "now playing Talkie promo · tab watch · format mp4"
- Problem: fine as chrome; keep, don't market it.
- Proposed: keep verbatim (chrome).

**Tabs**
- Current: `Watch · Review · Effects`
- Problem: Review vs Effects overlap (both are notes); acceptable if UI keeps them distinct.
- Proposed: keep `Watch · Review · Effects`. (Merge → Open Question.)

**Sidebar rail / window head+foot / meter**
- Current: `studio | local`, `Catalog/Review/Composer/Render`, `status ready`, `video file + source file · local preview`, `mode preview · tabs watch/review/fx · notes timestamped`
- Problem: reads like an ops manual if treated as copy.
- Proposed: keep as **chrome only** — do not surface in marketing/narration. (Rename → Open Question.)

**Loop band** — see Section F.

**Try band**
- Current: "To run it locally:" + `git clone github.com/arach/preframe && cd preframe && bun install && bun run dev`
- Problem: fine; slightly terse.
- Proposed: "To try it locally:" + same command. Optional small line: "No installer — it runs locally with bun."

**Footer**
- Current: "preframe.dev" · "built on Hudson · design drafts"
- Problem: none; "design drafts" is the correct demoted entry point for `/concepts/`.
- Proposed: keep.

---

## D. Playlist & demo copy pattern

**Group names** (order = finished → alternates → effects):
1. **Clips** — finished videos (badge `clip`)
2. **Other takes** — drafts / alternate cuts (badge `take`)
3. **FX tries** — effect experiments (badge `fx`)

> Default casing: sentence-case group **labels**, lowercase **badges**. (Grok wanted all-lowercase; ChatGPT title-cased — see reviews "Disagreements".)

**Badge vocabulary:** `clip` (primary finished), `take` (alternate/rough), `fx` (effect variation). No other badge words.

**Title template:** `<Project or take name>` — short noun phrase, no tagline.
**Description template:** one plain sentence. Pattern: "`<What it is>. <How/why in one clause>.`"
**listNote template:** one short phrase, ≤ 6 words.

**Worked example 1 — finished clip**
- group: Clips · badge: `clip`
- title: `Talkie promo`
- listNote: "Finished Talkie video."
- description: "Finished video for Talkie. Made with this same setup."

**Worked example 2 — fx try**
- group: FX tries · badge: `fx`
- title: `Glass grade`
- listNote: "Soft grade."
- description: "Same clip with a light glass grade, to compare against the plain cut."

---

## E. Walkthrough narration — 6 beats

First-person, one sentence each, no "the system does X." Merges Grok's narration with ChatGPT's voice audit; keeps exactly one quiet source mention (beat 6).

1. **"This is a product video — there's source behind it, but mostly I just watch it back."**
   *Rationale: sets personal, demo register; names the source once without preaching.*
2. **"It starts as a long screen recording, cut down with presets I already have."**
   *Rationale: explains origin in plain past-tense; "presets I already have" keeps it personal.*
3. **"If a frame looks wrong, I put a box on it."**
   *Rationale: concrete action verb; mirrors the actual UI gesture.*
4. **"Then I leave a note — something like 'more motion here.'"**
   *Rationale: shows the note mechanic with a real, casual example.*
5. **"It renders again and I check the queue later."**
   *Rationale: keeps the async reality without "the system reads your notes" machine-voice.*
6. **"The export and its source file stay together, so I can find this version again."**
   *Rationale: the one allowed source↔video line — framed as personal benefit, not policy.*

---

## F. Loop section (`#loop`)

**Heading:** keep `How it works`.
**Decision: align with README** on a single four-step cycle — **Capture → Review → Revise → Export** — and change README's "Ship" to "Export" so all surfaces match. (README currently: Capture → Review → Revise → Ship; landing currently: capture/review/revise/done.) "Export" is plain, matches the player's export action, and avoids "ship" launch-energy flagged in the tone brief.

| # | Step | Proposed copy | Replaces |
|---|------|---------------|----------|
| 1 | **Capture** | "Drop a screen recording in the inbox, or render something new." | "Put a screen recording in the inbox, or render something new." (keep, light edit) |
| 2 | **Review** | "Watch it back. Box the frames that look wrong, add a note if you need to." | "Watch it. Box the frames that look wrong. Add a note if needed." (keep, light edit) |
| 3 | **Revise** | "It picks up the notes and queues another render." | "It reads the notes, updates the source, queues another render." (**cut** the system-voice "reads the notes, updates the source") |
| 4 | **Export** | "Pick the take you like and export it." | "Pick a take. Export it. The video and the source file should match." (**cut** the "should match" policy line — it's now implied by walkthrough beat 6) |

---

## G. Concepts page (`/concepts/`) — keep / demote / rewrite

**Overall: DEMOTE** the whole page from any nav role to the footer "design drafts" link only (both contributors agree). Keep the three-mode toggle as an exploratory appendix, but **rewrite every headline** to drop manifesto phrasing.

| Mode | Recommendation | Why | Replacement direction |
|------|----------------|-----|-----------------------|
| **Pre-roll** | Demote + rewrite | "Every frame, before the final frame." is a pure tagline. | One-line blurb: "The landing read as a scrub-able take: source → brief → revise → wip → final." Drop the headline and the chip wall. |
| **Source** | Keep + rewrite | Closest to a real explanation (developer angle), but "The source is the output." is manifesto. | Plain blurb: "The developer angle — review notes become code changes, so every rendered frame has a source trail." Keep the diff/notes sample as illustration. |
| **Hudson** | Demote + rewrite | "Your cut, before the cut." is the weakest tagline; Hudson is footer-only on `/`. | Plain blurb: "The workspace angle — Preframe runs inside Hudson (catalog → reviewer → composer → render)." No "multi-app shell" marketing. |

Keep the `#notes` section's "One design. Three readings." framing but as plain captions, not headline poetry. Migrating this content to an `/about` route is a valid alternative (ChatGPT) — flagged as Open Question.

---

## H. README ↔ site alignment

- **Tagline** "stage the prompt, review the cut, ship the frame." → **does not need to appear on the site**, and both contributors say it can stay as internal shorthand. Recommendation: keep it in README if you like it, but it is not landing copy. If you want one voice everywhere, retire it; otherwise leave it README-only.
- **What carries to the landing:** the README/meta sentence — "I use this to make product videos from screen recordings. Watch takes, leave notes, re-render." — is already the right first-person anchor. Keep it as the intro's backbone.
- **Cycle vocabulary:** change README's "Ship" → "Export" so README, `/`, and `/concepts/` all read **Capture → Review → Revise → Export**.
- **Keep README-only:** the app-architecture detail (Catalog / Reviewer / Composer; Remotion + Hyperframes). None of it belongs in landing copy.

---

## I. Banned patterns

Consolidated from both contributors. Do not use, on any public surface:

- Manifesto headlines: "Every frame, before the final frame.", "Your cut, before the cut.", "The source is the output.", "A video is just code."
- The tagline "stage the prompt, review the cut, ship the frame." as on-page copy.
- Clever inversions / twist constructions: "X until it isn't", "the whole point is…", "before the cut", "your cut, before the cut".
- System-voice process narration: "the agent rewrites the source…", "it reads the notes, updates the source…", "Preframe stages the prompt…".
- Source↔video as a **policy/compliance** statement: "the video and the source file should match", "source and MP4 should agree." (One quiet implication only — walkthrough beat 6.)
- Architecture-diagram copy in user-facing text: "multi-app shell", "Remotion TSX", "Hyperframe HTML", chip walls (`timeline-native · review loop · prompt staging`).
- Redundant purpose restatements: "This page is just the player" where context already makes it obvious.
- Term sprawl: don't introduce `brief`, `prompt`, `wip`, `final`, `ship` as new public vocabulary — stick to the glossary (Clip / Take / FX / Capture / Review / Revise / Export / Loop / Note).
- Job-permission / enterprise / compliance cadence anywhere.

---

## J. Open questions (operator decisions)

1. **Loop step 4 label** — confirm **Export** (recommended) vs keeping the current "Done". Affects README too.
2. **Intro register** — keep plain "Preframe" + body, or open warmer (e.g. a "Hey —" lead)? Tone brief says low-key; default is no greeting.
3. **One source mention** — OK to keep the single source↔video line in walkthrough beat 6, or remove every source mention from narration?
4. **Group-label casing** — confirm sentence-case labels (`Clips`, `Other takes`, `FX tries`) with lowercase badges.
5. **Chrome renames** — leave the sidebar rail (`Catalog/Review/Composer/Render`) and `studio | local` as-is, or rename to match the loop (e.g. `Clips/Review/Edit/Export`)? Default: leave for this pass.
6. **Tabs** — keep `Review` and `Effects` as separate tabs, or merge into one "Notes" tab?
7. **`/concepts/` home** — keep it at `/concepts/` (footer-linked) or migrate the three blurbs to an `/about` route?
8. **`/hero-prototype`** — leave unlinked, fold its one usable line into `/concepts/ Source`, or delete?
9. **README tagline** — retire "stage the prompt, review the cut, ship the frame." for one voice everywhere, or keep it README-only?
