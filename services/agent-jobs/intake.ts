import { copyFile, mkdir, realpath, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { appendActivity, completeJob, findByIdempotencyKey, getJob, insertJob } from '@/services/jobs/db';
import { createJob } from '@/services/jobs/init';
import type { JobKind, JobRecord } from '@/services/jobs/types';
import { expandHome, readIngestSettings } from '@/lib/ingest';

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');
const COMPOSITIONS = join(ROOT, '.compositions');

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.gif']);
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg']);
const PUBLIC_ROOTS = ['demos', 'inbox', 'wip', 'out', 'tracks'];

type AgentJobMode = 'register' | 'queue' | 'treatment';
type AgentSourceRole = 'clip' | 'audio';

interface AgentSourceObject {
  path?: string;
  src?: string;
  filePath?: string;
  filename?: string;
  role?: AgentSourceRole;
  label?: string;
}

interface AgentAttachmentObject {
  path?: string;
  filePath?: string;
  filename?: string;
  label?: string;
  kind?: string;
  content?: unknown;
}

interface AgentJobRequest {
  mode?: AgentJobMode;
  action?: AgentJobMode;
  name?: string;
  title?: string;
  compositionId?: string;
  prompt?: string;
  instructions?: string;
  kind?: JobKind;
  idempotencyKey?: string;
  sources?: Array<string | AgentSourceObject>;
  clips?: Array<string | AgentSourceObject>;
  audio?: Array<string | AgentSourceObject>;
  outputs?: Array<string | AgentSourceObject>;
  treatments?: Array<string | AgentSourceObject>;
  attachments?: Array<string | AgentAttachmentObject>;
  params?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  agent?: string | Record<string, unknown>;
}

interface RegisteredAsset {
  role: AgentSourceRole;
  inputPath: string;
  resolvedPath: string;
  filename: string;
  publicPath: string;
  publicUrl: string;
  existing: boolean;
  sizeBytes: number;
}

interface RegisteredAttachment {
  inputPath?: string;
  filename: string;
  label?: string;
  kind?: string;
  path: string;
  sizeBytes: number;
}

export interface AgentJobSubmitResult {
  ok: true;
  mode: AgentJobMode;
  created: boolean;
  job: JobRecord;
  assets: RegisteredAsset[];
  attachments: RegisteredAttachment[];
  links: {
    queue: string;
    jobApi: string;
    compositionJobsApi: string;
  };
  warnings: string[];
}

export class IntakeError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function isIntakeError(err: unknown): err is IntakeError {
  return err instanceof IntakeError;
}

export async function submitAgentJob(body: AgentJobRequest): Promise<AgentJobSubmitResult> {
  const title = stringValue(body.title) ?? stringValue(body.name) ?? 'Agent video job';
  const compositionId = normalizeCompositionId(body.compositionId ?? title);
  const mode = body.mode ?? body.action ?? 'register';
  const prompt = stringValue(body.prompt) ?? stringValue(body.instructions) ?? `Prepare "${title}" for motion treatment.`;
  const kind = body.kind ?? (mode === 'queue' ? 'generate' : mode === 'treatment' ? 'render' : 'prepare');
  let idempotencyKey = stringValue(body.idempotencyKey) ?? `agent:${mode}:${compositionId}`;

  if (mode !== 'register' && mode !== 'queue' && mode !== 'treatment') {
    throw new IntakeError('mode must be "register", "queue", or "treatment"');
  }

  const existing = findByIdempotencyKey(idempotencyKey);
  if (existing) {
    // Only pin in-flight jobs. Completed/failed keys would permanently block
    // re-register/re-queue for the same composition — bump the key instead.
    if (existing.status === 'queued' || existing.status === 'running') {
      return {
        ok: true,
        mode,
        created: false,
        job: existing,
        assets: [],
        attachments: [],
        links: linksFor(existing),
        warnings: ['idempotencyKey matched an active job; no files were copied'],
      };
    }
    idempotencyKey = `${idempotencyKey}:r${Date.now().toString(36)}`;
  }

  const sourceInputs = collectSources(body);
  const outputInputs = collectOutputs(body);
  if (mode === 'treatment') {
    if (outputInputs.length === 0) {
      throw new IntakeError('Treatment mode requires at least one output path');
    }

    const assets = await Promise.all(outputInputs.map((input) => registerAsset(input, 'out')));
    const attachments = await Promise.all((body.attachments ?? []).map((attachment) => registerAttachment(compositionId, attachment)));
    await rebuildCatalog();

    const outputs = assets.map((asset) => asset.publicPath);
    const jobId = generateJobId();
    const params = {
      ...(body.params ?? {}),
      name: title,
      agent: body.agent,
      agentSubmitted: true,
      agentSubmissionMode: mode,
      metadata: body.metadata,
    };
    const inputs = {
      outputs,
      attachments,
      assets,
    };

    const record = insertJob({
      jobId,
      compositionId,
      kind,
      prompt,
      inputs,
      params,
      idempotencyKey,
    });

    appendActivity(jobId, {
      stage: 'agent-treatment',
      message: `Registered ${assets.length} completed treatment${assets.length !== 1 ? 's' : ''} for "${title}"`,
      detail: assets.map((asset) => `${asset.inputPath} -> ${asset.publicPath}`).join('\n'),
    });

    completeJob(jobId, {
      outputUrls: [
        ...outputs,
        ...attachments.map((attachment) => attachment.path),
      ],
      metadata: {
        kind,
        title,
        description: prompt,
        durationSec: numberValue(body.params?.durationSec) ?? numberValue(body.metadata?.durationSec),
        width: numberValue(body.params?.width) ?? numberValue(body.metadata?.width),
        height: numberValue(body.params?.height) ?? numberValue(body.metadata?.height),
        fps: numberValue(body.params?.fps) ?? numberValue(body.metadata?.fps),
        clipCount: outputInputs.length,
        audioTrackCount: 0,
        compositionDir: `.compositions/${compositionId}`,
        videoPath: outputs[0],
        assets,
        attachments,
        agent: body.agent,
        sourceMetadata: body.metadata,
      },
    });

    const job = getJob(record.jobId);
    if (!job) throw new IntakeError('Treatment was registered but could not be read back', 500);

    return {
      ok: true,
      mode,
      created: true,
      job,
      assets,
      attachments,
      links: linksFor(job),
      warnings: [],
    };
  }

  if (sourceInputs.length === 0) {
    throw new IntakeError('At least one source, clip, or audio path is required');
  }

  const assets = await Promise.all(sourceInputs.map((input) => registerAsset(input)));
  const attachments = await Promise.all((body.attachments ?? []).map((attachment) => registerAttachment(compositionId, attachment)));
  await rebuildCatalog();

  const clips = assets.filter((asset) => asset.role === 'clip').map((asset) => asset.publicPath);
  const audio = assets.filter((asset) => asset.role === 'audio').map((asset) => asset.publicPath);
  const params = {
    ...(body.params ?? {}),
    name: title,
    agent: body.agent,
    agentSubmitted: true,
    agentSubmissionMode: mode,
    metadata: body.metadata,
  };
  const inputs = {
    clips,
    audio,
    attachments,
    assets,
  };

  if (mode === 'queue') {
    const result = await createJob(compositionId, {
      kind,
      prompt,
      inputs,
      params,
      idempotencyKey,
    });

    if (result.error) {
      throw new IntakeError(result.error, result.status);
    }
    if (!result.data) {
      throw new IntakeError('Job creation returned no data', 500);
    }

    const job = getJob(result.data.jobId);
    if (!job) throw new IntakeError('Job was created but could not be read back', 500);
    return {
      ok: true,
      mode,
      created: result.status === 201,
      job,
      assets,
      attachments,
      links: linksFor(job),
      warnings: [],
    };
  }

  const jobId = generateJobId();
  const record = insertJob({
    jobId,
    compositionId,
    kind,
    prompt,
    inputs,
    params,
    idempotencyKey,
  });

  appendActivity(jobId, {
    stage: 'agent-intake',
    message: `Registered ${assets.length} local asset${assets.length !== 1 ? 's' : ''} for "${title}"`,
    detail: assets.map((asset) => `${asset.inputPath} -> ${asset.publicPath}`).join('\n'),
  });

  if (attachments.length > 0) {
    appendActivity(jobId, {
      stage: 'agent-intake',
      message: `Attached ${attachments.length} source material file${attachments.length !== 1 ? 's' : ''}`,
      detail: attachments.map((attachment) => attachment.path).join('\n'),
    });
  }

  completeJob(jobId, {
    outputUrls: [
      ...clips,
      ...audio,
      ...attachments.map((attachment) => attachment.path),
    ],
    metadata: {
      kind,
      title,
      description: prompt,
      durationSec: numberValue(body.params?.durationSec) ?? numberValue(body.metadata?.durationSec),
      width: numberValue(body.params?.width) ?? numberValue(body.metadata?.width),
      height: numberValue(body.params?.height) ?? numberValue(body.metadata?.height),
      fps: numberValue(body.params?.fps) ?? numberValue(body.metadata?.fps),
      clipCount: clips.length,
      audioTrackCount: audio.length,
      compositionDir: `.compositions/${compositionId}`,
      videoPath: clips[0],
      assets,
      attachments,
      agent: body.agent,
      sourceMetadata: body.metadata,
    },
  });

  const job = getJob(record.jobId);
  if (!job) throw new IntakeError('Job was registered but could not be read back', 500);

  return {
    ok: true,
    mode,
    created: true,
    job,
    assets,
    attachments,
    links: linksFor(job),
    warnings: [],
  };
}

function collectSources(body: AgentJobRequest): AgentSourceObject[] {
  const out: AgentSourceObject[] = [];
  for (const item of body.sources ?? []) out.push(sourceObject(item));
  for (const item of body.clips ?? []) out.push({ ...sourceObject(item), role: 'clip' });
  for (const item of body.audio ?? []) out.push({ ...sourceObject(item), role: 'audio' });
  return out;
}

function collectOutputs(body: AgentJobRequest): AgentSourceObject[] {
  const out: AgentSourceObject[] = [];
  for (const item of body.outputs ?? []) out.push({ ...sourceObject(item), role: 'clip' });
  for (const item of body.treatments ?? []) out.push({ ...sourceObject(item), role: 'clip' });
  return out;
}

function sourceObject(item: string | AgentSourceObject): AgentSourceObject {
  return typeof item === 'string' ? { path: item } : item;
}

async function registerAsset(input: AgentSourceObject, publicDir?: 'demos' | 'tracks' | 'out'): Promise<RegisteredAsset> {
  const inputPath = stringValue(input.path) ?? stringValue(input.src) ?? stringValue(input.filePath);
  if (!inputPath) throw new IntakeError('Source is missing path/src/filePath');

  const resolved = await resolveSourcePath(inputPath);
  const info = await stat(resolved.resolvedPath);
  if (!info.isFile()) throw new IntakeError(`Source is not a file: ${inputPath}`);

  const role = input.role ?? inferRole(inputPath);
  const filename = sanitizeFilename(input.filename ?? basename(inputPath));
  const dest = await choosePublicDestination(filename, role, info.size, publicDir);

  if (!dest.existing) {
    await copyFile(resolved.resolvedPath, dest.resolvedPath);
  }

  return {
    role,
    inputPath,
    resolvedPath: resolved.resolvedPath,
    filename: dest.filename,
    publicPath: dest.publicPath,
    publicUrl: `/${dest.publicPath}`,
    existing: dest.existing,
    sizeBytes: info.size,
  };
}

async function registerAttachment(
  compositionId: string,
  input: string | AgentAttachmentObject,
): Promise<RegisteredAttachment> {
  const item = typeof input === 'string' ? { path: input } : input;
  const attachmentDir = join(COMPOSITIONS, compositionId, 'agent-submission');
  await mkdir(attachmentDir, { recursive: true });

  if (item.content !== undefined) {
    const filename = sanitizeFilename(item.filename ?? `${item.kind ?? item.label ?? 'attachment'}.json`);
    const path = join(attachmentDir, filename);
    const content = typeof item.content === 'string'
      ? item.content
      : JSON.stringify(item.content, null, 2);
    await writeFile(path, content, 'utf-8');
    const info = await stat(path);
    return {
      filename,
      label: item.label,
      kind: item.kind,
      path: relative(ROOT, path),
      sizeBytes: info.size,
    };
  }

  const inputPath = stringValue(item.path) ?? stringValue(item.filePath);
  if (!inputPath) throw new IntakeError('Attachment is missing path/filePath or content');

  const resolved = await resolveSourcePath(inputPath);
  const info = await stat(resolved.resolvedPath);
  if (!info.isFile()) throw new IntakeError(`Attachment is not a file: ${inputPath}`);

  const filename = sanitizeFilename(item.filename ?? basename(inputPath));
  const path = join(attachmentDir, filename);
  await copyFile(resolved.resolvedPath, path);
  const copied = await stat(path);

  return {
    inputPath,
    filename,
    label: item.label,
    kind: item.kind,
    path: relative(ROOT, path),
    sizeBytes: copied.size,
  };
}

/** Roots from which agent jobs may copy files into public/. */
function allowedSourceRoots(): string[] {
  const roots = [PUBLIC, ROOT];
  try {
    roots.push(expandHome(readIngestSettings().folder));
  } catch {
    /* ignore */
  }
  // Common Talkie / capture locations on macOS
  roots.push(join(homedir(), 'Library', 'Application Support', 'Talkie'));
  roots.push(join(homedir(), '.talkie'));
  roots.push(join(homedir(), 'Movies', 'Talkie'));
  roots.push(join(homedir(), 'Downloads'));
  return roots;
}

function isUnderRoot(resolvedPath: string, root: string): boolean {
  const r = resolve(root);
  return resolvedPath === r || resolvedPath.startsWith(`${r}${sep}`);
}

function assertAllowedSourcePath(resolvedPath: string, inputPath: string): void {
  if (allowedSourceRoots().some((root) => isUnderRoot(resolvedPath, root))) return;
  throw new IntakeError(
    `Source path is outside allowlisted roots (public/, project, ingest folder, Talkie/Downloads): ${inputPath}`,
    403,
  );
}

async function resolveSourcePath(inputPath: string): Promise<{ resolvedPath: string; publicPath?: string }> {
  if (inputPath.startsWith('file://')) {
    const resolvedPath = await realpath(fileURLToPath(inputPath));
    assertAllowedSourcePath(resolvedPath, inputPath);
    return { resolvedPath };
  }

  const maybePublic = inputPath.replace(/^\/+/, '');
  if (PUBLIC_ROOTS.some((root) => maybePublic === root || maybePublic.startsWith(`${root}/`))) {
    const publicPath = normalizePublicPath(maybePublic);
    return { resolvedPath: join(PUBLIC, publicPath), publicPath };
  }

  const candidate = resolve(ROOT, inputPath);
  let resolvedPath: string;
  try {
    resolvedPath = await realpath(candidate);
  } catch {
    throw new IntakeError(`Source path not found: ${inputPath}`, 400);
  }
  assertAllowedSourcePath(resolvedPath, inputPath);
  return { resolvedPath };
}

function normalizePublicPath(path: string): string {
  const resolved = resolve(PUBLIC, path);
  const rel = relative(PUBLIC, resolved);
  if (rel.startsWith('..') || rel.startsWith('/')) {
    throw new IntakeError(`Public path escapes public/: ${path}`, 403);
  }
  return rel;
}

async function choosePublicDestination(
  requestedFilename: string,
  role: AgentSourceRole,
  sourceSize: number,
  publicDir?: 'demos' | 'tracks' | 'out',
): Promise<{ filename: string; publicPath: string; resolvedPath: string; existing: boolean }> {
  const dirName = publicDir ?? (role === 'audio' ? 'tracks' : 'demos');
  const dir = join(PUBLIC, dirName);
  await mkdir(dir, { recursive: true });

  const filename = sanitizeFilename(requestedFilename);
  const ext = extname(filename);
  const base = filename.slice(0, filename.length - ext.length);

  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? filename : `${base}-${i + 1}${ext}`;
    const resolvedPath = join(dir, candidate);
    try {
      const existing = await stat(resolvedPath);
      if (existing.isFile() && existing.size === sourceSize) {
        return {
          filename: candidate,
          publicPath: `${dirName}/${candidate}`,
          resolvedPath,
          existing: true,
        };
      }
    } catch {
      return {
        filename: candidate,
        publicPath: `${dirName}/${candidate}`,
        resolvedPath,
        existing: false,
      };
    }
  }

  throw new IntakeError(`Could not choose a destination filename for ${requestedFilename}`, 500);
}

function inferRole(path: string): AgentSourceRole {
  const ext = extname(path).toLowerCase();
  if (AUDIO_EXTS.has(ext)) return 'audio';
  if (VIDEO_EXTS.has(ext)) return 'clip';
  return 'clip';
}

function sanitizeFilename(input: string): string {
  const ext = extname(input).toLowerCase();
  const rawBase = basename(input, ext);
  const base = rawBase
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'asset';
  return `${base}${ext || '.json'}`;
}

function normalizeCompositionId(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-\u4E00-\u9FFF]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `agent-job-${Date.now().toString(36)}`;
}

function generateJobId(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

async function rebuildCatalog(): Promise<void> {
  await execFileAsync('bun', ['run', 'scripts/build-catalog.ts'], {
    cwd: ROOT,
    timeout: 60_000,
  });
}

function linksFor(job: JobRecord) {
  return {
    queue: '/queue',
    jobApi: `/api/jobs/${job.jobId}`,
    compositionJobsApi: `/api/compositions/${encodeURIComponent(job.compositionId)}/jobs`,
  };
}
