# Preframe feature map

Code-inspected on 2026-07-05. This is a product-facing feature map backed by the current repo. It is organized around the workflow, not around file ownership.

## The center

Preframe starts with a raw capture. The tool breaks that capture open: frame changes, storyboard images, scene descriptions, transcripts, motion areas, and VLM tags turn "a video file" into text and structure a model can use.

From there, a human can write a brief. The system can turn the raw capture plus that brief into a montage plan, source-backed composition, render job, and reviewable take. The human stays in the loop through playback, frame marks, notes, queue inspection, and operator controls.

That is the product: agents edit; humans inspect, brief, review, and steer.

## The workflow legs

### 1. Unpack the raw capture

This is the part that makes the rest possible. A long screen recording gets converted into material the model can reason over.

What exists:

- FFmpeg/ffprobe analysis for duration, codec, fps, and dimensions.
- Scene and frame-change detection.
- Storyboard frame extraction.
- Pixel-diff motion segmentation, active/idle timing, motion areas, and quadrant scores.
- Optional VLM/vision passes that describe what is visible on the screen.
- EDL JSON output with scenes, stats, dead time, frame files, and descriptions.
- Transcript/SRT loading when transcript files exist.

Why it matters:

- The raw capture stops being opaque.
- The model gets text evidence about what happened in the video.
- The editor can inspect frames, scenes, transcripts, highlights, and raw JSON instead of guessing.

Key files:

- `scripts/analyze-video.ts`
- `scripts/lib/index.ts`
- `scripts/lib/scene-detect.ts`
- `scripts/lib/pixel-diff.ts`
- `scripts/lib/vision.ts`
- `scripts/build-catalog.ts`
- `services/jobs/worker.ts`
- `catalog/slots/VideoDetail.tsx`
- `catalog/slots/FrameViewer.tsx`

Caveats:

- Requires ffmpeg.
- VLM detail depends on provider configuration and API keys.
- Some analysis is script/worker driven, not a standalone user-facing "analyze this" button everywhere.

### 2. Brief the edit

Once the capture is unpacked, the human can say what they want from it. The brief can be broad, like "dig out the live trace moment," or specific, like "hold the network graph longer."

What exists:

- New composition flow with video instructions.
- Prompt library for video, music, lyrics, and system-agent prompts.
- Guided-tour script data that already uses the capture -> brief -> montage prompt framing.
- Worker prompt construction that combines the creative brief, source paths, processed video analysis, additional inputs, params, and review context.

Why it matters:

- The brief becomes the bridge between human intent and the model-readable capture.
- It is not just "prompt a video." It is "prompt against inspected evidence."

Key files:

- `catalog/slots/NewComposition.tsx`
- `catalog/slots/PromptLibrary.tsx`
- `services/jobs/worker.ts`
- `src/projects/guided-tour/scripts.data.ts`
- `src/projects/guided-tour/profiles.ts`

Caveats:

- The brief model is strong in the worker and guided-tour data. The UI can still make this concept clearer.

### 3. Turn the capture and brief into a montage plan

The worker asks the model for a structured scenario: which clips to use, where they start, how long they run, what labels appear, where zooms happen, what audio plays, and how the whole thing opens and closes.

What exists:

- A `CompositionPlan` interface in the worker.
- Clip plans with source, start time, duration, label, volume, and optional zoom origin.
- Text overlay plans for titles, subtitles, captions, and labels.
- Audio track plans for music, voiceover, and sound effects.
- Intro/outro style, transition type, fps, resolution, and duration.
- Plan validation and fallback defaults.

Why it matters:

- The "edit" is inspectable before it becomes a render.
- The plan is close to a screenplay for screen captures: beats, timing, labels, movement, and sound.
- This is where agent editing becomes concrete instead of vague.

Key files:

- `services/jobs/worker.ts`
- `src/_generated-compositions.ts`
- `scripts/generate-compositions-registry.ts`

Caveats:

- The plan currently becomes generated Remotion source. There is not yet a separate visual plan editor for every field.

### 4. Queue and render the take

The job system turns a brief and source assets into a running workflow: analyze inputs, call the model, write source, render, rebuild the catalog, and expose the result.

What exists:

- SQLite-backed jobs with dedupe, idempotency, status, progress, heartbeat, activity log, result JSON, and errors.
- Job kinds for `generate`, `revise-brief`, `revise-render`, `logo-brief`, `logo-render`, and `memo-reel`.
- Queue UI with job list, detail view, source assets, activity timeline, retry, result metadata, output links, JSON inspectors, and generated source links.
- Remotion render path for generated compositions.
- Catalog rebuild after successful output.

Why it matters:

- The edit loop is not a single black-box request.
- The operator can see what happened, what failed, what was produced, and what source generated it.

Key files:

- `services/jobs/init.ts`
- `services/jobs/db.ts`
- `services/jobs/types.ts`
- `services/jobs/worker.ts`
- `catalog/slots/QueueView.tsx`
- `app/api/compositions/[compositionId]/jobs/route.ts`
- `app/api/jobs/route.ts`
- `app/api/jobs/[jobId]/route.ts`
- `app/api/jobs/[jobId]/retry/route.ts`

Caveats:

- `app/api/queue/*` is an older `.queue` + `scout @preframe` path. The current UI centers on `/api/jobs`.
- Local render depends on Remotion and local media paths.

### 5. Generate the music leg

Preframe can build or revise a soundtrack beside the video workflow.

What exists:

- MiniMax music generation.
- Instrumental mode.
- Prompt plus lyrics mode.
- Lyrics generation and lyrics revision.
- Music ideation from a loose vibe prompt.
- Generated MP3 and JSON sidecars.
- Music library with playback, metadata, prompt/lyrics/result inspectors, delete, play-next, add-to-queue, and feedback-based revisions.
- Video+music composition mode that requests a generated soundtrack as part of the video job.

Why it matters:

- Audio is part of the same operator loop, not an afterthought.
- The human can generate, inspect, revise, and reuse tracks.

Key files:

- `catalog/slots/NewComposition.tsx`
- `catalog/slots/MusicView.tsx`
- `app/api/music/generate/route.ts`
- `app/api/music/lyrics/route.ts`
- `app/api/inference/route.ts`
- `services/jobs/worker.ts`

Caveats:

- Music generation is MiniMax-specific.
- Requires MiniMax credentials through provider config or `MINIMAX_API_KEY`.

### 6. Generate speech and captions

This leg exists, but it is more script and Remotion driven than the main catalog UI.

What exists:

- Direct ElevenLabs TTS script with SSML break support.
- Guided-tour narration generation for multiple project/variant takes.
- Narration segment metadata for aligning voiceover to video.
- Remotion guided-tour composition with narration, ducked music, and caption overlays.
- Transcript-driven caption components for overlay or caption-bar styles.
- Speaker diarization and transcription script that can write JSON and SRT.
- Composition plan support for caption-style text overlays and voiceover audio tracks.

Why it matters:

- The same capture can become a narrated walkthrough, not just a silent montage.
- Captions and transcripts give both the video and the model more structure.

Key files:

- `scripts/elevenlabs-tts.mjs`
- `scripts/gen-narration.mjs`
- `scripts/gen-narration-all.mjs`
- `scripts/render-guided-tour.mjs`
- `scripts/diarize.py`
- `src/components/TranscriptCaptions.tsx`
- `src/components/TacticalCaptionBar.tsx`
- `src/projects/guided-tour/GuidedTourVideo.tsx`
- `src/projects/guided-tour/narration.ts`
- `src/projects/guided-tour/scripts.data.ts`

Caveats:

- ElevenLabs narration is not yet a general-purpose catalog UI flow.
- Transcript and caption workflows are real, but spread across scripts, Remotion components, and project-specific compositions.

### 7. Review with playback annotations

This is the human feedback loop. Watch the take, mark what is wrong, export the feedback, and send the next job through a safer revise path.

What exists:

- Shared video playback in detail and review surfaces.
- Timestamped notes.
- General notes.
- Drawn normalized rectangles over the video.
- Feedback notes and zoom notes.
- Frame stepping and keyboard controls.
- Timeline note markers.
- Copy/download notes as markdown.
- `revise-brief` submission from a final video with review notes.
- Queue detail that loads the revision brief, shows planned changes/questions, and can queue `revise-render`.

Why it matters:

- The human does not have to explain everything in prose.
- A marked frame plus a note is a much better editing primitive than a blank prompt box.
- The revise loop can pause at a brief before touching the render.

Key files:

- `catalog/slots/ReviewPlayer.tsx`
- `catalog/hooks/useReview.ts`
- `catalog/reviewNotes.ts`
- `catalog/ReviewContext.tsx`
- `catalog/slots/VideoDetail.tsx`
- `catalog/slots/QueueView.tsx`
- `services/jobs/worker.ts`

Caveats:

- Notes live in localStorage until exported or submitted into a job.
- Shared/team review storage is not implemented in this pass.

### 8. Iterate with operator controls

These are the controls around the main loop. Some are core editor controls; some are companion tools for visual systems.

What exists:

- Source/code editor for allowed files in `src`, `lib`, `catalog`, and `.compositions`.
- Provider settings for Anthropic/OpenAI-compatible models and MiniMax-style configs.
- Frames catalog with reusable visual treatments and frame slots.
- Frame preview controls for brackets, captions, lower thirds, tagline, grid, safe area, timecode, color, opacity, and playback.
- Separate frame designer for stacking kit primitives and editing layer props.
- FX browser with effect categories, parameter controls, staged compare, music backing, timeline scrubber, shortcuts, and browser-side export.
- Logo studio for uploaded or prompt-only logos, motion briefs, Hyperframe renders, and preview.
- Hudson logo ports for accepting logo animation jobs and emitting render-complete payloads.

Why it matters:

- The tool gives the operator handles.
- The agent can do the heavy edit, but the human can still tune visible primitives.

Key files:

- `catalog/slots/CodePanel.tsx`
- `app/api/source/route.ts`
- `catalog/slots/SettingsView.tsx`
- `lib/provider.ts`
- `catalog/slots/FramesView.tsx`
- `catalog/slots/FramePreview.tsx`
- `frame-designer/`
- `catalog/slots/FxBrowser.tsx`
- `catalog/slots/FxParams.ts`
- `catalog/slots/LogoStudio.tsx`
- `catalog/ports.ts`
- `tools/hyperframes-toolkit/`

Caveats:

- Hyperframes is strongest in logo, frame, and FX surfaces. General video generation is Remotion-first today.
- Some visual-tool surfaces are toolkit/prototype-adjacent rather than one fully unified editor.

## Short version for the landing page

Lead with the raw capture, not "product video."

Suggested feature order:

1. Drop in a raw capture.
2. Preframe unpacks it into frames, scenes, transcripts, motion, and screen descriptions.
3. Write a brief for what the edit should find or say.
4. Queue the agent to plan a montage and render a take.
5. Add music, captions, or narration when the cut needs them.
6. Watch the take, mark frames, leave notes, and send it back through the queue.
7. Inspect the source, plan, job log, and outputs as you iterate.

Possible language:

> Preframe turns raw captures into editable evidence. It detects frame changes, extracts storyboard frames, describes screens with vision models, and gives the agent enough context to plan a cut. You write the brief; the agent builds a take. Then you review it like an editor: mark the frame, leave the note, tune the controls, and render again.

## Things not to overclaim yet

- Do not imply every capture automatically gets full VLM analysis without provider setup.
- Do not imply narration is a polished general UI workflow; it exists mainly through scripts and guided-tour compositions.
- Do not imply review notes are shared server artifacts. They are local until exported or submitted.
- Do not lead with "product videos." Product demos are one output, not the core idea.
- Do not call Hyperframes the main video engine for generated montage jobs. Current montage generation is Remotion-first.
