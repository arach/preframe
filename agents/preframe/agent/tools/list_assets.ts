import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  fetchCatalog,
  filterSourceVideos,
  isAnalyzed,
  needsAnalysis,
  preframeUrl,
} from "#lib/preframe.ts";

export default defineTool({
  description:
    "List Preframe catalog source assets via HTTP (served catalog-data.json). Filter by needs-analysis, analyzed, app, since, or ids.",
  inputSchema: z.object({
    needsAnalysisOnly: z.boolean().optional(),
    analyzedOnly: z.boolean().optional(),
    since: z.string().optional(),
    app: z.string().optional(),
    ids: z.array(z.string()).optional(),
    limit: z.number().int().positive().optional(),
  }),
  async execute(input) {
    const catalog = await fetchCatalog();
    const videos = filterSourceVideos(catalog.videos ?? [], input);
    const source = (catalog.videos ?? []).filter(
      (v) => v.stage === "source" || !v.stage,
    );
    return {
      preframeUrl: preframeUrl(),
      totalInCatalog: (catalog.videos ?? []).length,
      matched: videos.length,
      needsAnalysisCount: source.filter(needsAnalysis).length,
      analyzedCount: source.filter(isAnalyzed).length,
      assets: videos.map((v) => ({
        id: v.id,
        filename: v.filename,
        app: v.app,
        duration: v.duration,
        resolution: v.resolution,
        sizeMB: v.sizeMB,
        capturedAt: v.capturedAt,
        analysisStatus: v.analysisStatus ?? "none",
        storyboardDir: v.storyboardDir ?? null,
        hasTranscript: Boolean(v.transcript),
        description: v.description?.slice(0, 160),
      })),
    };
  },
});
