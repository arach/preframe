export interface VisionTag {
  frameFile: string;
  time: number;
  tags: string[];
  description: string;
  contentType: string;
  provider?: string;
  model?: string;
  prompt?: string;
  rawText?: string;
  rawResponse?: unknown;
  error?: string;
}

export interface Scene {
  index?: number;
  start?: number;
  end?: number;
  time?: number;
  description: string;
  tags?: string[];
  contentType?: string;
  activity?: string;
  frameFile?: string;
  frameKind?: string;
  score?: number;
  motionArea?: string;
  quadrants?: Record<"topLeft" | "topRight" | "bottomLeft" | "bottomRight", number>;
}

export interface EdlStats {
  totalSceneBreaks: number;
  activeTime: number;
  idleTime: number;
  transitionTime: number;
  framesAnalyzed: number;
  estimatedTokens: number;
}

export interface Clip {
  start: number;
  end: number;
  title: string;
  reason: string;
}

export interface Highlight {
  time: number;
  reason: string;
  frameFile?: string;
}

export interface FrameOverlayRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FrameOverlay {
  provider: string;
  label: string;
  rect: FrameOverlayRect;
  confidence?: string;
  note?: string;
  source?: string;
}

export interface DeadTime {
  start: number;
  end: number;
  duration?: number;
  reason: string;
}

export interface Edl {
  source: string;
  duration: number;
  resolution: string;
  fps: number;
  analyzedAt: string;
  scenes: Scene[];
  highlights: Highlight[];
  suggestedClips: Clip[];
  deadTime: DeadTime[];
  stats: EdlStats;
  storyboardDir: string;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  text: string;
  segments: TranscriptSegment[];
  language: string;
}

export type VideoStage = "source" | "wip" | "final";
export type CompositionEngine = "remotion" | "hyperframes";

export interface Video {
  id: string;
  filename: string;
  sourcePath: string | null;
  demosPath: string | null;
  capturedAt: string | null;
  resolution: string;
  fps: number;
  duration: number;
  codec: string;
  sizeMB: number;
  app: string;
  tags: string[];
  description: string;
  scenes: Scene[];
  storyboardDir: string | null;
  analysisStatus: string;
  composition: string | null;
  reelCandidate: boolean;
  note?: string;
  edl?: Edl;
  visionTags?: VisionTag[];
  frameOverlays?: Record<string, FrameOverlay[]>;
  frameCount?: number;
  frames?: string[];
  transcript?: Transcript;
  srt?: string;
  stage?: VideoStage;
  engine?: CompositionEngine;
  videoUrl?: string;
}

export type ReviewNoteKind = "feedback" | "zoom";

export interface ReviewRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ReviewNote {
  id: string;
  time: number | null;
  endTime?: number;
  kind: ReviewNoteKind;
  rect?: ReviewRect;
  comment: string;
  createdAt: string;
}

export interface OrphanStoryboard {
  storyboardDir: string;
  frameCount: number;
  frames: string[];
  edl: Edl | null;
  visionTags: VisionTag[] | null;
}

export interface AudioAsset {
  id: string;
  filename: string;
  sourcePath: string | null;
  path: string;
  capturedAt: string;
  generatedAt?: string;
  duration: number;
  codec: string;
  sampleRate: number | null;
  channels: number | null;
  bitrate: number | null;
  sizeMB: number;
  app: string;
  generated: boolean;
  provider?: string;
  model?: string;
  prompt?: string;
  lyrics?: string;
  instrumental?: boolean;
  songTitle?: string;
  styleTags?: string;
  lyricsGeneration?: Record<string, unknown>;
  compositionId?: string;
  parentTrackId?: string;
  revisionOf?: string;
  feedback?: string;
  request?: Record<string, unknown>;
  result?: Record<string, unknown>;
  sidecar?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Logo composition framework
//
// A LogoAsset is an animatable logo project: a source artifact (SVG, PNG, or
// prompt-only) + an optional rendered Hyperframe + an optional motion brief.
//
// Storage layout:
//   public/inbox/logos/<id>.svg                          ← uploaded source
//   .compositions/logos/<id>/Composition.html            ← rendered Hyperframe
//   .compositions/logos/<id>/brief.md                    ← confirmed motion plan
//   .compositions/logos/<id>/manifest.json               ← (future) Hudson manifest
//
// Round-trip with Hudson Logo Designer flows through AppIntents
// (`logo:export-manifest` inbound, `logo:open` outbound).
// ---------------------------------------------------------------------------

export type LogoSourceKind = "svg" | "png" | "prompt-only";

export interface LogoSource {
  kind: LogoSourceKind;
  /** Public path to the uploaded source file, e.g. /inbox/logos/lg-xxx.svg. */
  path?: string;
  /** Original filename at upload time. */
  filename?: string;
  /** Free-text description for prompt-only mode. */
  prompt?: string;
}

export interface LogoAsset {
  id: string;
  source: LogoSource;
  capturedAt: string;
  /** Path under public/ to the rendered Hyperframe, when a render exists. */
  compositionPath?: string;
  /** Path under public/ to the confirmed motion brief markdown. */
  briefPath?: string;
  /** Path under public/ to the latest manifest.json if Hudson handed one off. */
  manifestPath?: string;
  /** Manifest schema version when this logo was ingested. Pin to v1 contract. */
  manifestVersion?: string;
  /** True when at least one logo-render job has succeeded. */
  hasRender: boolean;
  /** Optional human-readable display name; defaults to id. */
  title?: string;
  /** The most recent prompt the user submitted. */
  lastPrompt?: string;
}

export type FrameSlotType = "text" | "color" | "number" | "boolean" | "select";

export interface FrameSlot {
  key: string;
  label: string;
  type: FrameSlotType;
  default?: string | number | boolean;
  options?: string[];
  required?: boolean;
}

export interface CompositionFrame {
  id: string;
  name: string;
  description?: string;
  engine: "remotion" | "hyperframes" | "both";
  tags?: string[];
  slots: FrameSlot[];
  hyperframesPath?: string;
  remotionComponent?: string;
  thumbnail?: string;
  previewUrl?: string;
}

export type SnippetCategory = "capture" | "read" | "listen" | "explore";

export interface CuratedSnippet {
  id: string;
  source: string;
  timestamp: number;
  startFrom: number;
  category: SnippetCategory;
  rating: number;
  description: string;
  tags: string[];
  frameFile: string;
}

export interface CuratedSnippetsData {
  generatedAt: string;
  snippets: CuratedSnippet[];
}

export interface CatalogData {
  meta: { generatedAt: string; videoCount: number; audioCount?: number; logoCount?: number };
  videos: Video[];
  audioAssets?: AudioAsset[];
  logos?: LogoAsset[];
  frames?: CompositionFrame[];
  orphanStoryboards?: OrphanStoryboard[];
  curatedSnippets?: CuratedSnippetsData;
}

export interface Filter {
  id: string;
  label: string;
}

export function formatTime(s: number | null | undefined): string {
  if (s == null) return "--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatDuration(s: number | null | undefined): string {
  if (s == null) return "--";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
}

/** Absolute local date/time for tooltips and secondary lines. */
export function formatAbsoluteDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Human recency for capture dates — primary label on Assets.
 * Examples: just now, 12m ago, 3h ago, Today 4:12 PM, Yesterday, 3d ago, Jul 3.
 */
export function formatRecency(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";

  const diff = nowMs - d.getTime();
  if (diff < 0) return formatAbsoluteDate(iso);

  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfThatDay = new Date(d);
  startOfThatDay.setHours(0, 0, 0, 0);
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000,
  );

  if (dayDiff === 0) {
    return `Today ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff}d ago`;

  // Older than a week: compact calendar date
  const sameYear = d.getFullYear() === startOfToday.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Bucket label for grouping assets by recency. */
export function recencyBucket(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): "today" | "yesterday" | "this-week" | "earlier" | "unknown" {
  if (!iso) return "unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";

  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfThatDay = new Date(d);
  startOfThatDay.setHours(0, 0, 0, 0);
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000,
  );

  if (dayDiff <= 0) return "today";
  if (dayDiff === 1) return "yesterday";
  if (dayDiff < 7) return "this-week";
  return "earlier";
}

export const RECENCY_BUCKET_LABELS: Record<
  ReturnType<typeof recencyBucket>,
  string
> = {
  today: "Today",
  yesterday: "Yesterday",
  "this-week": "This week",
  earlier: "Earlier",
  unknown: "Unknown date",
};
