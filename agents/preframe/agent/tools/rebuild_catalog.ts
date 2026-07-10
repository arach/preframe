import { defineTool } from "eve/tools";
import { z } from "zod";
import { preframeUrl } from "#lib/preframe.ts";

/**
 * Catalog rebuild is performed by the worker after analyze jobs.
 * This tool is a no-op pointer so agents don't shell build-catalog.
 */
export default defineTool({
  description:
    "Note: catalog rebuild is automatic after analyze jobs complete. Prefer waiting on get_queue_jobs; if UI looks stale, refresh Assets.",
  inputSchema: z.object({
    reason: z.string().optional().describe("Why a rebuild is needed"),
  }),
  async execute(input) {
    return {
      ok: true,
      message:
        "Catalog rebuild runs inside the analyze worker when jobs complete. No separate rebuild endpoint is invoked from the agent.",
      reason: input.reason,
      preframeUrl: preframeUrl(),
      hint: "If Assets look stale, wait for analyze jobs to finish and refresh the Preframe UI.",
    };
  },
});
