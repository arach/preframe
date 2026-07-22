import { createHash } from "node:crypto";
import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { fetchCatalog, postJob, preframeUrl } from "#lib/preframe.ts";

export default defineTool({
  description:
    "Enqueue a Preframe composition job for analyzed source clips via HTTP. Creates a job in /queue. Prefer analyzed assets; pass analyzeInputs: false when EDLs already exist.",
  inputSchema: z.object({
    compositionId: z.string().min(1),
    videoIds: z.array(z.string()).min(1),
    prompt: z.string().min(1),
    kind: z
      .enum(["generate", "prepare", "revise-brief", "revise", "render"])
      .optional()
      .default("generate"),
    name: z.string().optional(),
    analyzeInputs: z
      .boolean()
      .optional()
      .default(false)
      .describe("Default false — reuse existing EDLs from prior analyze jobs"),
  }),
  approval: always(),
  async execute(input) {
    const catalog = await fetchCatalog();
    const clips: string[] = [];
    const missing: string[] = [];

    for (const id of input.videoIds) {
      const video = (catalog.videos ?? []).find(
        (v) => v.id === id || v.filename === id,
      );
      if (!video) {
        missing.push(id);
        continue;
      }
      const path =
        video.demosPath?.replace(/^\/+/, "") ||
        (video.filename ? `demos/${video.filename}` : null);
      if (!path) {
        missing.push(id);
        continue;
      }
      clips.push(path);
    }

    if (clips.length === 0) {
      return { ok: false, error: "No resolvable clips", missing };
    }

    const compositionId = input.compositionId
      .toLowerCase()
      .replace(/[^a-z0-9\-\u4e00-\u9fff]+/gi, "-")
      .replace(/^-|-$/g, "");

    const kind = input.kind ?? "generate";
    // Content-addressed key so prompt/clip revisions create a new job; identical
    // retries remain idempotent. Active-job dedup still applies server-side.
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          compositionId,
          kind,
          prompt: input.prompt,
          clips,
          analyzeInputs: input.analyzeInputs ?? false,
        }),
      )
      .digest("hex")
      .slice(0, 16);

    const result = await postJob({
      compositionId,
      kind,
      prompt: input.prompt,
      inputs: { clips },
      params: {
        name: input.name ?? compositionId,
        analyzeInputs: input.analyzeInputs ?? false,
      },
      idempotencyKey: `eve:enqueue:${compositionId}:${kind}:${fingerprint}`,
    });

    return {
      ok: result.ok,
      status: result.status,
      compositionId,
      clips,
      missing,
      response: result.body,
      open: `${preframeUrl()}/queue`,
    };
  },
});
