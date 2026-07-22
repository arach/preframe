# Agent Job API

Preframe exposes an agent-facing job intake endpoint:

```http
POST /api/agents/jobs
```

The endpoint accepts local file paths. Agents do not need to fake a browser
upload or construct multipart form data.

## Default: Register Captures In The Visible Queue

Use `mode: "register"` when an upstream tool already produced source captures
and Preframe should show them in `/queue` as ready source material.

```bash
curl -X POST http://localhost:3100/api/agents/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "register",
    "compositionId": "talkie-thought-lands",
    "name": "Talkie - Thought Lands",
    "prompt": "Create a motion treatment from the Action capture and manifest.",
    "sources": [
      {
        "path": "/Users/art/dev/action/artifacts/exports/session_talkie_thought_lands/capture.mov",
        "role": "clip",
        "filename": "talkie-thought-lands.mov"
      }
    ],
    "attachments": [
      {
        "path": "/Users/art/dev/action/artifacts/exports/session_talkie_thought_lands/preframe.manifest.json",
        "kind": "action-preframe-manifest"
      }
    ],
    "params": {
      "aspectRatio": "1:1",
      "durationSec": 12.32
    },
    "idempotencyKey": "action:talkie-thought-lands:v1"
  }'
```

This copies media into `public/demos`, copies source materials into
`.compositions/<compositionId>/agent-submission`, rebuilds the catalog, and
creates a completed intake job in `.data/jobs.sqlite`.

## Queue A Worker Job

Use `mode: "queue"` when Preframe should ingest the local paths and then run
the composition worker.

```json
{
  "mode": "queue",
  "kind": "generate",
  "compositionId": "talkie-produced-pass-01",
  "name": "Talkie Produced Pass 01",
  "prompt": "Cut a concise product demo with zooms, captions, and a confident ending.",
  "sources": [
    "/absolute/path/to/capture.mov"
  ],
  "idempotencyKey": "agent:talkie-produced-pass-01:v1"
}
```

## Register A Completed Treatment

Use `mode: "treatment"` when a renderer or motion agent already produced the
finished treatment file. Preframe copies the output into `public/out`, rebuilds
the catalog, creates a completed render job, and shows the treatment in both
`/` and `/queue`.

```json
{
  "mode": "treatment",
  "kind": "render",
  "compositionId": "talkie-story-pass-01",
  "name": "Talkie Story Pass 01",
  "prompt": "Finished baseline story treatment from the first Talkie source pass.",
  "outputs": [
    {
      "path": "/Users/art/dev/preframe/public/out/talkie-story-pass-01.mp4",
      "filename": "talkie-story-pass-01.mp4"
    }
  ],
  "attachments": [
    {
      "path": "/Users/art/dev/preframe/.compositions/talkie-story-pass-01/composition.json",
      "kind": "composition-plan"
    }
  ],
  "params": {
    "durationSec": 27.22,
    "width": 1920,
    "height": 1080,
    "fps": 30
  },
  "idempotencyKey": "treatment:talkie-story-pass-01:v1"
}
```

## Response Shape

The response includes the visible job record, registered assets, copied
attachments, and useful links:

```json
{
  "ok": true,
  "mode": "register",
  "created": true,
  "job": {
    "jobId": "job_...",
    "compositionId": "talkie-thought-lands",
    "status": "completed"
  },
  "assets": [
    {
      "inputPath": "/Users/art/dev/action/.../capture.mov",
      "publicPath": "demos/talkie-thought-lands.mov",
      "publicUrl": "/demos/talkie-thought-lands.mov"
    }
  ],
  "links": {
    "queue": "/queue",
    "jobApi": "/api/jobs/job_...",
    "compositionJobsApi": "/api/compositions/talkie-thought-lands/jobs"
  }
}
```

## Notes For Agents

- Prefer absolute local paths for captures and manifests.
- Use a stable `idempotencyKey` for retries.
- Use `mode: "register"` for handoff/intake visibility.
- Use `mode: "queue"` only when you intend to start the render worker.
- Use `mode: "treatment"` when handing back completed `.mp4` outputs.
