#!/usr/bin/env node
/**
 * render-effect.cjs — Headless render one background-fx effect via Playwright + Chrome
 * Usage: node render-effect.cjs <effect-name> [output-dir]
 *   e.g.: node render-effect.cjs chromatic-flow /tmp/renders
 *
 * Renders at 1920×1080, 30fps, 8 seconds per effect.
 * Uses file:// URL so relative asset paths resolve correctly.
 */

const { chromium } = require('playwright');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const BASE   = path.resolve(__dirname, '..');
const FX_DIR = path.join(BASE, 'background-fx');
const OUT_DIR = path.join(BASE, 'renders');

const args = process.argv.slice(2);
let effName = null, outDir = OUT_DIR;
if (args[0] && !args[0].startsWith('/')) {
  effName = args[0];
  outDir  = args[1] || OUT_DIR;
} else if (args[0]) {
  outDir = path.resolve(args[0]);
  if (args[1]) effName = args[1];
}

if (!effName) {
  console.error('Usage: node render-effect.cjs <effect-name> [output-dir]');
  process.exit(1);
}

const HTML_FILE = path.join(FX_DIR, effName, 'index.html');
const OUTPUT   = path.join(outDir, `${effName}.mp4`);
const FPS      = 30;
const DURATION = 8;
const WIDTH    = 1920;
const HEIGHT   = 1080;

function log(...a) { console.log(`[${effName}]`, ...a); }

async function main() {
  if (!fs.existsSync(HTML_FILE)) {
    const alt = path.join(BASE, 'effects', effName, 'index.html');
    if (fs.existsSync(alt)) {
      log('Effect found in effects/, not background-fx/');
      process.exit(1);
    }
    log('HTML file not found:', HTML_FILE);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const tmpDir    = fs.mkdtempSync(path.join(require('os').tmpdir(), `render-${effName}-`));
  const framesDir = path.join(tmpDir, 'frames');
  fs.mkdirSync(framesDir, { recursive: true });

  log(`Starting → ${OUTPUT}`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=swiftshader',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--allow-file-access-from-files',
      '--disable-web-security',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Use file:// URL so relative paths (../../assets/sample.mp4) resolve correctly
  await page.goto('file://' + HTML_FILE);

  // Wait for GSAP timelines to init
  await page.waitForTimeout(800);

  const tlKeys = await page.evaluate(() => Object.keys(window.__timelines || {}));
  if (tlKeys.length === 0) {
    log('WARNING: No __timelines found — may render blank');
  } else {
    log(`Found timeline: ${tlKeys[0]}`);
  }

  const totalFrames = DURATION * FPS;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / FPS;
    await page.evaluate((time) => {
      const keys = Object.keys(window.__timelines || {});
      if (keys.length > 0) window.__timelines[keys[0]].seek(time, false);
    }, t);

    // Tiny yield to let rendering flush
    await page.waitForTimeout(4);

    await page.screenshot({
      path: path.join(framesDir, `frame_${String(i).padStart(5, '0')}.png`),
      type: 'png',
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });

    if (i % 30 === 0) log(`  frame ${i}/${totalFrames} (${(i/totalFrames*100)|0}%)`);
  }

  await browser.close();
  log('Encoding...');

  execSync([
    'ffmpeg', '-y',
    '-framerate', String(FPS),
    '-i', path.join(framesDir, 'frame_%05d.png'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-r', String(FPS),
    OUTPUT,
  ].join(' '), { stdio: 'pipe' });

  log(`Done: ${OUTPUT} (${(duSync(OUTPUT)/1024)|0}KB)`);

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function duSync(path) {
  return require('fs').statSync(path).size;
}

main().catch((e) => {
  console.error(`[${effName}] Fatal:`, e.message);
  process.exit(1);
});
