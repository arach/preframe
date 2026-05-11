#!/usr/bin/env node
/**
 * render-all-effects.cjs — Batch-render all background-fx effects
 * Usage: node render-all-effects.cjs [output-dir] [--serial]
 *   Runs in parallel by default (4 workers). Use --serial for sequential.
 */

const { chromium } = require('playwright');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const BASE   = path.resolve(__dirname, '..');
const FX_DIR = path.join(BASE, 'background-fx');
const OUT_DIR = path.join(BASE, 'renders');

const args = process.argv.slice(2);
let outDir = OUT_DIR;
let serial = false;
for (const a of args) {
  if (a === '--serial') serial = true;
  else if (a.startsWith('/')) outDir = path.resolve(a);
}

const PARALLEL = 4;
const FPS = 30;
const DURATION = 8;
const WIDTH = 1920;
const HEIGHT = 1080;

// Find all effect directories with an index.html
const effects = fs.readdirSync(FX_DIR)
  .filter(n => fs.statSync(path.join(FX_DIR, n)).isDirectory())
  .filter(n => fs.existsSync(path.join(FX_DIR, n, 'index.html')))
  .sort();

function log(eff, ...a) { console.log(`[${eff}]`, ...a); }
function duSync(p) { return fs.statSync(p).size; }

async function renderOne(eff) {
  const HTML_FILE = path.join(FX_DIR, eff, 'index.html');
  const OUTPUT   = path.join(outDir, `${eff}.mp4`);
  if (fs.existsSync(OUTPUT)) {
    log(eff, 'already rendered, skipping');
    return { eff, status: 'skipped' };
  }

  const tmpDir    = fs.mkdtempSync(path.join(require('os').tmpdir(), `render-${eff}-`));
  const framesDir = path.join(tmpDir, 'frames');
  fs.mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--disable-dev-shm-usage', '--disable-background-timer-throttling',  '--allow-file-access-from-files', '--disable-web-security'],
  });

  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  await page.goto('file://' + HTML_FILE);
  await page.waitForTimeout(800);

  const tlKeys = await page.evaluate(() => Object.keys(window.__timelines || {}));
  if (tlKeys.length === 0) log(eff, 'WARNING: no timeline');

  const totalFrames = DURATION * FPS;
  for (let i = 0; i < totalFrames; i++) {
    await page.evaluate(t => {
      const k = Object.keys(window.__timelines || {})[0];
      if (k) window.__timelines[k].seek(t, false);
    }, i / FPS);
    await page.waitForTimeout(4);
    await page.screenshot({
      path: path.join(framesDir, `frame_${String(i).padStart(5, '0')}.png`),
      type: 'png',
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
    if (i % 30 === 0) log(eff, `  frame ${i}/${totalFrames}`);
  }

  await browser.close();

  execSync(`ffmpeg -y -framerate ${FPS} -i ${path.join(framesDir, 'frame_%05d.png')} -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r ${FPS} "${OUTPUT}"`, { stdio: 'pipe' });
  log(eff, `Done: ${OUTPUT} (${(duSync(OUTPUT)/1024)|0}KB)`);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return { eff, status: 'ok' };
}

async function runParallel() {
  fs.mkdirSync(outDir, { recursive: true });
  log('Starting batch render of', effects.length, 'effects at', PARALLEL, 'parallelism');
  log('Effects:', effects.join(', '));

  const chunks = [];
  for (let i = 0; i < effects.length; i += PARALLEL) {
    chunks.push(effects.slice(i, i + PARALLEL));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(e => renderOne(e).catch(e => ({ eff: e, status: 'error', msg: e.message }))));
  }
}

async function runSerial() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const eff of effects) {
    await renderOne(eff).catch(e => log(eff, 'ERROR:', e.message));
  }
}

(async () => {
  serial ? await runSerial() : await runParallel();
  console.log('All renders complete. Output:', outDir);
  process.exit(0);
})();
