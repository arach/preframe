#!/usr/bin/env bun
/**
 * process-captures.ts — acquisition shim only.
 *
 * Import Talkie (or path) captures into public/demos, optional notes + register.
 * Analysis is NOT done here — use Preframe analyze jobs:
 *   POST /api/assets/analyze  or  Assets UI "Analyze needs-analysis"
 *
 * Examples:
 *   bun run process --from talkie --since 1d
 *   bun run process --from talkie --since 1d --register --analyze
 *   bun run process /path/to/a.mp4 --analyze
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMOS = join(ROOT, "public/demos");
const NOTES = join(ROOT, "public/capture-notes");
const VIDEO_EXTS = new Set([".mp4", ".mov", ".webm", ".mkv", ".m4v"]);
const PREFRAME_URL = (process.env.PREFRAME_URL || "http://localhost:3100").replace(/\/$/, "");

const argv = process.argv.slice(2);

function flag(name: string): boolean {
	return argv.includes(`--${name}`);
}
function opt(name: string, fallback?: string): string | undefined {
	const i = argv.indexOf(`--${name}`);
	if (i === -1) return fallback;
	const v = argv[i + 1];
	if (!v || v.startsWith("--")) return fallback;
	return v;
}

const help = flag("help") || flag("h");
const useTalkie = opt("from") === "talkie" || flag("from-talkie");
const since = opt("since", "1d")!;
const doRegister = flag("register");
const doAnalyze = flag("analyze");
const registerName = opt("name");
const dryRun = flag("dry-run");
const limit = opt("limit") ? parseInt(opt("limit")!, 10) : undefined;
const transcribe = flag("transcribe");

const VALUE_FLAGS = new Set(["--from", "--since", "--name", "--limit"]);
const positional = argv.filter((a, i) => {
	if (a.startsWith("--")) return false;
	const prev = argv[i - 1];
	if (prev && VALUE_FLAGS.has(prev)) return false;
	return true;
});

if (help || (!useTalkie && positional.length === 0)) {
	console.log(`Usage:
  bun run process --from talkie --since 1d [options]
  bun run process <video>… [options]

Acquisition only (copy into public/demos). Analysis is a Preframe queue job.

Options:
  --from talkie     Pull clips via talkie captures
  --since <when>    Talkie date filter (default 1d)
  --limit <n>
  --register        POST agent-jobs mode=register
  --analyze         After import, POST /api/assets/analyze for new files
  --transcribe      With --analyze, request Whisper on analyze jobs
  --name <label>    Register name prefix
  --dry-run
`);
	process.exit(help ? 0 : 1);
}

function expand(p: string): string {
	return resolve(p.replace(/^~\//, `${process.env.HOME}/`));
}

function log(...args: unknown[]) {
	console.log(...args);
}

function talkiePaths(sinceArg: string): string[] {
	const r = spawnSync(
		"talkie",
		["captures", "--kind", "clip", "--since", sinceArg, "--paths"],
		{ encoding: "utf8" },
	);
	if (r.status !== 0) {
		throw new Error(`talkie captures failed:\n${r.stderr || r.stdout}`);
	}
	return (r.stdout || "")
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l && VIDEO_EXTS.has(extname(l).toLowerCase()));
}

function talkieContextSummary(capturePath: string): string | null {
	const r = spawnSync("talkie", ["captures", capturePath, "--context", "--json"], {
		encoding: "utf8",
	});
	if (r.status !== 0) return null;
	try {
		const data = JSON.parse(r.stdout);
		const item = Array.isArray(data) ? data[0] : data;
		const summaryPath =
			item?.visualContext?.summaryPath ||
			item?.visualContext?.summary ||
			item?.context?.summary;
		if (typeof summaryPath === "string" && existsSync(summaryPath)) {
			return readFileSync(summaryPath, "utf8");
		}
	} catch {
		/* ignore */
	}
	return null;
}

function slugify(filename: string): string {
	return filename
		.replace(/\.[^.]+$/, "")
		.toLowerCase()
		.replace(/[\s_]+/g, "-")
		.replace(/[^a-z0-9\-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

async function registerQueueItem(filename: string, dest: string) {
	const compositionId = slugify(filename).slice(0, 48) || `clip-${Date.now()}`;
	const body = {
		mode: "register",
		compositionId,
		name: registerName ? `${registerName} · ${filename}` : filename.replace(/\.[^.]+$/, ""),
		prompt: "Ingested capture — ready for analyze / treatment.",
		sources: [{ path: dest, role: "clip", filename }],
		idempotencyKey: `process:${compositionId}:v1`,
	};
	const res = await fetch(`${PREFRAME_URL}/api/agents/jobs`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const text = await res.text();
	return { ok: res.ok, detail: text.slice(0, 200), compositionId };
}

async function requestAnalyze(filenames: string[]) {
	// Resolve to catalog ids after catalog rebuild — use filenames as ids filter
	const res = await fetch(`${PREFRAME_URL}/api/assets/analyze`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			ids: filenames,
			filter: "all",
			transcribe,
		}),
	});
	const body = await res.json().catch(() => ({}));
	return { ok: res.ok, status: res.status, body };
}

async function main() {
	log(`\n╔══════════════════════════════════════════╗`);
	log(`║  PREFRAME — Process Captures (import)    ║`);
	log(`╚══════════════════════════════════════════╝`);

	let sources: string[] = [];
	if (useTalkie) {
		log(`\nTalkie clips --since ${since}`);
		sources = talkiePaths(since);
	}
	for (const p of positional) {
		const exp = expand(p);
		if (existsSync(exp)) sources.push(exp);
		else log(`  skip missing: ${exp}`);
	}
	sources = [...new Set(sources.map((s) => resolve(s)))];
	if (limit) sources = sources.slice(0, limit);

	if (!sources.length) {
		log("No captures found.");
		process.exit(1);
	}

	for (const s of sources) log(`  • ${basename(s)}`);
	if (dryRun) {
		log("\n--dry-run: stop before copy.");
		return;
	}

	mkdirSync(DEMOS, { recursive: true });
	const imported: string[] = [];

	for (const src of sources) {
		const filename = basename(src);
		const dest = join(DEMOS, filename);
		if (!existsSync(dest)) {
			copyFileSync(src, dest);
			log(`  demos: copied ${filename}`);
		} else {
			log(`  demos: exists ${filename}`);
		}
		imported.push(filename);

		if (useTalkie) {
			const summary = talkieContextSummary(src);
			if (summary) {
				mkdirSync(NOTES, { recursive: true });
				const noteFile = join(NOTES, `${slugify(filename)}.md`);
				writeFileSync(noteFile, summary);
				log(`  notes: public/capture-notes/${basename(noteFile)}`);
			}
		}

		if (doRegister) {
			const r = await registerQueueItem(filename, dest);
			log(r.ok ? `  register: ${r.compositionId}` : `  register FAIL: ${r.detail}`);
		}
	}

	// Light catalog refresh so analyze can resolve demos paths
	log(`\nRebuilding catalog…`);
	const cat = spawnSync("bun", ["run", "scripts/build-catalog.ts"], {
		cwd: ROOT,
		encoding: "utf8",
	});
	if (cat.status !== 0) log(`  catalog failed: ${(cat.stderr || cat.stdout).slice(0, 300)}`);
	else log((cat.stdout || "").trim().split("\n").slice(-4).join("\n"));

	if (doAnalyze) {
		log(`\nEnqueue analyze jobs…`);
		const r = await requestAnalyze(imported);
		log(JSON.stringify(r.body, null, 2));
		if (!r.ok) {
			log(`  hint: is Preframe running at ${PREFRAME_URL}?`);
		} else {
			log(`  queue: ${PREFRAME_URL}/?view=queue`);
		}
	} else {
		log(`\nImport done. Analyze via Assets UI or:`);
		log(`  curl -X POST ${PREFRAME_URL}/api/assets/analyze -H 'content-type: application/json' -d '{"filter":"needs-analysis"}'`);
	}
	log("");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
