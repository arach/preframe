# Task: Verify MiniMax-M3 vision + re-analyze smoke

## Context
Preframe VLM was defaulting to MiniMax-M2.7 (text-only). MiniMax Anthropic-compat only supports `type=image` on **MiniMax-M3**. Defaults + `.data/provider.json` were updated to M3.

## Verify
1. `lib/model-slots.ts` VLM default is `MiniMax-M3`
2. `.data/provider.json` vlm.model is `MiniMax-M3` (do not print API keys)
3. `createConfiguredVisionProvider` still uses Anthropic SDK + MiniMax baseUrl (not MCP unless model is understand_image)
4. Optional: force-reanalyze one asset via `POST http://localhost:3100/api/assets/analyze` with `{"ids":["talkie-tune-settings-primitive"],"force":true}` if server is up; confirm layer3 tags have real descriptions (not "No image was provided")

## Fix if needed
- Any remaining M2.7 defaults in docs/settings copy
- If force analyze fails, report root cause only

## Out of scope
- Codex PATH install on this machine
- Broad refactors

Report: findings + files changed (if any).
