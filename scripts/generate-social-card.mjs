/**
 * Renders the Open Graph share image to public/social-card.png.
 *
 * The card is composed here as HTML so it can use the project's real fonts
 * and design tokens rather than an approximation, then rasterised by driving
 * a headless Chrome over the DevTools Protocol. That keeps one source of
 * truth for the brand and avoids adding an image or font library to the
 * dependency tree for an asset that changes about once a year.
 *
 * The PNG is committed, so a normal build and deploy never needs Chrome.
 * Re-run this only when the card design changes:
 *
 *   node scripts/generate-social-card.mjs
 *
 * Requires Google Chrome on PATH or at the default Windows location.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'social-card.png');
const WIDTH = 1200;
const HEIGHT = 630;

const fontUrl = (family, file) =>
  pathToFileURL(join(ROOT, 'node_modules', '@fontsource', family, 'files', file)).href;

/* Values mirror src/styles/tokens.css. */
const TOKENS = {
  paper: '#F5F2EC',
  surface: '#FFFFFF',
  ink: '#16150F',
  ink2: '#4A4639',
  ink3: '#6B6555',
  line: '#DCD6C9',
  accent: '#1F5E4E',
  protein: '#1F5E4E',
  carb: '#9A5B00',
  fat: '#9B3B32',
};

const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @font-face { font-family: 'Plex'; font-weight: 400; src: url('${fontUrl('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'Plex'; font-weight: 600; src: url('${fontUrl('ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'PlexMono'; font-weight: 400; src: url('${fontUrl('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2')}') format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${WIDTH}px; height: ${HEIGHT}px; background: ${TOKENS.paper};
         font-family: 'Plex', sans-serif; color: ${TOKENS.ink}; overflow: hidden; }
  .card { height: 100%; display: flex; flex-direction: column; justify-content: space-between;
          padding: 72px 80px; }
  .brand { display: flex; align-items: center; gap: 20px; }
  .word { font-size: 44px; font-weight: 600; letter-spacing: -0.012em; }
  .word .accent { color: ${TOKENS.accent}; }
  h1 { font-size: 68px; font-weight: 600; letter-spacing: -0.012em; line-height: 1.1; max-width: 20ch; }
  .sub { margin-top: 24px; font-size: 28px; line-height: 1.45; color: ${TOKENS.ink2}; max-width: 30ch; }
  .strip { display: flex; align-items: center; gap: 28px; border-top: 1px solid ${TOKENS.line}; padding-top: 28px; }
  .chip { font-family: 'PlexMono', monospace; font-size: 21px; color: ${TOKENS.ink3};
          display: flex; align-items: center; gap: 10px; }
  .dot { width: 13px; height: 13px; border-radius: 3px; display: inline-block; }
</style></head>
<body>
  <div class="card">
    <div class="brand">
      <svg width="64" height="64" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="${TOKENS.ink}"/>
        <rect x="4" y="17" width="6" height="10" rx="1.5" fill="#E2857A"/>
        <rect x="13" y="11" width="6" height="16" rx="1.5" fill="#E0A63C"/>
        <rect x="22" y="5" width="6" height="22" rx="1.5" fill="#5FB89B"/>
      </svg>
      <span class="word">gym<span class="accent">tracker</span></span>
    </div>

    <div>
      <h1>Nutrition tracking and workout planning in your browser.</h1>
      <p class="sub">No account. Food logs and programs stay in this browser. Only barcodes you look up are sent anywhere.</p>
    </div>

    <div class="strip">
      <span class="chip"><i class="dot" style="background:${TOKENS.protein}"></i>Nutrition</span>
      <span class="chip"><i class="dot" style="background:${TOKENS.carb}"></i>Programs</span>
      <span class="chip"><i class="dot" style="background:${TOKENS.fat}"></i>Machines</span>
      <span class="chip" style="margin-left:auto">gymtracker.kucera.uk</span>
    </div>
  </div>
</body></html>`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
if (!chrome) {
  console.error('Google Chrome not found. Set CHROME_PATH and re-run.');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'gymtracker-card-'));
const page = join(work, 'card.html');
writeFileSync(page, html);

const port = 9333;
const child = spawn(
  chrome,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${join(work, 'profile')}`,
    '--no-first-run',
    '--allow-file-access-from-files',
    '--hide-scrollbars',
    pathToFileURL(page).href,
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      const found = list.find((t) => t.type === 'page' && t.url.startsWith('file://'));
      if (found) return found;
    } catch {
      /* Chrome is still starting. */
    }
    await sleep(250);
  }
  throw new Error('Chrome did not expose a page target.');
}

try {
  const found = await target();
  const ws = new WebSocket(found.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });

  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message.result);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((res) => {
      const next = ++id;
      pending.set(next, res);
      ws.send(JSON.stringify({ id: next, method, params }));
    });

  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  // Give the webfonts a moment to load and lay out before capturing.
  await sleep(900);

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  ws.close();

  const { statSync } = await import('node:fs');
  console.log(`social-card.png written: ${WIDTH}x${HEIGHT}, ${statSync(OUT).size} bytes`);
} finally {
  child.kill();
  // Chrome can still hold its profile directory briefly after being killed,
  // and a failed cleanup of a temp folder should never fail the generation.
  try {
    rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    /* The OS will reclaim it. */
  }
}
