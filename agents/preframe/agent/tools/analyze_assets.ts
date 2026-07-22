import { defineTool } from "eve/tools";
import { once } from "eve/tools/approval";
import { z } from "zod";
import { postAnalyze, preframeUrl } from "#lib/preframe.ts";

/**
 * Enqueue first-class Preframe `analyze` jobs (one per clip) via HTTP.
 * Worker runs MiniMax VLM storyboard + optional Whisper; results appear in /queue.
 */
export default defineTool({
  description:
    "Enqueue Preframe analyze jobs for source assets (storyboard + MiniMax VLM, optional transcript). Posts to /api/assets/analyze — does not shell local scripts. Prefer list_assets first.",
  inputSchema: z.object({
    ids: z.array(z.string()).optional(),
    since: z.string().optional(),
    app: z.string().optional(),
    needsAnalysisOnly: z.boolean().optional().default(true),
    limit: z.number().int().positive().optional(),
    transcribe: z.boolean().optional().default(false),
    force: z.boolean().optional().default(false),
  }),
  approval: once(),
  async execute(input) {
    const body = {
      ids: input.ids,
      since: input.since,
      app: input.app,
      limit: input.limit,
      transcribe: input.transcribe,
      force: input.force,
      // force re-analysis must include already-analyzed assets
      filter:
        input.ids?.length ||
        input.needsAnalysisOnly === false ||
        input.force
          ? ("all" as const)
          : ("needs-analysis" as const),
    };

    const result = await postAnalyze(body);
    return {
      preframeUrl: preframeUrl(),
      queue: `${preframeUrl()}/queue`,
      ...result,
      next:
        "Poll get_queue_jobs until analyze jobs complete, then list_assets { analyzedOnly: true } and enqueue_composition for 1–2 clips.",
    };
  },
});
