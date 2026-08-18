/**
 * Guarantees an Action (or stop-file-based) recording ends even if the driver
 * crashes, is interrupted, or exceeds max duration.
 *
 * Semantics:
 * - stop() is idempotent — safe from signals, finally, and watchdog
 * - watchdog is a detached child watching parent PID + max duration
 * - parent exit (any reason except SIGKILL) → watchdog writes stop file
 */

import { writeFile, readFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { constants } from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fileHasContent(path) {
  try {
    await access(path, constants.F_OK);
    const body = await readFile(path, 'utf8');
    return Boolean(body.trim());
  } catch {
    return false;
  }
}

export class RecordingLease {
  #stopFile;
  #finishedFile;
  #recordingChild;
  #maxDurationMs;
  #stopped = false;
  #stopReason = null;
  #watchdog = null;
  #handlers = [];

  constructor({
    stopFile,
    finishedFile,
    recordingChild = null,
    maxDurationMs = 120_000,
  }) {
    this.#stopFile = stopFile;
    this.#finishedFile = finishedFile;
    this.#recordingChild = recordingChild;
    this.#maxDurationMs = maxDurationMs;
  }

  setRecordingChild(child) {
    this.#recordingChild = child;
  }

  async arm() {
    const onStopSignal = (signal) => {
      void this.stop(signal).catch(() => {});
    };

    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
      const handler = () => onStopSignal(signal);
      process.on(signal, handler);
      this.#handlers.push([signal, handler]);
    }

    const onFatal = (label, err) => {
      console.error(`[lease] ${label}:`, err?.message || err);
      void this.stop(label).catch(() => {});
    };
    process.on('uncaughtException', (err) => onFatal('uncaughtException', err));
    process.on('unhandledRejection', (err) => onFatal('unhandledRejection', err));

    this.#watchdog = spawn(
      process.execPath,
      [
        '--eval',
        `
const fs = require('fs');
const parentPid = Number(process.argv[1]);
const stopFile = process.argv[2];
const maxMs = Number(process.argv[3]);
const started = Date.now();

function writeStop(reason) {
  try {
    fs.writeFileSync(stopFile, 'stop:' + reason + '\\n');
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

function tick() {
  if (Date.now() - started >= maxMs) return writeStop('max-duration');
  if (fs.existsSync(stopFile) && fs.readFileSync(stopFile, 'utf8').trim()) return process.exit(0);
  try { process.kill(parentPid, 0); } catch { return writeStop('parent-exit'); }
  setTimeout(tick, 400);
}
tick();
`,
        String(process.pid),
        this.#stopFile,
        String(this.#maxDurationMs),
      ],
      { detached: true, stdio: 'ignore' },
    );
    this.#watchdog.unref();
    console.log(`[lease] armed — watchdog pid ${this.#watchdog.pid}, max ${(this.#maxDurationMs / 1000).toFixed(0)}s`);
  }

  async stop(reason = 'normal') {
    if (this.#stopped) return this.#stopReason;
    this.#stopped = true;
    this.#stopReason = reason;
    try {
      await writeFile(this.#stopFile, `stop:${reason}\n`);
      console.log(`[lease] stop signaled (${reason})`);
    } catch (err) {
      console.error(`[lease] failed to write stop file: ${err.message}`);
    }
    return reason;
  }

  async awaitFinished(timeoutMs = 120_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await fileHasContent(this.#finishedFile)) {
        const body = await readFile(this.#finishedFile, 'utf8');
        if (body.startsWith('error:')) throw new Error(body.trim());
        return body.trim();
      }
      await sleep(100);
    }
    throw new Error(`Timed out waiting for finished marker: ${this.#finishedFile}`);
  }

  disarm() {
    for (const [signal, handler] of this.#handlers) {
      process.off(signal, handler);
    }
    this.#handlers = [];
    if (this.#recordingChild && !this.#recordingChild.killed) {
      this.#recordingChild.kill('SIGTERM');
    }
    if (this.#watchdog && !this.#watchdog.killed) {
      this.#watchdog.kill('SIGTERM');
    }
  }
}