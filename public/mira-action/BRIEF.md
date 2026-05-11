# Mira intro v2 brief

## Objective

Create a richer intro for the Mira control-lanes demo. The first cut is good and should be treated as the baseline direction: premium, editorial, runtime-flavored, and not generic marketing. V2 should make Mira feel like an actor in the system and tee up the actual product demo.

## Duration

Target 18 to 24 seconds.

Deliver:

- standalone intro MP4
- optional joined full cut: intro plus the published control-lanes demo
- short notes on concept, timing, and any asset caveats
- if practical, 2-3 distinct rough variants instead of over-polishing one path

## Product framing

Mira is the agent-facing product personality.

Action.app is the native macOS runtime underneath. It owns AppKit lifecycle, permissions, WebKit, capture, native input, and the recording probe path.

The story should be:

1. Mira wakes up as an actor.
2. Mira observes real surfaces.
3. Mira resolves targets through browser, AX, and native context.
4. Mira acts through local control lanes.
5. Mira records a trace and a finished artifact.
6. The main demo begins.

## Creative direction

Keep:

- dark product-native field
- monospace runtime/log vocabulary
- thin teal/cyan AX target geometry
- minimal copy
- editorial timing
- restrained, premium motion

Add:

- Mira actor presence from the sprite pack
- at least one short glimpse of the real source video
- a clearer transition into the main demo
- subtle audio if useful, but no heavy VO required
- appropriate effects from Remotion, Hyperframes, or the local Preframe toolkit

Avoid:

- generic SaaS hero-video language
- stock-video energy
- fake UI that looks unrelated to the source demo
- cute mascot comedy
- long paragraphs of explanatory text
- effects that drown out the actual product/runtime feeling

## Tooling

Use whatever Preframe-native path is fastest and strongest:

- Remotion compositions are welcome.
- Hyperframes compositions/effects are welcome.
- Existing Preframe toolkit effects are welcome when they support the concept.

This does not need to stay typographic. Effects can include scan pulses, target
brackets, gesture trails, lattice/routing motifs, tasteful glitch, bloom,
terminal assembly, or other runtime-native motion language. Keep effects in
service of Mira observing/resolving/acting/recording.

Audio is also open. Explore tasteful options:

- tiny resolve ping
- soft control-lane ticks
- low sub tail under the wordmark
- quiet UI/terminal texture
- short ambient bed

Avoid heavy voiceover for now unless there is a very compelling reason.

## Script / beat sheet

Suggested timing for 20 seconds:

0.0-2.0
Black field. A tiny runtime pulse appears. Mira actor flickers or idles into view.
Text: "Mira online"

2.0-5.0
Log lines appear around Mira, not as a terminal wall:
- observe surface
- resolve target
- act locally
- record proof

5.0-8.0
Use the real key frames or raw video as a soft window/viewport. Show a glimpse of the Google/search or prompt flow. AX brackets find a target.
Text label: "AX + browser context"

8.0-11.5
Mira shifts from idle/thinking to typing or success. A cursor/control-lane motif travels from actor to video target.
Text label: "native control lanes"

11.5-15.0
Brief real-video beat: cursor snap, prompt typing, or target resolve moment. Keep it short, maybe 1-2 seconds, framed cleanly.
Text label: "trace + capture"

15.0-18.0
The first-cut wordmark idea returns: "Mira" resolves inside AX brackets.
Small tag: "action.app agent runtime"

18.0-20.0
Transition into the main control-lanes demo. End frame should be easy to concatenate into the published MP4.

## Copy

Preferred exact copy:

- Mira online
- observe surface
- resolve target
- act locally
- record proof
- AX + browser context
- native control lanes
- trace + capture
- action.app agent runtime

Use less copy if the motion makes the point.

## Assets

Preframe-local handoff root:

`/Users/art/dev/preframe/public/mira-action`

Asset logistics are not the main task. Use the Preframe-local copies if they
are convenient, or reference the original `/Users/art/dev/action/...` paths
directly if that is easier. Do not spend time copying files back into the
`action` repo; the operator will find and place final outputs.

Actor:

- `actor/pet.json`
- `actor/spritesheet.webp`

Source/reference:

- `source/mira-demo-raw.mp4` - 52.66s raw-ish source, 1720x1410
- `source/action-mira-polished-demo.mov` - MOV raw take, same content
- `source/mira-demo-produced-reference.mp4` - produced reference cut
- `source/mira-control-lanes-demo-published.mp4` - current committed page asset
- `source/mira-intro-first-cut.mp4` - first intro cut for style baseline
- `source/mira-control-lanes-poster.png`
- `source/mira-fast-mark-easter-egg.png`
- `source/contact-sheet.png`
- `source/produced-contact-sheet.png`
- `source/key-elements/frames/*.png`
- `source/key-elements/annotated/*.png`
- `source/key-elements/vision-report.json`
- `source/demo-trace.log`
- `source/audio-cues.jsonl`

## Actor notes

The Mira actor is a Lattices-compatible sprite pack.

Frame metadata:

- frame width: 192
- frame height: 208
- idle: row 0, 8 frames, 6 fps
- blink: row 1, 4 frames, 12 fps
- run_right: row 2, 8 frames, 12 fps
- run_left: row 3, 8 frames, 12 fps
- thinking: row 4, 8 frames, 6 fps
- typing: row 5, 8 frames, 10 fps
- success: row 6, 8 frames, 12 fps
- error: row 7, 5 frames, 8 fps
- sleep: row 8, 8 frames, 4 fps

Use Mira as a small product actor, not as a cartoon centerpiece. She can sit near the lower-left or edge of the frame and trigger/control the visual system.

## Output location

Write outputs under:

`/Users/art/dev/preframe/out/`

Preferred names:

- `mira-intro-v2.mp4`
- `mira-control-lanes-with-intro.mp4` if you also create the joined cut

If you can also copy outputs into the action workspace, use:

`/Users/art/dev/action/artifacts/captures/mira-intro-v2-<timestamp>/`

If the sandbox blocks that, or if it slows you down, just report the preframe
output paths. The priority is giving us useful video directions to react to, not
file placement.
