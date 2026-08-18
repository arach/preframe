# Homepage narrative structure

Created on 2026-07-06 from the feature inventory, current homepage, tone brief, and a Scout pass from `@missionwriter`.

## Decision

Keep the homepage small.

The current page shape is right:

1. Intro
2. Player
3. How it works
4. Run locally

The missing story is `unpack`: the raw capture becomes model-readable structure before the agent edits. That is the differentiator. The page should surface that step instead of adding a larger product-marketing funnel.

Do not add standalone homepage sections for music, captions, narration, review, and controls. The player already shows watch/review/controls, local clips, and timestamped notes. Those features belong inside the loop, not as separate sales sections.

## Winning narrative

Preframe is an agentic video editor for raw captures.

It breaks a recording into frames, scenes, transcripts, and motion so the agent has something concrete to edit from. A human writes the brief. The agent cuts a take. The human reviews the take in playback, marks the frame, leaves the note, tunes controls, and sends it back through the queue.

That is the homepage story:

`capture -> unpack -> brief -> render -> review -> control`

Product videos are one possible output. They are not the category.

## Section map

| Zone | Job | Keep/change |
| --- | --- | --- |
| Intro | Name the loop and the unpack step in plain language. | Replace the current intro paragraph. |
| Player | Prove the tool is real. Show watch/review/controls, notes, local clips, and takes. | Leave the structure alone. Keep first person in the narrated tour. |
| How it works | Explain the loop in six short steps. | Replace the five cards. Split the overloaded `shape` card. |
| Run locally | End plainly as a local developer tool. | Keep the existing try-band. |

## Hero copy

Replace the current intro paragraph with:

> Preframe is an agentic video editor for raw captures. It breaks a recording into frames, scenes, transcripts, and motion so the agent has something concrete to edit from. You write the brief, the agent cuts a take, and you steer the next one: mark the frame, leave the note, tune the controls.

Why this works:

- It keeps `agentic video editor for raw captures`.
- It explains what makes agent editing possible before asking the reader to watch a take.
- It keeps the human in control without sounding like policy or approval workflow.
- It does not lead with product videos.

## Player notes

The player is the strongest proof on the page. Keep the player-first layout.

Good existing lines to preserve:

- `This one starts with a raw OpenScout capture.`
- `The agent makes a cut, then notes and controls steer the next take.`
- `watch / review / controls`
- `timestamped`

Keep first person inside the stills tour. It reads like an example, which fits the tone brief. Keep page-level chrome declarative.

## How it works copy

Use six steps:

1. `capture`

   Start with a raw video capture: an OpenScout recording, a demo, or another recording you already have.

2. `unpack`

   Preframe breaks it into frames, scenes, transcripts, and motion, so the agent reads the recording instead of guessing from a prompt.

3. `brief`

   Tell the agent what the cut should find: hold this beat, skip the dead air, make it a short walkthrough.

4. `render`

   The agent plans the take and renders it. It lands back in the catalog as something you can watch.

5. `review`

   Step through the take, box the rough frame, leave a timestamped note.

6. `control`

   Steer pacing, music, captions, and framing. Real controls, then render again.

## Current page fixes

- Replace the hero paragraph at `docs/index.html:978`.
- Replace the loop grid at `docs/index.html:1076`.
- Remove the current `shape` step. It combines analysis, agent editing, and decomposition.
- Avoid `screen, camera, audio, stills, whatever is available`; it overreaches. Use `raw video capture` or `raw capture`.
- Leave the `Watch` nav label alone for now. The `How it works` anchor carries the story.
- Keep the existing try-band command.

## What not to do

- Do not turn this into an 8-section feature funnel.
- Do not add separate sections for audio, captions, narration, FX, or controls.
- Do not make music or narration sound like the main product.
- Do not imply every capture gets VLM analysis. Vision detail depends on provider setup.
- Do not imply narration is a general catalog UI flow. It is real, but script and Remotion driven today.
- Do not imply review notes are shared server artifacts. They are local until exported or submitted into a job.
- Do not use `product videos` as the category.
- Do not overuse `evidence`. Once is enough.
- Do not use clever reversal lines like `the capture stops being opaque` or `the brief has something to point at`.

## Copy bank

Use these only where they fit:

- Start with the messy capture, not a blank timeline.
- Preframe breaks a recording into scenes, frames, motion, transcript, and notes an agent can use.
- Write the brief like you would to an editor: find this moment, hold that beat, skip the dead air.
- The agent makes a cut. You decide whether it works.
- Mark the frame where it goes wrong.
- Leave the note where the problem happens, then send it back through the queue.
- Inspect the plan, the job, the source, and the render.
