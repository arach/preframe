---
shape: review-rewrite
workdir: .
model: default
contributors:
  - id: grok-messaging
    provider: xai
    model: grok-4.3
    role: strategic-review
    weight: primary
    prompt: |
      You are reviewing preframe.dev landing messaging. Read the inputs.
      Return a markdown report with:
      1. Diagnosis — what feels grandiose, spec-writer, or off-voice (cite examples)
      2. Proposed site taxonomy — pages, sections, nav, playlist groups, walkthrough beats
      3. Messaging map — table of zone → purpose → tone → sample copy (1-2 sentences each)
      4. Cross-page alignment — how /, /concepts/, README should relate
      5. Narration script — 6 revised beat lines (plain, personal, not manifesto)
      Do NOT propose visual/design changes. Words and IA only.
  - id: chatgpt-messaging
    provider: openrouter
    model: openai/gpt-4.1
    role: editorial-review
    weight: primary
    prompt: |
      You are reviewing preframe.dev landing messaging. Read the inputs.
      Return a markdown report with:
      1. Voice audit — flag permission-writer / enterprise / manifesto patterns
      2. Revised information architecture — what to cut, merge, rename, reorder
      3. Complete copy deck — intro, player meta template, loop steps, footer, try band, one demo entry as pattern
      4. Glossary — canonical terms (avoid synonym sprawl for loop stages, tabs, groups)
      5. What NOT to say — list of banned phrases/patterns from current inventory
      Tone target is in tone-brief.md. Do NOT propose CSS/layout changes.
inputs:
  - site-inventory.md
  - tone-brief.md
outputs:
  - preframe-messaging.reviews.md
  - preframe-messaging-spec.draft.md
budget:
  tokens: 120000
  toolCalls: 40
---

# Mission: Preframe site messaging & taxonomy rework

## Context

Preframe (`preframe.dev`) is a personal Hudson-powered workspace for making product videos from screen recordings. The **visual scaffolding is done** — dark editorial player shell, walkthrough story mode, playlist, loop band. The **words are wrong**: still too grandiose, spec-writer, or job-permission-writer in places. Operator wants a chill first-person share, not a product launch.

**You are not implementing HTML.** Produce a messaging spec others can apply later.

## Inputs

- `site-inventory.md` — verbatim copy + taxonomy from all pages
- `tone-brief.md` — voice constraints and what stays fixed

## Task

1. Read both inputs fully.
2. Run contributor review (Grok + ChatGPT via configured providers). Save their full reports into `preframe-messaging.reviews.md` with clear section headers per contributor.
3. Synthesize consensus into `preframe-messaging-spec.draft.md` containing:

### Required sections in spec draft

**A. Executive summary** (5 bullets max)

**B. Site taxonomy** — tree diagram or outline of pages, sections, nav, anchors

**C. Messaging map** — every user-facing zone on `/` with: current copy → problem → proposed copy

**D. Playlist & demo copy pattern** — group names, badge vocabulary, title/description templates, 2 worked examples

**E. Walkthrough narration** — 6 beats with proposed lines + rationale (one line each)

**F. Loop section** — step names + copy (align or deliberately diverge from README — state choice)

**G. Concepts page (`/concepts/`)** — keep/demote/rewrite recommendation for all three modes

**H. README ↔ site alignment** — should README tagline change? what carries to landing?

**I. Banned patterns** — phrases and rhetorical moves to avoid

**J. Open questions** — decisions only the operator can make

## Rules

- Plain language. No new manifesto headlines.
- Prefer first-person where the operator is sharing a personal tool.
- Do not edit `docs/index.html` or other site files in this mission.
- If contributors disagree, note both views and recommend a default.
- Target reader: operator applying copy to existing HTML scaffolding.

## Hard completion requirements (non-negotiable)

You MUST use the Write tool to create both output files on disk before finishing:

1. `preframe-messaging.reviews.md` — full Grok + ChatGPT contributor reports, verbatim or clearly sectioned
2. `preframe-messaging-spec.draft.md` — synthesized spec per sections A–J above

Paths are relative to workdir (`docs/messaging/`). Do not describe writing these files in chat — actually write them. Before declaring done, run `ls -la` on workdir and confirm both files exist with non-zero size. If either is missing, write it.