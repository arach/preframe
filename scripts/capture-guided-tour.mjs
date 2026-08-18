#!/usr/bin/env bun
/**
 * Fresh guided tour capture for Preframe landing media.
 *
 * Playwright walks the catalog through the tour; recording is CDP screencast by
 * default (viewport-only). Action app-window/region modes are also available.
 * same six beats as docs/index.html story mode (see LANDING_BEATS below).
 *
 * Usage:
 *   bun run dev          # catalog on :3100
 *   bun run capture:tour
 *
 *   ACTION_ROOT=~/dev/action PREFRAME_BASE=http://localhost:3100 bun scripts/capture-guided-tour.mjs
 *
 * Env:
 *   ACTION_ROOT          path to action repo (default: ../action from cwd)
 *   PREFRAME_BASE        catalog dev URL (default: http://localhost:3100)
 *   TOUR_EXAMPLE         scout (default) or talkie — sample video, prompts, project id
 *   PREFRAME_VIDEO       override project id for detail/review/code beats
 *   CHROME_BUNDLE_ID     default com.google.Chrome
 *   OUTPUT_DIR           artifact dir (default: docs/media/app/capture-<timestamp>)
 *   RECORD_FPS           default 15
 *   RECORD_SCALE         default 0.75
 *   RECORD_MAX_MS        hard stop + watchdog (default 120000)
 *   TOUR_HOLD_SCALE      multiply all hold durations (default 1)
 *   CAPTURE_MODE         cdp (default), app-window, or region
 *                        cdp — Playwright page.screencast (CDP Page.startScreencast),
 *                              viewport only, no Action / no desktop bleed
 *                        app-window — Action ScreenCaptureKit window filter
 *                        region — Action screen rect
 *   SCREENCAST_QUALITY   JPEG quality for cdp mode (default 80)
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { RecordingLease } from './recording-lease.mjs';
import {
  mkdir,
  writeFile,
  copyFile,
  access,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { resolveTourExample } from '../src/projects/guided-tour/profiles.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const example = resolveTourExample();
const ACTION_ROOT = path.resolve(process.env.ACTION_ROOT ?? path.join(ROOT, '../action'));
const RUN_HOST = path.join(ACTION_ROOT, 'native/engine/scripts/run-app-host.sh');
const PREFRAME_BASE = process.env.PREFRAME_BASE ?? 'http://localhost:3100';
const CHROME_BUNDLE_ID = process.env.CHROME_BUNDLE_ID ?? 'com.google.Chrome';
const FPS = process.env.RECORD_FPS ?? '15';
const SCALE = process.env.RECORD_SCALE ?? '0.75';
const RECORD_MAX_MS = Number(process.env.RECORD_MAX_MS ?? '120000');
const HOLD_SCALE = Number(process.env.TOUR_HOLD_SCALE ?? '1');
const CAPTURE_MODE = process.env.CAPTURE_MODE ?? 'cdp';
const SCREENCAST_QUALITY = Number(process.env.SCREENCAST_QUALITY ?? '80');
const SCREENCAST_SIZE = { width: 1440, height: 900 };
const RECORD_WARMUP_SEC = 1.2;
const USES_ACTION = CAPTURE_MODE === 'app-window' || CAPTURE_MODE === 'region';
const SAMPLE_VIDEO = path.join(ROOT, example.sampleVideo);
const PROJECT_VIDEO = process.env.PREFRAME_VIDEO ?? example.projectVideo;
const LANDING_BEATS = example.landingBeats;
const INGEST_PROMPT = example.ingestPrompt;
const REVIEW_NOTE = example.reviewNote;

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT_DIR = path.resolve(process.env.OUTPUT_DIR ?? path.join(ROOT, `docs/media/app/capture-${stamp}`));
const MOV = path.join(OUT_DIR, 'preframe-guided-tour.mov');
const WEBM = path.join(OUT_DIR, 'preframe-guided-tour.webm');
const STOP_FILE = `${MOV}.stop`;
const FINISHED_FILE = `${MOV}.finished`;
const DEBUG_LOG = `${MOV}.log`;
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const holdMs = (ms) => Math.round(ms * HOLD_SCALE);

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => { stdout += d; });
    child.stderr?.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${stderr || stdout}`));
    });
  });
}

function projectUrl(extraParams = '') {
  const q = extraParams ? (extraParams.startsWith('&') ? extraParams : `&${extraParams}`) : '';
  return `${PREFRAME_BASE}/?video=${PROJECT_VIDEO}&project=${PROJECT_VIDEO}${q}`;
}

/** Chrome window bounds via Action (ScreenCaptureKit-aligned, no padding). */
async function actionChromeRegion() {
  const { stdout } = await run(RUN_HOST, ['get-window-frame', '--bundle-id', CHROME_BUNDLE_ID]);
  const response = JSON.parse(stdout);
  const frame = response.frame;
  if (!frame || ![frame.x, frame.y, frame.width, frame.height].every(Number.isFinite)) {
    throw new Error(`Chrome frame missing from get-window-frame: ${stdout.trim()}`);
  }
  return {
    x: Math.floor(frame.x),
    y: Math.floor(frame.y),
    width: Math.ceil(frame.width),
    height: Math.ceil(frame.height),
    source: 'action-get-window-frame',
    raw: frame,
  };
}

/** Frontmost Chrome window via AppleScript — fallback when Action frame lookup fails. */
async function frontChromeRegion(pad = 0) {
  const script = `
tell application id "${CHROME_BUNDLE_ID}" to activate
delay 0.45
tell application id "${CHROME_BUNDLE_ID}"
  set winBounds to bounds of front window
end tell
set winLeft to item 1 of winBounds
set winTop to item 2 of winBounds
set winRight to item 3 of winBounds
set winBottom to item 4 of winBounds
return (winLeft as text) & "," & (winTop as text) & "," & ((winRight - winLeft) as text) & "," & ((winBottom - winTop) as text)
`;
  const { stdout } = await run('osascript', ['-e', script]);
  const [x, y, w, h] = stdout.trim().split(',').map((v) => Number(v.trim()));
  if (![x, y, w, h].every(Number.isFinite)) {
    throw new Error(`Could not read Chrome front window bounds: ${stdout.trim()}`);
  }
  return {
    x: Math.max(0, Math.floor(x - pad)),
    y: Math.max(0, Math.floor(y - pad)),
    width: Math.ceil(w + pad * 2),
    height: Math.ceil(h + pad * 2),
    source: 'chrome-front-window-applescript',
    raw: { x, y, width: w, height: h },
  };
}

function startAppWindowRecording(bundleId) {
  const args = [
    'record-app-window',
    '--bundle-id', bundleId,
    '--output', MOV,
    '--stop-file', STOP_FILE,
    '--finished-file', FINISHED_FILE,
    '--debug-log', DEBUG_LOG,
  ];
  const child = spawn(RUN_HOST, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let boot = '';
  child.stdout?.on('data', (d) => { boot += d; });
  child.stderr?.on('data', (d) => { boot += d; });
  return { child, boot: () => boot };
}

function startRegionRecording(region) {
  const args = [
    'record-region',
    '--x', String(region.x),
    '--y', String(region.y),
    '--width', String(region.width),
    '--height', String(region.height),
    '--fps', FPS,
    '--scale', SCALE,
    '--output', MOV,
    '--stop-file', STOP_FILE,
    '--finished-file', FINISHED_FILE,
    '--debug-log', DEBUG_LOG,
  ];
  const child = spawn(RUN_HOST, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let boot = '';
  child.stdout?.on('data', (d) => { boot += d; });
  child.stderr?.on('data', (d) => { boot += d; });
  return { child, boot: () => boot };
}

async function ensurePlaywrightFfmpeg() {
  const cache = path.join(
    process.env.HOME ?? '',
    'Library/Caches/ms-playwright/ffmpeg-1011/ffmpeg-mac',
  );
  if (await exists(cache)) return;
  console.log('[setup] installing Playwright ffmpeg for CDP screencast…');
  await run('bunx', ['playwright', 'install', 'ffmpeg']);
}

async function transcodeWebmToMov(webm, mov) {
  await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', webm,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    mov,
  ]);
}

async function extractFrame(video, outPng, atSeconds) {
  await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(Math.max(0, atSeconds)),
    '-i', video,
    '-frames:v', '1',
    outPng,
  ]);
}

function createTourDriver() {
  const markers = [];
  const tourStartedAt = Date.now();

  return {
    markers,
    async hold(ms, label, still) {
      console.log(`[drive] ${label}`);
      await sleep(holdMs(ms));
      if (still) {
        const atSec = (Date.now() - tourStartedAt) / 1000;
        markers.push({ still, label, atSec });
        console.log(`[drive]   ↳ still ${still} @ ${atSec.toFixed(1)}s (tour clock)`);
      }
    },
  };
}

async function attachSource(page) {
  const fileInput = page.locator('input[type=file]');
  if (!(await fileInput.count())) return false;

  if (await exists(SAMPLE_VIDEO)) {
    await fileInput.setInputFiles(SAMPLE_VIDEO);
  } else {
    await fileInput.setInputFiles({
      name: 'product-raw-capture.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('placeholder'),
    });
  }
  return true;
}

async function openCodePanel(page) {
  const code = page.getByRole('button', { name: /^Code$/ });
  if (!(await code.count())) return false;
  await code.first().click();
  await sleep(holdMs(500));
  return true;
}

/** Start inline review on VideoDetail (ReviewContext), not the ?review=1 modal. */
async function startReviewNote(page) {
  const noteBtn = page.getByRole('button', { name: /^Note$/ });
  const inspectorNote = page.getByRole('button', { name: /Note at/i });

  if (await noteBtn.count()) {
    await noteBtn.first().click();
  } else if (await inspectorNote.count()) {
    await inspectorNote.first().click();
  } else {
    return false;
  }

  await page.getByText('Drag to mark an area').waitFor({ state: 'visible', timeout: 8000 });
  await sleep(holdMs(350));
  return true;
}

/** Wait for project detail video to decode a real frame before review beats. */
async function waitForProjectVideoReady(page) {
  const noteBtn = page.getByRole('button', { name: /^Note$/ });
  await noteBtn.waitFor({ state: 'visible', timeout: 15_000 });

  try {
    await page.waitForFunction(
      () => {
        const v = document.querySelector('video');
        return Boolean(v && v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0);
      },
      { timeout: 15_000 },
    );
  } catch {
    console.warn('[drive] video slow to load — review may show an empty stage');
    return false;
  }

  await page.evaluate(async () => {
    const v = document.querySelector('video');
    if (!v) return;
    v.currentTime = Math.min(2, (v.duration || 10) * 0.08);
    try {
      await v.play();
      await new Promise((r) => setTimeout(r, 450));
      v.pause();
    } catch {
      /* autoplay policy — decoded frame may still be visible */
    }
  });
  await sleep(holdMs(700));
  return true;
}

/** Drag a feedback rect on VideoDetail's composing canvas. */
async function drawReviewRect(page) {
  const canvas = page.locator('.cursor-crosshair').first();
  if (!(await canvas.count())) return false;

  const box = await canvas.boundingBox();
  if (!box || box.width < 40 || box.height < 40) return false;

  const x0 = box.x + box.width * 0.28;
  const y0 = box.y + box.height * 0.22;
  const x1 = box.x + box.width * 0.62;
  const y1 = box.y + box.height * 0.52;

  await page.mouse.move(x0, y0);
  await page.mouse.down();
  await page.mouse.move(x1, y1, { steps: 14 });
  await page.mouse.up();
  return true;
}

/**
 * Chronological tour for the recording. Still names match LANDING_BEATS /
 * docs/index.html story mode.
 */
async function driveTour(page) {
  const tour = createTourDriver();

  // Beat 2 — ingest: drop zone → attach → objective prompt
  await page.goto(`${PREFRAME_BASE}/new`, { waitUntil: 'networkidle' });
  await tour.hold(1400, 'beat 2 · new composition — empty drop zone');

  await attachSource(page);
  await tour.hold(1000, 'beat 2 · source attached');

  const instructions = page.locator('textarea').first();
  if (await instructions.count()) {
    await instructions.click();
    await instructions.fill(INGEST_PROMPT);
  }
  await tour.hold(3200, 'beat 2 · objective prompt filled', 'studio-new.png');

  // Beat 3 — catalog grid (montage prompt lives in the project)
  await page.goto(`${PREFRAME_BASE}/`, { waitUntil: 'networkidle' });
  await tour.hold(2800, 'beat 3 · catalog grid', 'studio-grid.png');

  // Beat 1 — code panel (source is the composition)
  await page.goto(projectUrl(), { waitUntil: 'networkidle' });
  await tour.hold(1200, 'beat 1 · project detail');
  if (await openCodePanel(page)) {
    await tour.hold(3200, 'beat 1 · code panel open', 'studio-code.png');
  } else {
    console.warn('[drive] Code button not found — studio-code still may be wrong');
  }

  // Beats 4–5 — inline review on project detail (VideoDetail + ReviewContext)
  await page.goto(projectUrl(), { waitUntil: 'networkidle' });
  await waitForProjectVideoReady(page);
  await tour.hold(1800, 'beat 4 · project detail — video frame visible');

  if ((await startReviewNote(page)) && (await drawReviewRect(page))) {
    await tour.hold(2400, 'beat 4 · feedback box drawn', 'reviewer-clean.png');

    const composeField = page.getByPlaceholder('What needs to change?');
    if (await composeField.count()) {
      await composeField.click();
      await composeField.fill(REVIEW_NOTE);
    }
    await tour.hold(3000, 'beat 5 · review note typed', 'reviewer-annotated.png');
  } else {
    console.warn('[drive] Review flow failed — skipping reviewer stills');
  }

  // Beat 6 — queue / export
  await page.goto(`${PREFRAME_BASE}/queue`, { waitUntil: 'networkidle' });
  await tour.hold(2800, 'beat 6 · render queue', 'studio-queue.png');

  return tour.markers;
}

async function main() {
  if (USES_ACTION && !(await exists(RUN_HOST))) {
    throw new Error(`Action run-app-host not found at ${RUN_HOST}. Set ACTION_ROOT.`);
  }
  if (CAPTURE_MODE === 'cdp') {
    await ensurePlaywrightFfmpeg();
  } else if (!USES_ACTION) {
    throw new Error(`Invalid CAPTURE_MODE: ${CAPTURE_MODE} (expected cdp, app-window, or region)`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const scratch = CAPTURE_MODE === 'cdp'
    ? [WEBM, MOV]
    : [MOV, STOP_FILE, FINISHED_FILE, DEBUG_LOG];
  await run('rm', ['-f', ...scratch]);

  console.log(`[setup] output: ${OUT_DIR}`);
  console.log(`[setup] example: ${example.id} (${example.sceneLabel})`);
  console.log(`[setup] sample: ${path.relative(ROOT, SAMPLE_VIDEO)}`);
  console.log(`[setup] project: ${PROJECT_VIDEO}`);
  console.log(`[setup] catalog: ${PREFRAME_BASE}`);
  if (USES_ACTION) console.log(`[setup] action: ${ACTION_ROOT}`);
  console.log(`[setup] beats: ${LANDING_BEATS.map((b) => b.still).join(', ')}`);
  console.log(`[setup] capture: ${CAPTURE_MODE}`);

  const chromeProfile = path.join(OUT_DIR, 'chrome-profile');
  await mkdir(chromeProfile, { recursive: true });

  const context = await chromium.launchPersistentContext(chromeProfile, {
    channel: 'chrome',
    headless: false,
    ignoreDefaultArgs: ['--enable-automation'],
    viewport: SCREENCAST_SIZE,
    deviceScaleFactor: 1,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--window-size=1440,900',
      '--window-position=200,120',
    ],
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  const page = context.pages()[0] ?? await context.newPage();

  await page.goto(`${PREFRAME_BASE}/new`, { waitUntil: 'domcontentloaded' });
  await page.bringToFront();
  await sleep(600);

  const startedAt = Date.now();
  let stopReason = 'normal';
  let tourMarkers = [];
  let captureTarget = { mode: CAPTURE_MODE };

  if (CAPTURE_MODE === 'cdp') {
    console.log(`[record] cdp screencast ${SCREENCAST_SIZE.width}x${SCREENCAST_SIZE.height} q=${SCREENCAST_QUALITY}`);
    console.log('[record] starting Playwright CDP screencast…');
    captureTarget = {
      mode: 'cdp',
      webm: WEBM,
      size: SCREENCAST_SIZE,
      quality: SCREENCAST_QUALITY,
    };

    try {
      await page.screencast.start({
        path: WEBM,
        size: SCREENCAST_SIZE,
        quality: SCREENCAST_QUALITY,
      });
      await sleep(holdMs(1200));
      tourMarkers = await driveTour(page);
      await page.screencast.stop();
      await transcodeWebmToMov(WEBM, MOV);
    } finally {
      await context.close();
    }
    stopReason = 'tour-complete';
  } else {
    if (CAPTURE_MODE === 'app-window') {
      captureTarget = { mode: 'app-window', bundleId: CHROME_BUNDLE_ID };
      console.log(`[record] app-window bundle=${CHROME_BUNDLE_ID}`);
      console.log('[record] starting Action app-window capture…');
    } else {
      const region = await actionChromeRegion().catch(() => frontChromeRegion());
      captureTarget = { mode: 'region', region };
      console.log(`[record] region ${region.x},${region.y} ${region.width}x${region.height} (${region.source})`);
      console.log('[record] starting Action region capture…');
    }

    const lease = new RecordingLease({
      stopFile: STOP_FILE,
      finishedFile: FINISHED_FILE,
      maxDurationMs: RECORD_MAX_MS,
    });
    await lease.arm();

    try {
      const recording = captureTarget.mode === 'app-window'
        ? startAppWindowRecording(captureTarget.bundleId)
        : startRegionRecording(captureTarget.region);
      lease.setRecordingChild(recording.child);
      await sleep(holdMs(1200));

      try {
        tourMarkers = await driveTour(page);
      } finally {
        await context.close();
      }

      stopReason = await lease.stop('tour-complete');
      await lease.awaitFinished();
    } catch (err) {
      await lease.stop(err?.message?.includes('Timed out') ? 'timeout' : 'error');
      try { await lease.awaitFinished(30_000); } catch { /* watchdog may still land */ }
      throw err;
    } finally {
      lease.disarm();
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[done] recording ${elapsed}s (${stopReason}) → ${MOV}`);

  const stills = tourMarkers.map(({ still, atSec, label }) => ({
    name: still.replace(/\.png$/, ''),
    at: RECORD_WARMUP_SEC + atSec + 0.35,
    label,
  }));

  for (const { name, at, label } of stills) {
    const out = path.join(OUT_DIR, `${name}.png`);
    try {
      await extractFrame(MOV, out, at);
      console.log(`[frame] ${name}.png @ ${at.toFixed(1)}s (${label})`);
    } catch (err) {
      console.warn(`[frame] skip ${name}: ${err.message}`);
    }
  }

  const publishDir = path.join(ROOT, 'docs/media/app');
  await copyFile(MOV, path.join(publishDir, 'preframe-guided-tour.mov'));
  for (const { name } of stills) {
    const src = path.join(OUT_DIR, `${name}.png`);
    if (await exists(src)) {
      await copyFile(src, path.join(publishDir, `${name}.png`));
    }
  }

  const manifest = {
    capturedAt: new Date().toISOString(),
    tool: 'action',
    method: captureTarget.mode === 'cdp'
      ? 'cdp-screencast'
      : captureTarget.mode === 'app-window'
        ? 'record-app-window'
        : 'record-region',
    captureMode: CAPTURE_MODE,
    captureTarget,
    screencastQuality: CAPTURE_MODE === 'cdp' ? SCREENCAST_QUALITY : undefined,
    webm: CAPTURE_MODE === 'cdp' ? WEBM : undefined,
    bundleId: CHROME_BUNDLE_ID,
    driver: 'playwright',
    base: PREFRAME_BASE,
    tourExample: example.id,
    projectVideo: PROJECT_VIDEO,
    sampleVideo: path.relative(ROOT, SAMPLE_VIDEO),
    mov: MOV,
    durationDriveMs: Date.now() - startedAt,
    stopReason,
    recordMaxMs: RECORD_MAX_MS,
    recordWarmupSec: RECORD_WARMUP_SEC,
    holdScale: HOLD_SCALE,
    landingBeats: LANDING_BEATS,
    tourMarkers,
    stills,
    lease: 'recording-lease.mjs — stop on signal, parent exit, or max duration',
  };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[done] manifest → ${MANIFEST}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});