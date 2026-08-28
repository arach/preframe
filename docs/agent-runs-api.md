# Agent Runs API

A **Run** is a named, ordered dossier of everything one creative exercise
produced: brief, source captures, score, composition source, delivered finals
and their format variants, brand artwork, and validation evidence.

A run is an *organizing layer*, not storage. Members keep their native identity
and native view — a registered treatment stays a treatment, a track stays a
track — and the run records only role, ordering, grouping and preference.
Nothing is copied and the catalog is not rebuilt, which makes the endpoint safe
to call while a render is still writing files.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/agents/runs` | Create or update a run idempotently |
| `GET` | `/api/agents/runs` | Self-describing schema |
| `GET` | `/api/runs` | List run summaries |
| `GET` | `/api/runs/<slug>` | One run document plus its link block |
| `GET` | `/api/runs/<slug>/artifacts/<itemId>` | Stream a member that lives outside `public/` |

## URL contract

```text
/runs                              the runs collection
/runs/<slug>                       canonical run URL
/runs/<slug>/items/<itemId>        stable deep link to one member
```

These paths survive reload and open the intended object directly. They are
host-independent: nothing persisted contains a hostname, so the same path works
on `http://localhost:3100` today and a deployed Preframe later. Absolute URLs
are only produced at the edges — the API joins the request's own origin, and the
UI's copy-link buttons join `window.location.origin`.

Where a member already has a native Preframe route, the run stores it and the
link block prefers it:

| member | native route |
|---|---|
| registered treatment | `/treatments/<id>` |
| source asset | `/assets/<id>` |
| music track | `/music/<trackId>` |
| anything else | `/runs/<slug>/items/<itemId>` |

## Creating or updating a run

```bash
curl -X POST http://localhost:3100/api/agents/runs \
  -H 'Content-Type: application/json' \
  -d '{
    "slug": "openscout-v3-montage",
    "title": "OpenScout V3 — montage",
    "description": "Two 45-second films on one composition system.",
    "status": "review",
    "tags": ["openscout", "v3"],
    "groups": [
      { "label": "Edit A · Dark hero", "order": 0 },
      { "label": "Score", "order": 1 }
    ],
    "items": [
      {
        "role": "final",
        "label": "Edit A · Dark hero — 16:9",
        "group": "Edit A · Dark hero",
        "preferred": true,
        "path": "out/openscout-v3/openscout-v3-dark-hero-1920x1080.mp4",
        "meta": { "format": "16:9", "durationSec": 45 }
      },
      {
        "role": "score",
        "label": "V3 beat bed (144 BPM)",
        "group": "Score",
        "preferred": true,
        "path": "public/tracks/openscout/openscout-v3-beat-score.wav"
      }
    ]
  }'
```

### Fields

- **`slug`** (or `compositionId`) — stable id and URL segment. Upserts on this.
  Derived from `title` when omitted.
- **`status`** — `draft | active | review | delivered | archived`.
- **`groups`** — the dossier's sections, ordered by `order`. Items join a
  section by `group` (label) or `groupId`.
- **`items[].role`** — what the member is *to this run*:
  `final`, `variant`, `source`, `composition`, `score`, `logo`, `treatment`,
  `validation`, `document`, `note`, `reference`.
- **`items[].preferred`** — the hero of its (group, role) bucket. Marking a new
  one demotes the previous; buckets the call didn't touch are left alone.
- **`items[].path`** — absolute or repo-relative. Stored repo-relative.
- **`items[].key`** — idempotency key. Derived from `role` + identity when
  omitted.
- **`itemsMode`** — `merge` (default) upserts the supplied items and leaves the
  rest alone; `replace` makes the supplied list the complete membership.
  Survivors keep their ids either way.

### Idempotency

The run upserts on `slug`; each member upserts on `key`. Re-posting the same
payload updates in place — no duplicates, ids unchanged, `createdAt` preserved.

Because ids are stable, deep links are stable: renaming an item's label, or
swapping the file behind an explicit `key`, does not break a link you already
handed to someone.

### Files that do not exist yet

A path that is not on disk is **not** an error. The member is recorded with
`state: "pending"`, the response carries a warning, and the editor shows it as a
pending deliverable. Re-post once the render lands and it upgrades to `ready`
in place.

This is what makes a run safe to declare *before* a long render finishes.

## Response

```json
{
  "ok": true,
  "created": false,
  "run": { "slug": "openscout-v3-montage", "items": [] },
  "createdItemIds": [],
  "updatedItemIds": ["edit-a-dark-hero-16-9"],
  "removedItemIds": [],
  "warnings": ["\"Edit B · Light ↔ Dark — 16:9\" is not on disk yet — recorded as pending"],
  "links": {
    "run": "http://localhost:3100/runs/openscout-v3-montage",
    "runs": "http://localhost:3100/runs",
    "api": "http://localhost:3100/api/runs/openscout-v3-montage",
    "hero": "http://localhost:3100/runs/openscout-v3-montage/items/edit-a-dark-hero-16-9",
    "items": {
      "edit-a-dark-hero-16-9": {
        "label": "Edit A · Dark hero — 16:9",
        "role": "final",
        "href": "http://localhost:3100/runs/openscout-v3-montage/items/edit-a-dark-hero-16-9",
        "deepLink": "http://localhost:3100/runs/openscout-v3-montage/items/edit-a-dark-hero-16-9",
        "state": "ready"
      }
    }
  }
}
```

`href` is the best link for that member — its native view when it has one, the
run deep link otherwise. `deepLink` is always the run-scoped path.

## Ending a turn

`formatRunHandoff(run, origin)` in `services/runs/intake.ts` builds the block to
return when work on a run is done — the run URL plus every preferred final and
score:

```text
Run: http://localhost:3100/runs/openscout-v3-montage
Edit A · Dark hero — 16:9: http://localhost:3100/runs/openscout-v3-montage/items/edit-a-dark-hero-16-9
Edit B · Light ↔ Dark — 16:9: http://localhost:3100/runs/openscout-v3-montage/items/edit-b-light-dark-16-9
Edit A score — V3 beat bed (144 BPM): http://localhost:3100/music/tracksopenscoutopenscout-v3-beat-score
```

The editor's right panel shows the same block with a copy button.

## Serving artifacts outside `public/`

Canonical deliverables live in `out/`, which Next does not serve — and copying
them into `public/` to look at them is exactly the duplication a run avoids.
`GET /api/runs/<slug>/artifacts/<itemId>` streams the file with byte-range
support, so the editor can play an `out/` master directly.

The allowlist is the run itself: a path is served only when the named run lists
it as the named item's `ref.path`, and only when it resolves inside the
checkout.

## Relationship to `/api/agents/jobs`

They compose:

- `/api/agents/jobs` **ingests** — copies media into `public/`, rebuilds the
  catalog, creates a job, and gives an artifact a native catalog identity.
- `/api/agents/runs` **organizes** — points at what already exists, in role
  order, with preferences and a stable URL.

Register a finished treatment through `jobs`, then attach it to a run and the
resolver picks up its catalog id and `/treatments/<id>` route automatically.
Neither endpoint requires touching catalog JSON directly.

## Repository helper

Scripts can skip HTTP:

```ts
import { submitAgentRun, formatRunHandoff } from '@/services/runs/intake'

const { run, links, warnings } = await submitAgentRun(payload)
console.log(formatRunHandoff(run, 'http://localhost:3100'))
```

`scripts/seed-openscout-v3-run.ts` is a worked example; `bun run
seed:openscout-v3-run --offline` uses the helper instead of the API.

## Storage

One JSON document per run under `.data/runs/<slug>.json`, written atomically.
Set `PREFRAME_RUNS_DIR` to relocate the store (the tests do).
