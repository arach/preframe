# Preframe capture-analysis architecture — review ask

**Date:** 2026-07-09<br>
**Ask:** Architecture review + direction check. Goal: reuse the existing Next.js web app; **no parallel product surface**.

## Product intent

1. Source assets land in Preframe catalog (`public/demos`, Assets view: analyzed / needs-analysis).
2. Batch **analyze** them: storyboard + **MiniMax VLM** per-frame detail + optional Whisper transcript.
3. Catalog rebuild so Assets shows complete analysis.
4. Then pick **1–2** clips and enqueue **composition jobs** that appear in the existing **Queue UI** (`/queue`).

Not: Talkie CLI as the product path. Not: a second queue/UI outside Preframe.

## Existing web app (source of truth)

| Surface | Path | Role |
|---------|------|------|
| Next app | `app/` | Catalog studio at :3100 |
| Assets | `catalog/slots/AssetsView.tsx` | Source assets + analysis status filters |
| Queue | `catalog/slots/QueueView.tsx` + `services/jobs/*` | Composition jobs: generate / revise / render / logo… |
| Catalog build | `scripts/build-catalog.ts` → `public/catalog-data.json` | Storyboards, transcripts, analysisStatus |
| Analyze pipeline | `scripts/analyze-video.ts`, `scripts/lib/*` | Scenes, pixel diff, VLM tags, editorial EDL |
| VLM wiring | `lib/vision-provider.ts`, `lib/provider.ts`, `lib/model-slots.ts` | **MiniMax** via anthropic-compat HTTP (`MiniMax-M3` @ `api.minimax.io/anthropic`); `MINIMAX_API_KEY` |
| Worker | `services/jobs/worker.ts` | Analysis today only as **side effect** of generate (`analyzeInputs`) |
| Agent job API | `services/agent-jobs/`, `POST /api/agents/jobs` | register / queue / treatment for external agents |
| Settings | `catalog/slots/SettingsView.tsx` | LLM / VLM / music / image slots |

**Gap:** no first-class **`analyze` job kind** in the composition queue — Assets cannot “Analyze selected/needs-analysis” into `/queue` with progress.

## What we added recently

### A. CLI helper (peripheral)

`scripts/process-captures.ts` + `bun run process`<br>
Talkie import + disk analyze. **Agent helper**, not the product surface.

### B. Eve operator agent (`agents/preframe/`)

Vercel **eve** filesystem agent:

- Tools: `list_assets`, `analyze_assets`, `rebuild_catalog`, `get_queue_jobs`, `enqueue_composition`
- Skill: `process_source_captures`
- `analyze_assets` shells to existing `scripts/analyze-video.ts` + optional diarize + catalog rebuild
- `enqueue_composition` POSTs to existing Preframe job API (`/api/compositions/:id/jobs`) so work shows in **existing Queue UI**

Eve agent brain model ≠ frame VLM. Frame VLM remains Preframe MiniMax.

## Direction options (need judgment)

**D1 — Thin eve agent + web app remains SoT (current lean)**<br>
Eve only orchestrates: list catalog → call analyze scripts / future APIs → enqueue existing job kinds. No second UI.
Risk: analysis still not first-class in Queue; progress UX weak.

**D2 — First-class `analyze` job in `services/jobs` + Assets bulk action**<br>
Add `JobKind: 'analyze'`, worker reuses `analyzeInputClip` / VLM, QueueView already lists jobs. Eve tools become thin HTTP clients to that API.
Best reuse of web app; single progress surface.

**D3 — Eve embeds or replaces product UI**<br>
Bad for “no duplication.” Reject unless eve is only an alternate *channel* into the same APIs.

## Reuse checklist (must not duplicate)

- [ ] One catalog: `public/catalog-data.json` + Assets view
- [ ] One queue: composition jobs SQLite + QueueView (extend kinds, don’t invent `.queue` manifests as product)
- [ ] One analyze pipeline: `scripts/lib` / worker, not a second vision path in eve
- [ ] One VLM config: Settings / `.data/provider.json` MiniMax slot
- [ ] Eve tools call Preframe APIs/scripts; no parallel “eve catalog” or “eve queue UI”

## Questions for Fable

1. Is **D2** the right north star (first-class analyze jobs + Assets actions), with eve as a **channel/orchestrator** only?
2. Should eve live under `agents/preframe` (sidecar app) vs somehow mounting into the Next app? Prefer least duplication and clearest ownership.
3. Any smell in shelling `bun run scripts/analyze-video.ts` from eve tools vs always going through the jobs worker?
4. What would you cut or merge (process-captures CLI vs eve vs agent-jobs API)?
5. Anything missing for “today’s videos → analyze all → treat two” as a single operator loop in the **existing** UI + agent?

Please critique architecture and recommend a concrete next slice (files/APIs only, no rewrite fantasy).
