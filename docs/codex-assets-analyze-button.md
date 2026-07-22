# Task: AssetsView bulk Analyze button

## Context
Preframe is adding first-class `analyze` jobs. API will exist at:

`POST /api/assets/analyze`
Body: `{ ids?: string[], filter?: "needs-analysis" | "all", since?: string, app?: string, limit?: number, transcribe?: boolean, force?: boolean }`
Response: `{ ok, enqueued: number, jobIds: string[], skipped?: ..., error? }`

See also `docs/architecture-eve-agent-review-response.md`.

## Your job (UI only)
In `catalog/slots/AssetsView.tsx`:

1. Add a primary action button near the filters:
   - When filter is `needs-analysis` (or always with needs count): **"Analyze needs-analysis (N)"** where N = needsCount
   - Optionally support multi-select later — for now filter-based bulk is enough
2. On click: `POST /api/assets/analyze` with `{ filter: "needs-analysis" }` (or include current search/app if easy — optional)
3. While requesting: disabled + loading state
4. On success: toast or inline status with enqueued count + link/hint to open Queue view. Prefer existing catalog navigation if there's `setView('queue')` on catalog context — check `Provider.tsx` / LeftPanel for how view switches.
5. Match existing AssetsView styling (mono, white/opacity tokens, no new emoji, no garish colors)

## Do not
- Implement the API or worker (being done in parallel)
- Change analyze pipeline or eve agent
- Broad refactors

## Done when
- Button visible and wired
- Typechecks clean for the file
- Brief note of what you changed
