#!/usr/bin/env bun
/**
 * memo-reel.ts — agentic routine entrypoint.
 *
 * The script submits intent. The worker runs the routine: analyze the
 * source (cached storyboard) → plan beat-aligned segments → judge against
 * dead-time + activity gates (up to 4 attempts) → write brief.md → render
 * → rebuild catalog.
 *
 * Usage:
 *   bun run scripts/memo-reel.ts [--source inbox/foo.mp4] \
 *     [--track tracks/japan-trap.mp3] \
 *     [--title "SCOUT · MEMO"] [--subtitle "2026-05-22"] \
 *     [--prompt "30-second highlight of the editor session"] \
 *     [--jobs-url http://localhost:3100/api]
 */

import { join, dirname, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

interface Args {
  source: string;
  track: string;
  title: string;
  subtitle: string;
  tagline: string;
  prompt: string;
  jobsUrl: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const out: Partial<Args> = {};
  for (let i = 0; i < args.length; i += 2) {
    const k = args[i].replace(/^--/, '');
    const v = args[i + 1];
    (out as any)[k === 'jobs-url' ? 'jobsUrl' : k] = v;
  }
  return {
    source: out.source ?? 'inbox/scout-2026-05-22.mp4',
    track: out.track ?? 'tracks/japan-trap.mp3',
    title: out.title ?? 'SCOUT',
    subtitle: out.subtitle ?? `Memo Reel · ${new Date().toISOString().slice(0, 10)}`,
    tagline: out.tagline ?? 'preframe',
    prompt: out.prompt ?? '30-second highlight reel — pick the best moments and form a story arc.',
    jobsUrl: out.jobsUrl ?? 'http://localhost:3100/api',
  };
}

async function postJob(jobsUrl: string, inputs: Record<string, unknown>, prompt: string): Promise<{ jobId: string }> {
  const url = `${jobsUrl}/compositions/MemoReel/jobs`;
  const body = { kind: 'memo-reel', prompt, inputs };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} → ${res.status}: ${await res.text()}`);
  return (await res.json()) as { jobId: string };
}

async function pollJob(jobsUrl: string, jobId: string): Promise<any> {
  const url = `${jobsUrl}/jobs/${jobId}`;
  while (true) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    const job = await res.json();
    const progress = job.progress ?? 0;
    const state = (job.agentState ?? job.status ?? '').toString();
    const msg = (job.lastMessage ?? '').toString().slice(0, 60);
    process.stdout.write(`\r[memo-reel] ${job.status.padEnd(10)} ${String(progress).padStart(3)}% — ${state.padEnd(22)} ${msg.padEnd(60)}`);
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'canceled') {
      process.stdout.write('\n');
      return job;
    }
    await new Promise(r => setTimeout(r, 750));
  }
}

async function main() {
  const args = parseArgs();
  const sourceAbs = join(PUBLIC, args.source);
  if (!existsSync(sourceAbs)) throw new Error(`Source not found at public/${args.source}`);

  const trackAbs = join(PUBLIC, args.track);
  const hasTrack = existsSync(trackAbs);
  if (!hasTrack) console.warn(`[memo-reel] track not found at public/${args.track} — rendering silent`);

  console.log(`[memo-reel] source:   ${args.source}`);
  console.log(`[memo-reel] track:    ${hasTrack ? args.track : '(none)'}`);
  console.log(`[memo-reel] prompt:   ${args.prompt}`);
  console.log(`[memo-reel] jobs:     ${args.jobsUrl}`);

  // No client-side segment planning. The worker runs analyze → judge → render.
  const inputs: Record<string, unknown> = {
    source: args.source,
    beatTrack: hasTrack ? args.track : undefined,
    slateTitle: args.title,
    slateSubtitle: args.subtitle,
    outroTagline: args.tagline,
    preSlateFrames: 60,
    postSlateFrames: 120,
  };

  const { jobId } = await postJob(args.jobsUrl, inputs, args.prompt);
  console.log(`[memo-reel] queued:   ${jobId}`);

  const final = await pollJob(args.jobsUrl, jobId);
  if (final.status !== 'completed') {
    console.error(`[memo-reel] ${final.status}:`, final.error?.message ?? final.lastMessage ?? '(unknown)');
    process.exit(1);
  }

  const outUrl = final.result?.outputUrls?.[0];
  const briefUrl = final.result?.outputUrls?.[1];
  const meta = final.result?.metadata ?? {};
  console.log('');
  console.log(`[memo-reel] ✓ rendered: http://localhost:3100${outUrl}`);
  if (briefUrl) console.log(`[memo-reel]   brief:    http://localhost:3100${briefUrl}`);
  console.log(`[memo-reel]   judge:    score=${meta.judgeScore?.toFixed?.(1) ?? meta.judgeScore} pass=${meta.judgePassed}`);
  console.log(`[memo-reel]   catalog:  http://localhost:3100/`);
}

main().catch((err) => {
  console.error('[memo-reel] failed:', err.message ?? err);
  process.exit(1);
});
