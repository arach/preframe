import { defineTool } from "eve/tools";
import { z } from "zod";
import { listJobs, preframeUrl } from "#lib/preframe.ts";

export default defineTool({
  description:
    "List Preframe composition queue jobs (generate / revise / render / etc.) from the local Preframe API. Requires Preframe dev server.",
  inputSchema: z.object({
    status: z
      .enum(["queued", "running", "completed", "failed", "canceled"])
      .optional()
      .describe("Filter by job status"),
    limit: z.number().int().positive().optional().default(20),
  }),
  async execute(input) {
    try {
      const jobs = (await listJobs()) as Array<Record<string, unknown>>;
      let list = Array.isArray(jobs) ? jobs : [];
      if (input.status) {
        list = list.filter((j) => j.status === input.status);
      }
      list = list.slice(0, input.limit ?? 20);
      return {
        preframeUrl: preframeUrl(),
        count: list.length,
        jobs: list.map((j) => ({
          jobId: j.jobId,
          compositionId: j.compositionId,
          kind: j.kind,
          status: j.status,
          progress: j.progress,
          lastMessage: j.lastMessage,
          createdAt: j.createdAt,
          error: j.error,
        })),
      };
    } catch (e: any) {
      return {
        ok: false,
        error: e.message,
        hint: `Start the Preframe dev server at ${preframeUrl()} (for example: bun run dev in the Preframe repo).`,
      };
    }
  },
});
