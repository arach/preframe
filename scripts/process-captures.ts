#!/usr/bin/env bun
/**
 * process-captures.ts — CLI for capture ingest.
 *
 * Uses lib/ingest (same as Assets "Import latest" / POST /api/catalog/import).
 *
 * Examples:
 *   bun run process --from talkie --since 1d
 *   bun run process --from talkie --since 1d --analyze
 *   bun run process --from folder --path ~/Downloads --since 1d --analyze
 *   bun run process /path/to/a.mp4 --analyze
 */

import { basename, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import {
  DEFAULT_INGEST,
  readIngestSettings,
  runImport,
  type IngestSettings,
} from '../lib/ingest';

const PREFRAME_URL = (process.env.PREFRAME_URL || 'http://localhost:3100').replace(/\/$/, '');
const argv = process.argv.slice(2);

function flag(name: string): boolean {
  return argv.includes(`--${name}`);
}
function opt(name: string, fallback?: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) return fallback;
  return v;
}

const help = flag('help') || flag('h');
const from = opt('from') || (flag('from-talkie') ? 'talkie' : undefined);
const since = opt('since');
const folderPath = opt('path') || opt('folder');
const doAnalyze = flag('analyze');
const dryRun = flag('dry-run');
const limit = opt('limit') ? parseInt(opt('limit')!, 10) : undefined;
const useSaved = flag('saved');

const VALUE_FLAGS = new Set(['--from', '--since', '--name', '--limit', '--path', '--folder']);
const positional = argv.filter((a, i) => {
  if (a.startsWith('--')) return false;
  const prev = argv[i - 1];
  if (prev && VALUE_FLAGS.has(prev)) return false;
  return true;
});

if (help || (!from && !useSaved && positional.length === 0)) {
  console.log(`Usage:
  bun run process --from talkie --since 1d [options]
  bun run process --from folder --path ~/Downloads --since 1d [options]
  bun run process --saved [options]          # use Settings → Capture source
  bun run process <video>… [options]

Options:
  --from talkie|folder
  --since <when>     default 1d (or saved)
  --path <dir>       folder source root
  --limit <n>
  --analyze          enqueue analyze jobs after import (needs Preframe up)
  --dry-run
  --saved            load kind/since/folder/analyze from .data/ingest.json
`);
  process.exit(help ? 0 : 1);
}

function expand(p: string): string {
  return resolve(p.replace(/^~\//, `${process.env.HOME}/`));
}

async function main() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  PREFRAME — Process Captures (import)    ║`);
  console.log(`╚══════════════════════════════════════════╝`);

  const saved = readIngestSettings();
  let settings: IngestSettings = { ...DEFAULT_INGEST };

  if (useSaved || (!from && positional.length === 0)) {
    settings = { ...saved };
  } else if (from === 'folder') {
    settings = {
      ...saved,
      kind: 'folder',
      folder: folderPath || saved.folder,
      since: since || saved.since,
      analyze: doAnalyze || saved.analyze,
    };
  } else if (from === 'talkie') {
    settings = {
      ...saved,
      kind: 'talkie',
      since: since || saved.since || '1d',
      analyze: doAnalyze || saved.analyze,
    };
  }

  // Positional files: import those paths only (ad-hoc)
  if (positional.length > 0 && !from) {
    const paths = positional.map(expand).filter(p => {
      if (existsSync(p)) return true;
      console.log(`  skip missing: ${p}`);
      return false;
    });
    if (!paths.length) {
      console.log('No captures found.');
      process.exit(1);
    }
    // Temporary folder-style: copy listed files via a synthetic one-shot
    const { copyFileSync, mkdirSync, existsSync: ex } = await import('node:fs');
    const { join } = await import('node:path');
    const demos = join(process.cwd(), 'public', 'demos');
    mkdirSync(demos, { recursive: true });
    const imported: string[] = [];
    const copied: string[] = [];
    const existed: string[] = [];
    for (const src of paths) {
      const filename = basename(src);
      const dest = join(demos, filename);
      if (ex(dest)) existed.push(filename);
      else {
        copyFileSync(src, dest);
        copied.push(filename);
      }
      imported.push(filename);
      console.log(`  • ${filename}`);
    }
    if (dryRun) {
      console.log('\n--dry-run: stop before copy.');
      return;
    }
    const { rebuildCatalog } = await import('../lib/ingest');
    rebuildCatalog();
    if (doAnalyze) {
      await postAnalyze(imported);
    }
    console.log(`\nDone. copied=${copied.length} existed=${existed.length}`);
    return;
  }

  if (since) settings = { ...settings, since };
  if (folderPath) settings = { ...settings, folder: folderPath };

  console.log(`\nSource: ${settings.kind}${settings.kind === 'folder' ? ` ${settings.folder}` : ''} --since ${settings.since}`);

  const result = runImport({
    settings,
    since: settings.since,
    limit,
    dryRun,
  });

  for (const f of result.found) console.log(`  • ${f}`);
  if (!result.found.length) {
    console.log('No captures found.');
    process.exit(1);
  }
  if (result.dryRun) {
    console.log('\n--dry-run: stop before copy.');
    return;
  }

  console.log(`\n  copied:  ${result.copied.length}`);
  console.log(`  existed: ${result.existed.length}`);
  if (result.notes.length) console.log(`  notes:   ${result.notes.length}`);
  console.log(`  catalog: ${result.catalogOk ? 'ok' : 'failed'}`);

  const wantAnalyze = doAnalyze || (useSaved && settings.analyze);
  if (wantAnalyze && result.imported.length) {
    await postAnalyze(result.imported);
  } else {
    console.log(`\nImport done. Analyze via Assets UI or:`);
    console.log(
      `  curl -X POST ${PREFRAME_URL}/api/assets/analyze -H 'content-type: application/json' -d '{"filter":"needs-analysis"}'`,
    );
  }
  console.log('');
}

async function postAnalyze(filenames: string[]) {
  console.log(`\nEnqueue analyze jobs…`);
  try {
    const res = await fetch(`${PREFRAME_URL}/api/assets/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: filenames, filter: 'all' }),
    });
    const body = await res.json().catch(() => ({}));
    console.log(JSON.stringify(body, null, 2));
    if (!res.ok) console.log(`  hint: is Preframe running at ${PREFRAME_URL}?`);
    else console.log(`  queue: ${PREFRAME_URL}/queue`);
  } catch (e: any) {
    console.log(`  analyze failed: ${e?.message || e}`);
    console.log(`  hint: is Preframe running at ${PREFRAME_URL}?`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
