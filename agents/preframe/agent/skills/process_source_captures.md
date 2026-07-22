---
description: >
  Batch-analyze Preframe source assets via Queue analyze jobs (MiniMax VLM +
  optional transcript), then pick 1–2 clips and enqueue composition jobs.
---

# Process source captures (Preframe)

**Product path only:** catalog Assets → `POST /api/assets/analyze` → Queue → generate.

All tools talk **HTTP to Preframe :3100**. No disk shelling.

## Procedure

1. `list_assets({ needsAnalysisOnly: true, since: "1d" })` (or app: "talkie")
2. `analyze_assets({ since: "1d", transcribe: true })` → enqueues per-clip analyze jobs
3. `get_queue_jobs({ status: "running" })` until analyze jobs complete
4. `list_assets({ analyzedOnly: true })` — pick 1–2 with the user
5. `enqueue_composition({ compositionId, videoIds, prompt, analyzeInputs: false })`
6. Point user at Queue UI

## Do not

- Force re-analyze without asking
- Enqueue more than ~2 generate jobs without confirmation
- Import from Talkie unless user explicitly wants the process-captures CLI
