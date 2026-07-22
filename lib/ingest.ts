/**
 * Capture ingest settings + import helpers.
 *
 * Sources are user-defined (Talkie CLI, a folder like Downloads, etc.).
 * The Assets "Import latest" button and `bun run process` share this logic.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';

const CONFIG_PATH = join(process.cwd(), '.data', 'ingest.json');
const DEMOS = join(process.cwd(), 'public', 'demos');
const NOTES = join(process.cwd(), 'public', 'capture-notes');

export const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.mkv', '.m4v']);

export type IngestSourceKind = 'talkie' | 'folder';

export interface IngestSettings {
  /** Capture source kind */
  kind: IngestSourceKind;
  /** Relative window for Talkie / folder mtime filter (e.g. 1d, 7d, 2026-07-10) */
  since: string;
  /** Absolute or ~/ path when kind=folder */
  folder: string;
  /** After import, POST analyze for new files */
  analyze: boolean;
  /** Optional agent-jobs register (mostly for queue visibility of raw clips) */
  register: boolean;
}

export const DEFAULT_INGEST: IngestSettings = {
  kind: 'talkie',
  since: '1d',
  folder: join(homedir(), 'Downloads'),
  analyze: true,
  register: false,
};

export function readIngestSettings(): IngestSettings {
  try {
    if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_INGEST };
    const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as Partial<IngestSettings>;
    return {
      kind: raw.kind === 'folder' ? 'folder' : 'talkie',
      since: typeof raw.since === 'string' && raw.since ? raw.since : DEFAULT_INGEST.since,
      folder:
        typeof raw.folder === 'string' && raw.folder
          ? raw.folder
          : DEFAULT_INGEST.folder,
      analyze: raw.analyze !== false,
      register: !!raw.register,
    };
  } catch {
    return { ...DEFAULT_INGEST };
  }
}

export function writeIngestSettings(next: IngestSettings): IngestSettings {
  mkdirSync(join(process.cwd(), '.data'), { recursive: true });
  const normalized: IngestSettings = {
    kind: next.kind === 'folder' ? 'folder' : 'talkie',
    since: next.since?.trim() || DEFAULT_INGEST.since,
    folder: next.folder?.trim() || DEFAULT_INGEST.folder,
    analyze: next.analyze !== false,
    register: !!next.register,
  };
  writeFileSync(CONFIG_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

export function expandHome(p: string): string {
  if (p.startsWith('~/')) return join(homedir(), p.slice(2));
  if (p === '~') return homedir();
  return resolve(p);
}

/** Parse 1d / 7h / 30m / YYYY-MM-DD into a Date cutoff (or null for calendar day start). */
export function sinceCutoff(since: string): { after: Date } | { day: string } | null {
  const s = since.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return { day: s };
  }
  const m = s.match(/^(\d+)([dhm])$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const ms =
    unit === 'd' ? n * 86_400_000 : unit === 'h' ? n * 3_600_000 : n * 60_000;
  return { after: new Date(Date.now() - ms) };
}

function fileMatchesSince(filePath: string, since: string): boolean {
  const cut = sinceCutoff(since);
  if (!cut) return true;
  try {
    const st = statSync(filePath);
    const t = st.mtime;
    if ('day' in cut) {
      const day = t.toISOString().slice(0, 10);
      // also accept local date string from filename if needed — mtime UTC day is OK
      const local = new Date(t.getTime() - t.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
      return day === cut.day || local === cut.day;
    }
    return t.getTime() >= cut.after.getTime();
  } catch {
    return false;
  }
}

export function talkiePaths(since: string, limit?: number): string[] {
  const args = ['captures', '--kind', 'clip', '--since', since, '--paths'];
  if (limit) args.push('--limit', String(limit));
  const r = spawnSync('talkie', args, { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`talkie captures failed:\n${(r.stderr || r.stdout || '').slice(0, 500)}`);
  }
  return (r.stdout || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && VIDEO_EXTS.has(extname(l).toLowerCase()));
}

export function folderPaths(folder: string, since: string, limit?: number): string[] {
  const dir = expandHome(folder);
  if (!existsSync(dir)) {
    throw new Error(`Folder not found: ${dir}`);
  }
  const st = statSync(dir);
  if (!st.isDirectory()) {
    throw new Error(`Not a directory: ${dir}`);
  }

  const entries = readdirSync(dir);
  const files: { path: string; mtime: number }[] = [];
  for (const name of entries) {
    const full = join(dir, name);
    const ext = extname(name).toLowerCase();
    if (!VIDEO_EXTS.has(ext)) continue;
    try {
      const s = statSync(full);
      if (!s.isFile()) continue;
      if (!fileMatchesSince(full, since)) continue;
      files.push({ path: full, mtime: s.mtimeMs });
    } catch {
      /* skip */
    }
  }
  files.sort((a, b) => b.mtime - a.mtime);
  const paths = files.map(f => f.path);
  return limit ? paths.slice(0, limit) : paths;
}

export function resolveSourcePaths(
  settings: IngestSettings,
  opts?: { since?: string; limit?: number },
): { paths: string[]; label: string } {
  const since = opts?.since ?? settings.since;
  if (settings.kind === 'folder') {
    const paths = folderPaths(settings.folder, since, opts?.limit);
    return {
      paths,
      label: `folder ${expandHome(settings.folder)} --since ${since}`,
    };
  }
  const paths = talkiePaths(since, opts?.limit);
  return { paths, label: `talkie clips --since ${since}` };
}

function slugify(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function talkieContextSummary(capturePath: string): string | null {
  const r = spawnSync('talkie', ['captures', capturePath, '--context', '--json'], {
    encoding: 'utf8',
  });
  if (r.status !== 0) return null;
  try {
    const data = JSON.parse(r.stdout);
    const item = Array.isArray(data) ? data[0] : data;
    const summaryPath =
      item?.visualContext?.summaryPath ||
      item?.visualContext?.summary ||
      item?.context?.summary;
    if (typeof summaryPath === 'string' && existsSync(summaryPath)) {
      return readFileSync(summaryPath, 'utf8');
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function rebuildCatalog(): { ok: boolean; detail: string } {
  const cat = spawnSync('bun', ['run', 'scripts/build-catalog.ts'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  const detail = ((cat.stdout || '') + (cat.stderr || '')).trim().slice(-400);
  return { ok: cat.status === 0, detail };
}

export interface ImportResult {
  source: string;
  dryRun: boolean;
  found: string[];
  /** Filenames under public/demos (copied or already present) */
  imported: string[];
  copied: string[];
  existed: string[];
  notes: string[];
  catalogOk: boolean;
}

export function runImport(opts: {
  settings?: IngestSettings;
  since?: string;
  limit?: number;
  dryRun?: boolean;
  fromTalkieNotes?: boolean;
}): ImportResult {
  const settings = opts.settings ?? readIngestSettings();
  const { paths, label } = resolveSourcePaths(settings, {
    since: opts.since,
    limit: opts.limit,
  });
  const unique = [...new Set(paths.map(p => resolve(p)))];
  const found = unique.map(p => basename(p));

  if (opts.dryRun) {
    return {
      source: label,
      dryRun: true,
      found,
      imported: [],
      copied: [],
      existed: [],
      notes: [],
      catalogOk: true,
    };
  }

  mkdirSync(DEMOS, { recursive: true });
  const copied: string[] = [];
  const existed: string[] = [];
  const notes: string[] = [];
  const imported: string[] = [];

  for (const src of unique) {
    const filename = basename(src);
    const dest = join(DEMOS, filename);
    if (existsSync(dest)) {
      existed.push(filename);
    } else {
      copyFileSync(src, dest);
      copied.push(filename);
    }
    imported.push(filename);

    if (settings.kind === 'talkie' || opts.fromTalkieNotes) {
      const summary = talkieContextSummary(src);
      if (summary) {
        mkdirSync(NOTES, { recursive: true });
        const noteFile = join(NOTES, `${slugify(filename)}.md`);
        writeFileSync(noteFile, summary);
        notes.push(basename(noteFile));
      }
    }
  }

  const catalog = rebuildCatalog();

  return {
    source: label,
    dryRun: false,
    found,
    imported,
    copied,
    existed,
    notes,
    catalogOk: catalog.ok,
  };
}

/** Short UI label for the current source. */
export function ingestSourceLabel(s: IngestSettings = readIngestSettings()): string {
  if (s.kind === 'folder') {
    const name = basename(expandHome(s.folder)) || s.folder;
    return `${name} · ${s.since}`;
  }
  return `Talkie · ${s.since}`;
}
