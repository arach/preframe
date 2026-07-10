# Preframe operator (eve agent)

[Vercel eve](https://vercel.com/eve) agent for the Preframe workspace.

**Capability:** treat catalog source assets as work — list / analyze (VLM storyboard + optional Whisper) / wait for automatic catalog rebuild / enqueue composition jobs in the Preframe Queue.

The agent tools are HTTP-only against the Preframe app (`PREFRAME_URL`, default `http://localhost:3100`); they do not read the monorepo filesystem or shell local scripts.

## Layout

```text
agents/preframe/
├── agent/
│   ├── agent.ts
│   ├── instructions.md
│   ├── tools/
│   │   ├── list_assets.ts
│   │   ├── analyze_assets.ts      ← core capture-processing capability
│   │   ├── rebuild_catalog.ts
│   │   ├── get_queue_jobs.ts
│   │   └── enqueue_composition.ts
│   ├── skills/
│   │   └── process_source_captures.md
│   └── lib/
│       └── preframe.ts
└── package.json
```

## Prerequisites

- **Node.js ≥ 24** (eve requirement). On this machine Homebrew Node 26 works:
  `export PATH="/opt/homebrew/bin:$PATH"`
- Preframe dev server on `:3100` (`bun run dev`) serving `/catalog-data.json` and the queue APIs.
- **Frame VLM (per-frame unpack):** Preframe’s **MiniMax** VLM slot — not Anthropic.
  Wire format is `anthropic` (Messages-compatible API at `https://api.minimax.io/anthropic`).
  Auth: `MINIMAX_API_KEY` or the VLM slot key in `.data/provider.json`.
- **Agent brain (this eve process):** separate from VLM. Defaults to AI Gateway /
  Anthropic for the chat/tool loop (`AI_GATEWAY_API_KEY` or provider key for the
  model in `agent.ts`). That key is **not** used for storyboard frame tagging.
- For transcription: `openai-whisper` available to `python3`.

## Run

```bash
cd agents/preframe
export PATH="/opt/homebrew/bin:$PATH"   # if system node < 24
export PREFRAME_URL=http://localhost:3100
export MINIMAX_API_KEY=…               # Preframe frame VLM (MiniMax)
export AI_GATEWAY_API_KEY=…            # eve agent model (or set PREFRAME_AGENT_MODEL)
npm run dev                            # eve TUI
```

HTTP session:

```bash
curl -X POST http://127.0.0.1:2000/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"List source assets that need analysis from the last day, then analyze them with transcription."}'
```

## Example prompts

- “Process today’s source videos: full VLM detail + transcripts, then recommend two for a treatment.”
- “What’s unanalyzed in the catalog? Analyze the Talkie ones only.”
- “Enqueue a generate job for `<id>` with prompt …”

## Tools

| Tool | Role |
|------|------|
| `list_assets` | Catalog source survey |
| `analyze_assets` | Storyboard + VLM (+ optional Whisper); worker rebuilds catalog |
| `rebuild_catalog` | No-op reminder that analyze jobs rebuild catalog automatically |
| `get_queue_jobs` | Read `/api/jobs` |
| `enqueue_composition` | Create composition job in Preframe Queue |

Approvals: `analyze_assets` uses `once()`; `enqueue_composition` uses `always()`.
