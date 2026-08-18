/** GENERATED from the preframe-tour-scripts workflow — 4 takes x 3 subjects.
 *  Source of truth for guided-tour narration + captions. Regenerate via
 *  .scratch/build-scripts-data.mjs, or edit by hand (it is plain typed data).
 */
import type { TourExampleId, TourProject } from './profiles';

export const TOUR_PROJECTS: Record<TourExampleId, TourProject> = {
  "scout": {
    "id": "scout",
    "sampleVideo": "public/inbox/scout-2026-05-22.mp4",
    "projectVideo": "memoreel-job-mphcwnzv-rlq39n",
    "defaultVariant": "diary",
    "variants": {
      "diary": {
        "id": "diary",
        "label": "Process diary",
        "angleSummary": "Calm, chronological process diary — warm and matter-of-fact, narrating each step in the order I did it.",
        "sceneLabel": "OPENSCOUT DEMO",
        "sceneSublabel": "website capture",
        "ingestPrompt": "Make a 45 second OpenScout demo. Open on the ops agent grid, then settle on a live agent trace, and keep the network graph readable the whole way through.",
        "reviewNote": "Hold the trace beat — give the network graph a second to settle before it cuts.",
        "story": "I wanted a short demo of the OpenScout dashboard, so I sat down and recorded the whole session in one pass — no cutting yet, just the raw run. Then I dropped that capture in and wrote down what I was after: open on the ops grid, end on a live agent trace. The brief came back as a montage prompt, which gave me a starting shape to work from. Watching a take, the trace beat went by too fast, so I boxed that frame and left a note to let the graph settle. I ran it through the queue again, compared the takes, and exported the one that felt right.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "I recorded the whole OpenScout session in one pass. Nothing cut yet, just the raw run.",
            "caption": "One raw OpenScout run, uncut",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Dropped the capture in and wrote down what I wanted from the cut.",
            "caption": "Capture in, write the brief",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "It came back as a montage prompt — a starting shape to work from.",
            "caption": "Montage prompt, a place to start",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "Watching a take, the trace beat went by too fast. Boxed the frame.",
            "caption": "Trace beat too fast — box it",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Left a note on it: let the network graph settle first.",
            "caption": "Note: let the graph settle",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Ran it through the queue, compared takes, exported the one I liked.",
            "caption": "Queue, compare, export",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "OpenScout demo cut",
        "landingDescription": "An example walkthrough — raw OpenScout capture in, brief, montage, review notes, export. Preframe is the tool; OpenScout is the subject.",
        "landingListNote": "Website capture example."
      },
      "problem": {
        "id": "problem",
        "label": "Problem-led",
        "angleSummary": "Leads from one pain: the live trace is buried minutes deep in the raw session; each beat digs it out.",
        "sceneLabel": "OPENSCOUT DEMO",
        "sceneSublabel": "agent grid to trace",
        "ingestPrompt": "Here's a long raw OpenScout session. Cut a 45-second demo that opens on the ops agent grid, then digs out the buried moment where a live agent trace lands — keep the network graph readable.",
        "reviewNote": "Hold the trace-landing beat longer; right now it flashes by and you miss it.",
        "story": "My problem was simple: the best moment in OpenScout — a live agent trace landing on the grid — was buried about six minutes into one long raw session. So I grabbed the whole recording, dropped it into /new, and wrote a brief that said dig that moment out. The montage prompt gave me a rough cut, but the trace still flashed by too fast, so I boxed the frame and noted to hold it. Back through the queue, the moment finally reads.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "The moment I wanted — a live agent trace landing — was buried deep in one long OpenScout session.",
            "caption": "Good moment buried in the raw",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Dropped the whole recording in /new and wrote: dig that moment out.",
            "caption": "Brief: dig the moment out",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "The montage prompt gave me a rough cut to dig through.",
            "caption": "Rough cut to dig through",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "There it is — the trace lands, but it flashes by too fast.",
            "caption": "Trace lands, flashes by",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Boxed that frame and noted to hold it longer.",
            "caption": "Boxed it — hold longer",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through the queue. Now the moment reads. Exported.",
            "caption": "Queue again, moment reads, export",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "Dig out the buried moment",
        "landingDescription": "I used Preframe to cut a 45-second OpenScout demo, digging the live agent trace out of one long raw session.",
        "landingListNote": "OpenScout demo cut"
      },
      "terse": {
        "id": "terse",
        "label": "Terse / minimal",
        "angleSummary": "Clipped 3–6 word lines, near-identical caption and narration, screen carries the rest.",
        "sceneLabel": "OPENSCOUT DEMO",
        "sceneSublabel": "website capture",
        "ingestPrompt": "Make a 45 second OpenScout demo. Open on the OPS agent grid, end on a live agent trace, keep the network graph readable.",
        "reviewNote": "Hold the trace loading beat. Let the graph settle before the cut.",
        "story": "I needed a short OpenScout demo. Started with one long screen recording of the whole session. Dropped it in, wrote what I wanted, let it become a montage. One beat ran too fast, so I boxed the frame and noted it. Queue, compare, export.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long OpenScout recording. Nothing cut yet.",
            "caption": "One recording. Nothing cut.",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Drop it in. Write the brief.",
            "caption": "Drop it. Write the brief.",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "Brief becomes a montage. Start shaping.",
            "caption": "Montage. Start shaping.",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "This beat runs fast. Box it.",
            "caption": "Runs fast. Box it.",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Note: hold the trace loading.",
            "caption": "Note: hold the trace.",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Queue. Compare. Export.",
            "caption": "Queue. Compare. Export.",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "OpenScout demo cut",
        "landingDescription": "Example workflow — raw website capture in, brief, montage, notes, export. Preframe is the tool; OpenScout is the subject.",
        "landingListNote": "Website capture example."
      },
      "craft": {
        "id": "craft",
        "label": "Craft / feel-led",
        "angleSummary": "Edits the OpenScout demo by feel — what's stiff, what needs room — trusting the eye over the mechanics.",
        "sceneLabel": "OPENSCOUT DEMO",
        "sceneSublabel": "website capture",
        "ingestPrompt": "Cut a 45-second OpenScout demo. Open on the OPS agent grid, then move into one agent's trace going live. Keep the network graph calm and readable — I want it to feel like the system settling, not a tour.",
        "reviewNote": "Hold the trace loading beat longer — let the graph settle before the cut so it lands instead of rushing past.",
        "story": "I wanted a short demo of OpenScout that actually felt like watching the system breathe. So I recorded one long session of the dashboard — the grid, an agent waking up, a trace going live — and didn't touch it yet. I dropped that in and wrote how I wanted it to feel: calm at the open, then one clean move into a live trace. The montage prompt gave me something to push against, and from there I just watched takes by feel. One beat sat too tight — the trace loaded and we were already gone — so I boxed it and asked it to breathe. Sent it back, found the take that settled right, and exported.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long OpenScout session — I just let it run and watched how it moved.",
            "caption": "Let the session run, watch it move",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Dropped it in, wrote how I wanted it to feel — calm, then live.",
            "caption": "Wrote how it should feel",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "The montage gives me a rough shape to push against by feel.",
            "caption": "A rough shape to push against",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "Watching it, the trace beat felt rushed — boxed that frame.",
            "caption": "Trace beat felt rushed — boxed it",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Noted: let the graph settle, give that moment room to breathe.",
            "caption": "Give it room to breathe",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through the queue. Found the take that settled, exported.",
            "caption": "Found the take that settled — export",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "OpenScout demo, by feel",
        "landingDescription": "Example workflow — I cut an OpenScout demo by feel in Preframe, holding the beats that needed room. Preframe is the tool; OpenScout is the subject.",
        "landingListNote": "Website capture example."
      }
    }
  },
  "talkie": {
    "id": "talkie",
    "sampleVideo": "docs/media/app/talkiepromo.mp4",
    "projectVideo": "talkiepromo",
    "defaultVariant": "diary",
    "variants": {
      "diary": {
        "id": "diary",
        "label": "Process diary",
        "angleSummary": "Calm chronological diary of the build — warm, unhurried, closest to the reference voice.",
        "sceneLabel": "TALKIE DEMO",
        "sceneSublabel": "app capture",
        "ingestPrompt": "Make a 30 second Talkie launch video. Lead with someone talking into the app, let the recording moment breathe, keep labels light.",
        "reviewNote": "Hold the recording beat — let the waveform settle before it cuts away.",
        "story": "I needed a short launch video for Talkie. I started the way I always do, with one long screen recording of the app while I used it — nothing trimmed yet. I dropped that capture into /new and wrote down what I wanted out of it: a thirty-second demo that leads with the voice and gives the recording moment room. The brief became a montage prompt, and I started shaping from there. One take had a beat that cut too soon, so I boxed the frame, left a note to hold it, sent it back through the queue, and exported the take I liked.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long Talkie recording first — the whole session, nothing trimmed yet.",
            "caption": "One raw Talkie recording",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Dropped the capture and wrote what the cut should show.",
            "caption": "Drop capture, write the brief",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "The brief became a montage prompt, and I started shaping.",
            "caption": "Brief becomes a montage prompt",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "Watched a take — the recording moment cut too soon.",
            "caption": "Recording moment cut too soon",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Boxed the frame, left a note to hold it longer.",
            "caption": "Note: hold this longer",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through the queue. Picked a take and exported.",
            "caption": "Back through queue, exported",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "Talkie launch cut",
        "landingDescription": "A process diary of cutting Talkie's launch demo in Preframe — Preframe is the tool, Talkie is the subject.",
        "landingListNote": "raw capture to export"
      },
      "problem": {
        "id": "problem",
        "label": "Problem-led",
        "angleSummary": "Opens on one friction — the record-and-talk moment is buried in a too-long raw take — and each beat digs it out.",
        "sceneLabel": "TALKIE DEMO",
        "sceneSublabel": "app capture",
        "ingestPrompt": "Here's a raw take of me using Talkie. The recording moment matters most — me hitting record, talking, the transcript filling in. Cut to ~30s, lead with the voice, keep it quiet. Light labels.",
        "reviewNote": "Hold the record-and-talk beat longer — that's the moment, let it breathe.",
        "story": "My problem was that the best bit — me hitting record and watching Talkie transcribe — was buried in a long raw take. So I grabbed the whole session as one screen recording and dropped it into /new with a brief: dig out the voice moment, keep it under 30 seconds. The montage prompt gave me a place to start shaping. Watching a take, the record beat went by too fast, so I boxed it and left a note to hold it. Sent it back through the queue, compared, exported.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "The good part — me hitting record — was buried in one long raw take.",
            "caption": "Best moment, buried in raw",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Dropped the capture, brief said: dig out the voice moment.",
            "caption": "Brief: find the voice moment",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "The montage prompt gave me somewhere to start digging.",
            "caption": "Prompt to start digging",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "Watching it, the record beat flew by — I boxed the frame.",
            "caption": "Record beat too fast",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Note: hold this longer, let the transcript fill in.",
            "caption": "Note: hold it longer",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through the queue. Compared takes, exported the one that landed.",
            "caption": "Compared takes, exported",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "A buried moment, dug out",
        "landingDescription": "I used Preframe to cut a short Talkie demo, pulling the record-and-transcribe moment out of one long raw take.",
        "landingListNote": "Talkie, cut with Preframe"
      },
      "terse": {
        "id": "terse",
        "label": "Terse / minimal",
        "angleSummary": "Clipped, near-silent. Three-to-five word lines; caption echoes narration almost verbatim. The screen carries it.",
        "sceneLabel": "TALKIE DEMO",
        "sceneSublabel": "app capture",
        "ingestPrompt": "Make a 30 second Talkie launch video. Open on the voice interaction, give the recording moment room to land, keep labels light.",
        "reviewNote": "Hold the recording beat — let the waveform land before the cut.",
        "story": "I needed a short launch video for Talkie. Started with one long screen recording of the app — no cuts. Dropped it in, wrote one line about what I wanted, and let the montage prompt give me a place to begin. Watched a take, one beat felt stiff, so I boxed the frame and asked it to hold the recording longer. Sent it back, picked a take, exported.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long Talkie recording. No cuts yet.",
            "caption": "One recording. No cuts.",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Drop it in. Write the brief.",
            "caption": "Drop it in. Brief.",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "Montage prompt. Start shaping.",
            "caption": "Montage prompt.",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "This beat's stiff. Box the frame.",
            "caption": "Stiff beat. Box it.",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Note: hold the recording longer.",
            "caption": "Hold the recording.",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through the queue. Export.",
            "caption": "Queue. Export.",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "Talkie launch cut",
        "landingDescription": "Raw app capture in, one brief, a few notes, export — Preframe is the tool; Talkie is the subject.",
        "landingListNote": "App capture example."
      },
      "craft": {
        "id": "craft",
        "label": "Craft / feel-led",
        "angleSummary": "Edits by feel — what's stiff, what needs to breathe, why a beat gets held.",
        "sceneLabel": "TALKIE DEMO",
        "sceneSublabel": "app capture",
        "ingestPrompt": "Here's a long raw capture of Talkie — I hit record, talk a memo, watch it transcribe live. Cut a 30s launch video that leads with the voice moment and lets the recording land before anything else.",
        "reviewNote": "Hold the recording frame longer — the waveform needs a beat to breathe before transcription comes in.",
        "story": "I had one long Talkie capture — me hitting record, talking, watching it transcribe. I dropped it in and wrote a brief about the feeling I wanted: the voice first, room for it to land. The montage prompt gave me a rough shape to react to. Watching it back, the recording beat felt rushed, so I boxed it and noted to let it breathe. Sent it through again, picked the take that felt right, exported.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long Talkie capture — me recording a memo, nothing trimmed.",
            "caption": "Raw Talkie capture, untouched",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Drop it in, write what I want it to feel like.",
            "caption": "Brief: how it should feel",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "The montage gives me a shape to react to.",
            "caption": "A shape to react to",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "The recording beat felt rushed — I box that frame.",
            "caption": "Recording beat felt rushed",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Note to let the waveform breathe before the words land.",
            "caption": "Let the waveform breathe",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through. Picked the take that felt right, exported.",
            "caption": "Picked the right take, exported",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "Talkie, cut to feel",
        "landingDescription": "A launch video for Talkie, the voice memo workspace — shaped in Preframe until the recording moment lands right.",
        "landingListNote": "Voice memos for Apple"
      }
    }
  },
  "lattices": {
    "id": "lattices",
    "sampleVideo": "docs/media/lattices-grid-born.mp4",
    "projectVideo": "lattices-grid-born",
    "defaultVariant": "diary",
    "variants": {
      "diary": {
        "id": "diary",
        "label": "Process diary",
        "angleSummary": "Calm chronological diary of building a Lattices demo — what I did, in order, unhurried.",
        "sceneLabel": "LATTICES DEMO",
        "sceneSublabel": "workspace capture",
        "ingestPrompt": "Make a 40 second Lattices demo. Start on the live workspace, then show me asking in plain language and the assistant moving windows and reading on-screen text. Land on the moment the workspace becomes addressable.",
        "reviewNote": "Hold the scan beat — let the on-screen text light up before the windows move.",
        "story": "I wanted a short demo of Lattices, so I started the way I usually do — one long screen recording of a real session, the whole thing, nothing cut yet. I dropped that capture into Preframe and wrote down what I actually wanted: the moment my Mac workspace turns into something an agent can read and drive. The brief became a montage prompt, and I started shaping from there, opening the composition when a beat looked off. The scan felt rushed, so I boxed the frame and left a note to hold it. Then back through the queue, picked the take I liked, and exported.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long recording of a real Lattices session — the whole thing, no cutting yet.",
            "caption": "Whole session, no cutting yet.",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Dropped the capture and wrote the brief — the workspace becoming addressable.",
            "caption": "Capture in, write the brief.",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "The montage prompt gave me somewhere to start shaping it.",
            "caption": "Montage prompt — start shaping.",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "Watched a take. The scan went by too fast, so I boxed the frame.",
            "caption": "Scan's too fast — box the frame.",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Left a note to hold the scan — let the on-screen text land.",
            "caption": "Note: hold the scan beat.",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through the queue. Compared takes, picked one, exported.",
            "caption": "Queue, compare takes, export.",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "Lattices demo cut",
        "landingDescription": "Example workflow — raw workspace capture in, brief, montage, review notes, export. Preframe is the tool; Lattices is the subject.",
        "landingListNote": "Workspace capture example."
      },
      "problem": {
        "id": "problem",
        "label": "Problem-led",
        "angleSummary": "Opens from one pain — the moment a workspace becomes addressable is buried in a long take — and each beat digs it out.",
        "sceneLabel": "LATTICES DEMO",
        "sceneSublabel": "workspace capture",
        "ingestPrompt": "Make a 40 second Lattices demo. The good part — windows and on-screen text becoming addressable, me driving it in plain language — is buried mid-session. Lead with that, drop the slow setup.",
        "reviewNote": "Lengthen the scan beat — let the OCR text land on the windows before the assistant acts.",
        "story": "My problem was simple: the moment that sells Lattices — the workspace turning addressable, me talking to it in plain language — was buried in the middle of one long capture. I recorded the whole session raw, no cutting, then dropped it in and wrote down the real issue: lead with that moment, lose the slow setup. The montage prompt gave me somewhere to start digging it out. Watching a take, the scan beat went by too fast to read, so I boxed the frame and left a note to let the on-screen text land. Ran it back through the queue, compared takes, and exported the one that opened on the good part.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long Lattices session, raw. The part that matters is buried in the middle.",
            "caption": "Raw session — good part's buried",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "I drop it in and write the real problem: lead with the addressable moment.",
            "caption": "Brief: lead with the good part",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "The montage prompt gives me somewhere to start digging that moment out.",
            "caption": "Montage prompt — start digging it out",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "The scan beat flies by — you can't read the on-screen text. I box it.",
            "caption": "Scan flies by — box the frame",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Note: let the window text land before the assistant acts on it.",
            "caption": "Note: let the text land",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through the queue. Compared takes, exported the one that opens on the good part.",
            "caption": "Queue, compare, export",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "Lattices demo cut",
        "landingDescription": "Example workflow — a buried moment in a raw workspace capture, dug out through brief, montage, and review notes. Preframe is the tool; Lattices is the subject.",
        "landingListNote": "Workspace capture example."
      },
      "terse": {
        "id": "terse",
        "label": "Terse / minimal",
        "angleSummary": "Clipped, near-silent lines; captions mirror VO almost word-for-word; the screen carries it.",
        "sceneLabel": "LATTICES DEMO",
        "sceneSublabel": "workspace capture",
        "ingestPrompt": "Cut my Lattices session into 40s. Show windows and on-screen text becoming addressable, then me driving it in plain language.",
        "reviewNote": "Hold the scan beat longer — let the window text land before the plain-language command.",
        "story": "I recorded the whole Lattices session in one take. No cuts. Then I dropped it in, wrote a short brief, and started shaping. Watched it back, one beat moved too fast, so I boxed it and left a note. Sent it through the queue and exported.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long take. Whole Lattices session. Nothing cut.",
            "caption": "One take. Nothing cut.",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Drop it in. Write the brief.",
            "caption": "Drop it. Write the brief.",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "Montage prompt. Start shaping.",
            "caption": "Prompt. Start shaping.",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "Scan beat moved too fast. Boxed it.",
            "caption": "Too fast. Boxed it.",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Note: hold the window scan longer.",
            "caption": "Note: hold the scan.",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through the queue. Picked one. Exported.",
            "caption": "Queue. Pick. Export.",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "Lattices, cut down",
        "landingDescription": "A short Lattices demo I cut in Preframe — one raw take, shaped into the moment the workspace turns addressable.",
        "landingListNote": "Made with Preframe"
      },
      "craft": {
        "id": "craft",
        "label": "Craft / feel-led",
        "angleSummary": "Edits by feel — what's stiff, what needs to breathe, why a beat got held.",
        "sceneLabel": "LATTICES DEMO",
        "sceneSublabel": "workspace capture",
        "ingestPrompt": "Here's a long take of me using Lattices — scanning windows, reading on-screen text, then asking it in plain language to tidy my layout. I want the cut to feel like the desktop quietly waking up and becoming something I can talk to.",
        "reviewNote": "Hold the layout-snap a beat longer — the windows settle too fast to feel satisfying.",
        "story": "I recorded one long take of me actually using Lattices — scanning my windows, pulling text off the screen, then just asking it to clean up my layout. Watching it back, most of it felt right, but a few moments were stiff: the OCR landed before you could feel it, and the layout snapped too quick to be satisfying. So I boxed those frames and left myself notes to let them breathe. Re-ran it, watched the takes side by side, and picked the one where the desktop felt like it was waking up. That's the cut I exported.",
        "beats": [
          {
            "still": "studio-code.png",
            "narration": "One long take of me actually using Lattices. Nothing cut — I just watch it back first.",
            "caption": "One long take, watched back first",
            "markerAtSec": null
          },
          {
            "still": "studio-new.png",
            "narration": "Drop it in and say how I want the cut to feel.",
            "caption": "Drop it in, say how it should feel",
            "markerAtSec": 7
          },
          {
            "still": "studio-grid.png",
            "narration": "The prompt gives me something to push against and start shaping.",
            "caption": "A prompt to push against",
            "markerAtSec": 14
          },
          {
            "still": "reviewer-clean.png",
            "narration": "The scan lands before you feel it — stiff. I box that frame.",
            "caption": "Scan lands too fast — box it",
            "markerAtSec": 21
          },
          {
            "still": "reviewer-annotated.png",
            "narration": "Note to let the layout-snap breathe. It needs a beat to settle.",
            "caption": "Note: let the snap breathe",
            "markerAtSec": 27
          },
          {
            "still": "studio-queue.png",
            "narration": "Back through. Watched the takes, kept the one that felt awake, exported.",
            "caption": "Kept the one that felt awake",
            "markerAtSec": 33
          }
        ],
        "landingTitle": "Lattices, cut by feel",
        "landingDescription": "I used Preframe to shape a short Lattices demo — boxing the stiff frames and holding the beats until the workspace felt like it was waking up.",
        "landingListNote": "made with Preframe"
      }
    }
  }
};
