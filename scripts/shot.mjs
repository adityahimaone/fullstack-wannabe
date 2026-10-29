/**
 * Screenshot harness — the visual half of the smoke suite.
 *
 * Runs against the production build in dist/, because a dev-server-only
 * difference (a Tailwind class that never got generated, a lazy chunk that
 * 404s) is exactly the class of bug this is meant to catch.
 *
 *   npm run build
 *   npx vite preview --port 4173 --host 127.0.0.1
 *   node scripts/shot.mjs
 *
 * Output: brand/shots/<path>-<width>-<theme>.png
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

function findChrome() {
  if (process.env.SMOKE_CHROME) return process.env.SMOKE_CHROME;
  const candidates =
    process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ]
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find((c) => fs.existsSync(c)) ?? 'google-chrome';
}

const CHROME = findChrome();
const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:4173';
const PORT = Number(process.env.SMOKE_CDP_PORT || 9333);
const OUT = new URL('../brand/shots/', import.meta.url).pathname;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let chrome;
let ws;
let msgId = 0;
const pending = new Map();

async function launch() {
  chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      '--remote-allow-origins=*',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--in-process-gpu',
      '--disable-features=NetworkServiceInProcess,Translate',
      '--hide-scrollbars',
      '--user-data-dir=/tmp/fsw-shot-profile',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
          ws.onopen = resolve;
          ws.onerror = reject;
        });
        ws.addEventListener('message', (ev) => {
          const msg = JSON.parse(ev.data);
          if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
          }
        });
        return;
      }
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error('Chrome did not expose a debuggable page');
}

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression: `(async () => { ${expression} })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
  }
  return res.result.value;
}

const SHOTS = [
  { path: '/', name: 'dashboard' },
  { path: '/erd', name: 'erd' },
  { path: '/sql', name: 'sql' },
  { path: '/dojo', name: 'dojo' },
  { path: '/blueprint', name: 'blueprint' },
  { path: '/design-system', name: 'design-system' },
];

const SIZES = [
  { w: 1440, h: 900, tag: 'desk' },
  { w: 390, h: 844, tag: 'mob' },
];

const THEMES = (process.env.SHOT_THEMES || 'light,dark').split(',');
const ONLY = process.env.SHOT_ONLY ? process.env.SHOT_ONLY.split(',') : null;

async function setTheme(theme) {
  // Navigation is asynchronous: Page.navigate resolves at commit, not at load,
  // so the first evaluate can still land on the old (or a blank) document,
  // where localStorage throws a SecurityError. Poll until the app is mounted.
  for (let i = 0; i < 40; i++) {
    const ok = await evaluate(`
      try {
        if (!document.querySelector('#root')?.children.length) return false;
        localStorage.setItem('fsw:theme', JSON.stringify(${JSON.stringify(theme)}));
        document.documentElement.classList.toggle('dark', ${theme === 'dark'});
        document.documentElement.dataset.theme = ${JSON.stringify(theme)};
        document.documentElement.style.colorScheme = ${JSON.stringify(theme)};
        return true;
      } catch (e) { return false; }
    `).catch(() => false);
    if (ok) return;
    await sleep(200);
  }
  throw new Error(`page never became ready for theme "${theme}"`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  await launch();
  await send('Page.enable');
  await send('Runtime.enable');

  const shots = ONLY ? SHOTS.filter((s) => ONLY.includes(s.name)) : SHOTS;

  for (const theme of THEMES) {
    for (const size of SIZES) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: size.w,
        height: size.h,
        deviceScaleFactor: 1,
        mobile: size.tag === 'mob',
      });

      for (const shot of shots) {
        await send('Page.navigate', { url: BASE + shot.path });
        await sleep(700);
        await setTheme(theme);
        await sleep(450);

        // Full page: measure, then resize the viewport to the document height
        // so nothing below the fold is cut off.
        const height = await evaluate(`
          return Math.min(6000, Math.max(${size.h}, document.documentElement.scrollHeight));
        `);
        await send('Emulation.setDeviceMetricsOverride', {
          width: size.w,
          height,
          deviceScaleFactor: 1,
          mobile: size.tag === 'mob',
        });
        await sleep(350);

        const { data } = await send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
        });
        const file = `${OUT}${shot.name}-${size.tag}-${theme}.png`;
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        console.log(`${shot.name.padEnd(14)} ${size.tag} ${theme.padEnd(5)} ${size.w}x${height}`);
      }
    }
  }

  chrome.kill();
}

main().catch((err) => {
  console.error(err);
  chrome?.kill();
  process.exit(1);
});
