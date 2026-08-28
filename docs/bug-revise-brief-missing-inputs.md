# Bug: the Revise action enqueues `revise-brief` jobs that cannot succeed

**Status:** open · **Reported:** 2026-08-15 by the operator, from `/queue`
**Severity:** the Revise workflow is unusable for every ingested treatment, and the
failure is unrecoverable once the job exists.

## What happened

Using the revision workflow on the treatment `openscout-theme-range-c-glasshouse`
created job `job_msugafxk_p63he0` (kind `revise-brief`, composition
`openscout-theme-range-c-glasshouse-rev-msugaeuf`), which went straight to FAILED with:

```
Brief requires both originalSource and reviewNotes inputs
```

The job's instruction — *"Synthesize a revision brief for
'openscout-theme-range-c-glasshouse' from the reviewer's notes."* — is intact, but the
queued job carries neither required input. **Retry cannot succeed**: a job's `inputs`
are frozen at enqueue time, so re-running replays the same empty payload into the same
throw. The only exit is to delete the job and start over, which the UI does not offer.

## Root cause

Two separate problems, stacked.

### 1. The UI swallows the fetch failure and enqueues anyway

`catalog/slots/VideoDetail.tsx:115` — `submitRevision`:

```ts
let originalSource = '';
const sourcePath = `.compositions/${compositionId}/Composition.tsx`;
try {
  const res = await apiClient.get(`/api/source?path=${encodeURIComponent(sourcePath)}`);
  if (res.ok) {
    const data = await res.json();
    originalSource = data.content ?? '';
  }
} catch {}                       // <- non-ok and thrown errors both vanish here

// ...enqueues unconditionally, with originalSource still ''
```

A 404 leaves `originalSource` as `''`, and nothing between that point and the POST
checks it. The worker is the first thing to notice, at
`services/jobs/worker.ts:1784`:

```ts
const originalSource = (inputs?.originalSource as string | undefined) ?? '';
const reviewNotes = (inputs?.reviewNotes as string | undefined) ?? '';
if (!originalSource || !reviewNotes) {
  throw new Error('Brief requires both originalSource and reviewNotes inputs');
}
```

So a precondition that is knowable in the browser, before any job exists, is instead
discovered by the worker after a job record has been created — which is what makes the
failure permanent rather than a corrected click.

`reviewNotes` is not the culprit here: `submitRevision` returns early when
`review.notes.length === 0`. The empty input is `originalSource`.

### 2. Ingested treatments have no `Composition.tsx` to read, ever

`.compositions/<id>/Composition.tsx` is written in exactly one place —
`services/jobs/worker.ts:1646`, on the *generate* path. The agent-jobs treatment
intake (`mode: 'treatment'`, `services/agent-jobs/intake.ts`) ingests a finished MP4 and
never writes one.

In this checkout `.compositions/` is **empty**, and the fetch behind the Revise button
404s for every composition in the catalog:

```
$ curl -o /dev/null -w '%{http_code}\n' \
    'http://localhost:3100/api/source?path=.compositions%2Fopenscout-theme-range-c-glasshouse%2FComposition.tsx'
404
```

This is therefore not a one-off. **Every treatment registered through
`/api/agents/jobs`** — which is how all the OpenScout films are registered, via
`scripts/register-openscout-*.ts` — fails the Revise workflow this way, 100% of the
time. The workflow only works for compositions Preframe generated itself.

## The fix the codebase already contains

`QueueView.tsx:555` — `submitRegenerate`, the `revise-render` sibling of this action —
gets it right, forty lines away:

```ts
const sourceRes = await apiClient.get(`/api/source?path=${encodeURIComponent(sourcePath)}`);
if (!sourceRes.ok) throw new Error(`Could not read original TSX (${sourceRes.status})`);
const { content: originalSource } = await sourceRes.json();
```

It throws before the POST and surfaces the message through `setRegenError`. No job is
created, and the operator sees why.

## Suggested resolution

1. **Validate before enqueueing** (fixes the reported symptom). In `submitRevision`,
   drop the `catch {}`, fail on `!res.ok` or empty `content`, and render the reason
   inline the way `submitRegenerate` does. No job record, no dead Retry.
2. **Do not offer Revise where it cannot work** (fixes the scope). The Revise affordance
   should be disabled, with a reason, for compositions that have no
   `.compositions/<id>/Composition.tsx` — i.e. anything ingested rather than generated.
   `QueueView` already computes `tsxPath` for this kind of check.
3. **Decide what revision means for an ingested treatment** (the design question behind
   both). These have no TSX to revise; a brief could still be synthesised from the MP4
   plus review notes, but that is a different job kind with different inputs, not
   `revise-brief` with a blank field. Worth an explicit decision rather than leaving the
   button wired to a path that cannot resolve.

A defence-in-depth note: the worker's throw is correct and should stay. The bug is that
it is the *first* line of defence rather than the last.

## Repro

1. Open any treatment ingested via `/api/agents/jobs` — e.g.
   `/treatments/openscout-theme-range-c-glasshouse`.
2. Add at least one review note.
3. Submit the revision.
4. `/queue` shows a FAILED `revise-brief` job with the error above; Retry re-fails.

## Artifacts

- Failed job: `job_msugafxk_p63he0`, composition
  `openscout-theme-range-c-glasshouse-rev-msugaeuf`, created 2026-08-15 10:07:41.
- Operator screenshot:
  `/var/folders/gq/hhq6lhks2dn7_s4j_f25hj040000gn/T/codex-clipboard-69a5baaa-b594-424a-a9aa-107da74d5836.png`
  (temp path — will not survive a reboot).

## Not done here

Nothing in this report is fixed. It was recorded, not repaired: the request was to log
the workflow bug, and the fix touches shared catalog UI outside the soundtrack work this
session was scoped to. The failed job is still sitting in `/queue`; it is inert, and
deleting it needs an endpoint that does not currently exist (no `DELETE` handler under
`app/api/compositions/`).
