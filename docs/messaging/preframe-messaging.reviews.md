# Preframe messaging — contributor reviews

Mission: `preframe-messaging.mission.md` (shape: review-rewrite)
Contributors: **grok-messaging** (xai / grok-4.3, strategic-review) · **chatgpt-messaging** (openrouter / openai/gpt-4.1, editorial-review)
Inputs reviewed: `site-inventory.md`, `tone-brief.md`

Reports below are the contributors' own output, verbatim (the only edit is unwrapping a stray outer code fence in the ChatGPT report so it renders).

---

## grok-messaging

Provider: xai
Model: grok-4.3
Role: strategic-review

# Preframe Messaging Review — grok-messaging

## 1. Diagnosis
Current copy drifts into grandiose or spec-writer register on multiple surfaces. Examples:
- `/concepts/` headlines ("Every frame, before the final frame", "Your cut, before the cut") read like manifesto lines.
- Walkthrough narration ("Product video. There's source code for it...") is slightly stiff and repetitive.
- Loop band steps feel like process documentation rather than personal description.
- Playlist descriptions occasionally slip into "Finished video for Talkie. Made the same way as the rest of this stuff" — functional but flat.
- README tagline ("stage the prompt, review the cut, ship the frame") is punchier than the desired first-person tone on the landing.

The production page (`/`) is already closer to the target voice than the other surfaces.

## 2. Proposed site taxonomy
```
/ (landing)
├── topbar (brand + nav: Watch, How it works, GitHub)
├── intro (h1 + one-paragraph personal note)
├── hero#watch
│   └── hudson-window (player + tabs + playlist)
├── loop-band#loop (4 plain steps)
├── try-band#try (local clone line)
└── footer

/concepts/ (secondary, keep but tone down)
├── mode bar (Pre-roll | Source | Hudson)
├── stage (per-mode copy)
└── notes#notes (short explanations only)

Nav anchors remain minimal; no new top-level pages.
```

## 3. Messaging map
| Zone | Purpose | Tone | Sample copy (1-2 sentences) |
|------|---------|------|-----------------------------|
| Intro | Set expectation | Personal, plain | I use this to make product videos from screen recordings. The source is in the repo; this page just shows the player. |
| Player meta (default clip) | Identify current take | Low-key | Talkie promo — finished version. |
| Playlist group labels | Organize clips | Simple nouns | clips, other takes, fx tries |
| Playlist listNote | Quick context | One short line | Reference take I kept for comparison. |
| Loop band steps | Show the cycle | First-person verbs | 1. Capture a screen recording. 2. Watch and mark frames. 3. Add notes. 4. Render again. |
| Try band | Local run | Direct command style | Clone and run locally: `git clone ...` |

## 4. Cross-page alignment
`/` should stay the primary, first-person surface. `/concepts/` can remain as a lightweight appendix but must drop manifesto phrasing and align loop vocabulary with the landing (capture/review/revise/done). README tagline can stay as internal shorthand; nothing from it needs to appear verbatim on the public pages. The three surfaces should share the same four-step cycle names so the operator does not have to maintain three glossaries.

## 5. Narration script — 6 revised beat lines
1. I start with a screen recording.
2. It gets cut down using presets I already saved.
3. When a frame looks off I mark it.
4. I can add a note like “more motion here.”
5. The note triggers another render.
6. Export and source stay linked so I can find the version later.

---

## chatgpt-messaging

Provider: openrouter
Model: openai/gpt-4.1-2025-04-14
Role: editorial-review

# Preframe Messaging Review — ChatGPT Messaging Contributor

## 1. Voice Audit

### Flagged Patterns

#### a. Permission-writer/Enterprise patterns
- Occasional phrases like “The source is in the repo. This page is just the player.” or “The source and MP4 should agree.” lapse into clinical or spec/compliance language.
- Extensive use of process sequences and passive constructs (“Gets cut down,” “It reads the notes, updates the source”) could slip into procedural/enterprise cadence.
- Chrome labels like “status: ready”, “studio | local”, and explanations like “source file · local preview” can feel like an operations manual.

#### b. Manifesto/Triumphal patterns
- `/concepts/` is particularly grandiose: “Every frame, before the final frame.” “Your cut, before the cut.” “The source is the output.” Reads like taglines, not walkthrough.
- README: “stage the prompt, review the cut, ship the frame.” Borderline clever tagline; shifts away from demo-showing energy.
- “A video is just code” (on `/hero-prototype`) is crisp but manifesto-heavy for current intent.

#### c. Other “off” patterns
- Use of “final,” “wip,” “take,” “brief,” etc. is not always intuitive for a new reader (term sprawl).
- Sequence names and playlist groups vary between pages—naming is fuzzy.

## 2. Revised Information Architecture (IA)

### IA Issues
- `/concepts/` has too much focus for a design-draft page; its three modes probably belong as either subordinate to the main site or in an about/dev notes section.
- Loop/step names, group labels, and playlists are inconsistent across the site.
- Often duplicate or over-explain simple mechanics.

### Proposal

#### Cut or Demote
- Remove/condense manifesto copy anywhere on the landing and limit `/concepts/` to an about/concepts section, not a nav pillar.
- Demote process- and architecture-heavy explanations off main/landing into expandable details/help areas.

#### Merge or Rename
- Unify the cycle/loop steps under concise, self-explanatory terms (see below).
- Consider merging “Review” and “Effects” under a single “Notes” or “Edits” if distinction isn’t maintained in UI.
- “Studio/Reviewer/Composer/Render” sidebar could be renamed for clarity if allowed (align with loop, e.g., “Clips/Review/Edit/Export”).

#### Reorder
- / Landing order: 1. Intro [personal], 2. Player [demo], 3. Loop [light walkthrough], 4. Try band [setup], 5. Footer.
- In playlists: Put finished, “best” demos first, then show alternate takes, then effects.

## 3. Complete Copy Deck (Proposed Patterns)

_This is a modular copy reference per key zone — not a full rewrite, but steer for each area:_

### Intro
**h1:** Preframe
**body:**
> I use this to make short product videos—just from screen recordings. Watch a take, mark a frame, jot a note, then render a new cut. Everything’s in the repo. This is just my demo player.

### Player Meta (Template)
- **Badge:** clip / take / fx
- **Title:** <Project or Take Name>
- **Description:** <One sentence. “Finished video for X. Made with this setup.”>
- **Actions:** [Quick tour] [How it works] [GitHub]
- **Status:** now playing <Title> · tab <TabName> · format <Format>

**Example (Talkie promo):**
- **Badge:** clip
- **Title:** Talkie promo
- **Description:** Finished video for Talkie. Same method as the others here.

### Playlist Pattern
_Group order:_ clips → takes → fx tries

_Group Names:_
- Clips (finished videos)
- Other takes (drafts/alternates)
- FX tries (experiment clips)

_Badge Vocabulary:_
- clip — primary finished work
- take — alternate/rough cut
- fx — effect variation

_List Note:_ Always a short, plain summary.

**Example Entry:**
- **talkie-promo (clip, Clips):**
  - List note: Finished Talkie video.
  - Title: Talkie promo
  - Description: Finished video for Talkie. Same method as the others here.

### Loop Steps (How it works)
_Keep it under 4 steps, active voice, plain terms:_

1. Add a recording or render something new.
2. Watch it back. Mark frames that need fixes, add notes.
3. It updates the file, queues another render.
4. Export the take you like. The video and its source stay in sync.

### Walkthrough — 6 Beats (Pattern)

**Each: one short sentence. All first-person, demo context.**

1. This is where I review screen recordings for product videos.
2. I cut them down with quick presets.
3. If a frame’s wrong, I mark it.
4. I leave notes—sometimes just "make this move more."
5. It re-renders in the background.
6. Video and source always match.

#### Rationale: All beats frame it as personal workflow. No “the system does X”/manifesto explanations—just what actually happens.

### Try band

“To try it yourself:”
`git clone github.com/arach/preframe && cd preframe && bun install && bun run dev`
<small>No installer — runs locally with bun.</small>

### Footer

preframe.dev
Built on Hudson · design drafts

## 4. Glossary — Canonical Terms

- **Clip** (final or showcase video)
- **Take** (alternate or draft version)
- **FX Try** (effect experiment)
- **Review** (watch + note phase)
- **Revise** (address notes, re-render)
- **Export** (finalize to video + source)
- **Playlist** (list of Clips/Takes/FX Tries grouped)
- **Loop** (the overall workflow cycle)
- **Tab** (Player view: Watch/Review/Effects only)
- **Sidebar** / **Rail** (left app chrome)
- **Notes** (timestamped comments)
- **Hudson** (the workspace shell — name not explained unless operator requests)
- Avoid: “Brief,” “Prompt,” “Before the cut,” unless used in actual UI

## 5. What NOT to Say — Banned Patterns

- “Every frame, before the final frame.”
- “Your cut, before the cut.”
- “stage the prompt, review the cut, ship the frame.”
- Any “X until it isn’t,” “the whole point is…,” or similar clever/inverting constructions
- “Reveal the…,” “the agent rewrites the source…,” “Preframe stages the prompt…”
- Intrusive process statements like “the video and source file should match” (rephrase as implication)
- Overly technical labels: “studio | local,” “status: ready,” “queued take-04.mp4” (keep as chrome only, not marketing)
- “Multi-app shell,” “Remotion TSX,” “Hyperframe HTML”—not in landing copy
- Repeated “just code” or manifesto-level explanations
- Any job permission, workflow compliance, “policy writer” phrasing
- No explicit restatements of the purpose of the page ("This page is just the player") where context makes it clear

**Summary:**
Messaging should move toward demo-energy, light narration, only the friendliest labels. Excise taglines and archi-diagram explanations. Playlist groups and loop steps should use same terms throughout. `/concepts/` copy needs heavy reduction/demotion for live site, but pattern can be migrated to `/about` or similar if considered valuable as background.

---

## Synthesis notes (consensus, disagreements, backlog)

### Consensus (both contributors agree)
- `/` is already closest to the target voice; the fix is mostly subtraction, not new copy.
- Keep the page first-person and plain. No manifesto headlines anywhere on the landing.
- One shared four-step cycle name across `/`, `/concepts/`, and README — stop maintaining three glossaries.
- The source↔video "they should match" line is preachy; keep at most one quiet mention, phrased as implication.
- `/concepts/` is the most off-voice surface: demote it, strip the tagline headlines, keep only short blurbs.
- Playlist stays three groups (finished → alternates → effects) with `clip` / `take` / `fx` badges.
- README tagline can remain internal shorthand; nothing from it needs to appear verbatim on the public page.

### Disagreements → recommended default
- **Loop step 4 label.** Grok keeps the current `done`; ChatGPT uses `Export`. README says `Ship`. → **Default: `Export`** (a plain verb, matches the playlist "export" action, avoids "ship" manifesto energy). Recommend README adopt `Export` too so all three align on **Capture → Review → Revise → Export**.
- **Group-label casing.** Grok keeps lowercase nouns (`clips`, `other takes`, `fx tries`); ChatGPT title-cases (`Clips`, `Other takes`, `FX tries`). → **Default: sentence case** (`Clips`, `Other takes`, `FX tries`) for the visible group label, lowercase for the per-item badge — matches existing chrome.
- **Intro length.** ChatGPT proposes a slightly longer, warmer body ("short product videos—just from…"); Grok trims harder. → **Default: keep the current short body, drop only the redundant final sentence** ("This page is just the player").
- **Sidebar rail rename / Review+Effects merge.** ChatGPT floats renaming the rail and merging tabs; Grok leaves chrome alone. → **Default: leave chrome as-is for this pass** (tone brief fixes the UI); list both as open questions for the operator.

### Priority backlog (highest leverage first)
1. Loop band: rename step 4 to **Export**, delete "It reads the notes, updates the source" system-voice and the "video and source should match" policy line.
2. `/concepts/`: demote to footer-only; replace the three manifesto headlines with one-line blurbs.
3. Walkthrough beat 5/6: drop "the system does X" voice; keep one quiet source mention.
4. Intro: cut the trailing "This page is just the player" sentence.
5. Cross-page: publish the canonical glossary (Clip / Take / FX / Review / Revise / Export / Loop) and align README loop wording.
