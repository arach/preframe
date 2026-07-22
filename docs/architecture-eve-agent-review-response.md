# Preframe capture-analysis architecture — review response

**Date:** 2026-07-09
**Reviewer:** Fable (Claude Code)
**Responding to:** `docs/architecture-eve-agent-review.md`

## Verdict up front

D2 is right. The worker already contains the entire analyze pipeline — `analyzeInputClip` at `services/jobs/worker.ts:314` wraps `analyzeVideo` + `createConfiguredVisionProvider` (MiniMax) + catalog rebuild — it's just gated behind generate jobs. Promoting it to a first-class `analyze` kind is ~1 day of plumbing, and QueueView renders `job.kind` generically (`catalog/slots/QueueView.tsx:289`), so the Queue UI needs zero changes to show analyze jobs with progress. Eve should become HTTP-only against :3100. The shell-out layer in `agents/preframe/agent/lib/preframe.ts` is the main duplication vector and should be deleted once the job kind exists.

---

## Q1 — Is D2 the north star, eve as channel/orchestrator only?

**Yes, unambiguously.** The evidence is that D2 is barely new code:

- `analyzeInputClips` (worker.ts:359) already does per-clip activity logging (`appendActivity` per clip = per-clip progress in the existing job detail UI) and triggers `rebuildCatalog()` (worker.ts:1171–1173) on completion.
- `processJob` already has the early-branch pattern for non-composition kinds (`revise-brief` at worker.ts:1127, `logo-brief`/`logo-render` at 1134–1141). An `analyze` branch slots in identically and returns before the LLM planning stage — analyze jobs never touch the LLM.
- Job kind validation is the only gate: `validKinds` at `services/jobs/init.ts:48` and `services/jobs/routes.ts:120` (note: that list is duplicated in two files *and* diverges from the `JobKind` type at `services/jobs/types.ts:1` which already has `logo-brief`/`logo-render` — fix by exporting one `VALID_KINDS` const from types.ts).

Two design caveats for the analyze kind:

1. **Enqueue one analyze job per clip, not one mega-batch job.** The poll loop is strictly serial (`LIMIT 1`, worker.ts:1067). A 30-clip batch job would hold the worker for its whole duration with one progress bar; per-clip jobs give failure isolation, per-asset progress rows in /queue, and natural interleaving. Use the asset slug as `compositionId` — the existing "one active job per compositionId + kind" dedup (routes.ts:133) then gives you free "don't double-analyze this asset" semantics.
2. **`resolvePublicClip` (worker.ts:306) requires clips under `public/`** — fine, since Assets live in `public/demos`, but it means ingest (copy into demos) must happen before enqueue. That's already what `services/agent-jobs/intake.ts` does.

Eve's role: orchestration and selection only ("today's talkie clips", "these two are worth treating"). Every side effect goes through Preframe HTTP APIs so it lands in the visible queue.

## Q2 — `agents/preframe` sidecar vs mounting into Next?

**Keep the sidecar.** The location is not the problem; the *import surface* is.

- Different runtime and lifecycle: eve framework with its own dependency tree (there's already ~500k lines of vendored `node_modules` under `agents/preframe/`). Mounting that into the Next app graph buys nothing and invites exactly the D3 coupling the doc rejects.
- Clear ownership rule that makes the reuse checklist enforceable: **everything under `agents/` may only talk HTTP to :3100** — no `import` from `../../scripts`, no `fs` reads of `public/`, no `spawnSync("bun", ...)`. Today `agent/lib/preframe.ts` violates all three (`loadCatalog` reads `catalog-data.json` from disk at line 47, `runBun` at 139, `analyzeVideoFile`/`transcribeVideoFile` at 212–279).
- The disk reads aren't even necessary: `catalog-data.json` lives in `public/` and is already served — `GET ${PREFRAME_URL}/catalog-data.json` replaces `loadCatalog()` and kills the `PREFRAME_ROOT` env knob entirely.

Sidecar + HTTP-only is also what makes eve trivially deployable elsewhere later (it stops caring about sharing a filesystem with the repo).

## Q3 — Smell in eve shelling `bun run scripts/analyze-video.ts`?

**Yes — three concrete ones.** It's acceptable scaffolding until the analyze kind exists, and should be deleted the day it does.

1. **Invisible, unserialized work.** Shelled analysis creates no job record: no /queue visibility, no activity log, no idempotency, and — worse — no mutual exclusion with the worker. Eve analyzing a clip while a generate job's `analyzeInputs` runs on the same clip means two processes writing the same `storyboard-<id>/` directory concurrently.
2. **Fragile output scraping.** `analyzeVideoFile` (preframe.ts:212) filters stdout lines that "don't start with `{`" and then *re-derives* `storyboardDir` by re-implementing the filename sanitizer. That sanitizer now exists in **four copies**: worker.ts:298, analyze-video.ts:51, preframe.ts:228, process-captures.ts:113. Any drift silently breaks catalog↔storyboard association.
3. **Config divergence.** `analyze-video.ts` hand-parses `.env.local` (lines 12–20); the worker resolves provider config through `lib/provider.ts`. Two config paths to the same MiniMax key will eventually disagree.

## Q4 — Cut / merge: process-captures CLI vs eve vs agent-jobs API

| Piece | Keep? | Becomes |
|---|---|---|
| `services/agent-jobs/intake.ts` + `/api/agents/jobs` | **Keep** | The one ingress for external files → `public/` + queue. Unchanged. |
| `scripts/process-captures.ts` | **Slim** | Acquisition shim only: talkie CLI discovery (`talkiePaths`, `talkieContextSummary`) + copy into demos + `--register`. Delete its inline analyze (line 386), vision provider setup (327), whisper stage (196–252), catalog rebuild (444) — all become "enqueue analyze jobs" via the new endpoint. The talkie CLI dependency is why this stays a script and doesn't merge into intake. |
| `agents/preframe` tools | **Keep, thin** | `list_assets` → HTTP GET catalog; `analyze_assets` → POST analyze jobs; `enqueue_composition`, `get_queue_jobs` already HTTP — keep. Delete `analyzeVideoFile`, `transcribeVideoFile`, `runBun`, `rebuildCatalog` from `agent/lib/preframe.ts`. |

**Duplication inventory found while reviewing** (the smells you asked about, concretely):

1. **Whisper transcript + JSON normalization — 2 near-identical copies**, already diverging: `scripts/process-captures.ts:196–252` keeps the `speaker` field; `agents/preframe/agent/lib/preframe.ts:240–279` drops it. Extract to `scripts/lib/transcribe.ts`, called by the worker's analyze branch.
2. **Storyboard-id sanitizer — 4 copies** (worker.ts:298, analyze-video.ts:51, preframe.ts:228, process-captures.ts:113). One export in `scripts/lib`.
3. **`bun run scripts/build-catalog.ts` shell-out — 4 copies** (worker.ts:1027, intake.ts:537, preframe.ts:160, process-captures.ts:444). The two in-repo product copies (worker, intake) should share one helper; the eve/CLI copies disappear per the table above.
4. **analyzed/needs-analysis predicates — 2+ copies** (`catalog/slots/AssetsView.tsx:21–24`, preframe.ts:74–80). Belongs next to the catalog types.
5. **compositionId slugify — 3 variants** (intake.ts:514, enqueue_composition.ts:71, process-captures.ts:103).
6. **`validKinds` — 2 string arrays + 1 type**, mutually inconsistent (init.ts:48 and routes.ts:120 don't include the logo kinds that `JobKind` has).

## Q5 — Missing for "today's videos → analyze all → treat two" as one loop?

The loop, with what exists (✓) and what's missing (✗):

1. ✓ Acquire: `bun run process --from talkie --since 1d --register` (after slimming: import + register only).
2. ✗ **`analyze` job kind** — the core gap (D2).
3. ✗ **Batch enqueue endpoint** — `POST /api/assets/analyze` `{ ids? , filter?: 'needs-analysis', since?, app?, transcribe? }` → resolves catalog entries server-side, enqueues one analyze job per clip, returns `jobIds[]` + `/queue`. Both the AssetsView button and eve's `analyze_assets` call this; selection logic lives once, server-side (today it lives in eve's `filterSourceVideos`, preframe.ts:82 — move it here).
4. ✗ **Assets bulk action** — AssetsView has status filters but zero actions (no analyze button exists). One button: "Analyze needs-analysis (N)" → the endpoint → link to /queue.
5. ✓ Progress/completion: QueueView + `GET /api/jobs/:id` polling is enough for eve to know when to proceed.
6. ✓ Treat two: `enqueue_composition` already posts real jobs with `analyzeInputs` param; once assets are pre-analyzed, pass `analyzeInputs: false` (or better: make the worker skip re-analysis when `edl.json` already exists — it currently re-runs unconditionally per generate job).
7. Optional: `transcribe` as a param on analyze jobs (Whisper), using the single extracted transcribe helper.

## Next implementation slice (ordered, no rewrites)

1. **`services/jobs/types.ts`** — add `'analyze'` to `JobKind`; export `VALID_KINDS`; use it in `init.ts:48` and `routes.ts:120`.
2. **`services/jobs/worker.ts`** — early branch in `processJob`: `if (kind === 'analyze')` → run `analyzeInputClips(clips, jobId)` (+ optional transcribe param), `rebuildCatalog()` once, `completeJob` with per-clip summaries. ~50–60 lines, all existing helpers.
3. **`app/api/assets/analyze/route.ts`** — batch endpoint per Q5.3; enqueues per-clip analyze jobs with asset-slug compositionIds.
4. **`catalog/slots/AssetsView.tsx`** — bulk "Analyze" button on the needs-analysis filter.
5. **`agents/preframe`** — `analyze_assets` becomes a POST to (3); `list_assets` fetches `/catalog-data.json` over HTTP; delete `analyzeVideoFile`/`transcribeVideoFile`/`runBun`/`rebuildCatalog` from `agent/lib/preframe.ts`; update the `process_source_captures` skill to: list → POST analyze → poll jobs → enqueue_composition.
6. **`scripts/process-captures.ts`** — strip analyze/transcribe/catalog stages; keep talkie import + notes + `--register`; add `--analyze` flag that hits (3).

Steps 1–4 are the product slice; 5–6 are the dedup payoff and can trail by a day. MiniMax VLM wiring needs no changes — `lib/vision-provider.ts` + the `vlm` slot in `lib/model-slots.ts` are already the single config path, and the worker's analyze branch inherits them via `createConfiguredVisionProvider()`.
