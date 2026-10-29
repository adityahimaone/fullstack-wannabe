/**
 * Contrast audit — the colour half of the smoke suite.
 *
 * Walks the real DOM of the production build in headless Chrome, resolves the
 * effective background behind every run of text (compositing every translucent
 * layer on the way up), and reports anything below WCAG AA.
 *
 *   npm run build
 *   npx vite preview --port 4173 --host 127.0.0.1
 *   node scripts/audit-contrast.mjs
 *
 * Why the DOM and not the token file: a token can be perfectly legible and
 * still end up as text on a fill it was never meant for. Only the rendered
 * pair knows the truth.
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
const PORT = Number(process.env.SMOKE_CDP_PORT || 9388);
const THRESHOLD = Number(process.env.AUDIT_MIN || 4.5);

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
      '--user-data-dir=/tmp/fsw-audit-profile',
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

/** The page-side auditor. Runs once per route, returns every text/background pair. */
const AUDIT = `
  // Resolve any CSS colour string to RGBA through a canvas: this survives
  // oklch(), color-mix(), and named colours without re-implementing CSS.
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  function toRgba(str) {
    if (cache.has(str)) return cache.get(str);
    let out = null;
    if (str && str !== 'transparent' && str !== 'none') {
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = '#000';
      cx.fillStyle = str;
      cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      out = [d[0], d[1], d[2], d[3] / 255];
    }
    cache.set(str, out);
    return out;
  }

  const over = (top, bottom) => {
    if (!top) return bottom;
    if (!bottom) return top;
    const a = top[3] + bottom[3] * (1 - top[3]);
    if (a === 0) return [0, 0, 0, 0];
    return [
      (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / a,
      (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / a,
      (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / a,
      a,
    ];
  };

  const lin = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  /*
   * Paint the stack of backgrounds behind an element, bottom-up.
   *
   * CSS opacity is not a colour — it flattens the subtree into a group and
   * then composites that group at the given alpha. So a node's background
   * fades by the product of every opacity from the root down to it, and the
   * text fades by the product down to itself. Ignoring this is how
   * "opacity-55" on a card hides a 4.0:1 failure: the audit sees full-strength
   * ink on a full-strength card and reports 16:1.
   */
  function bgOf(el) {
    const chain = [];
    let n = el;
    let hasImage = false;
    while (n && n.nodeType === 1) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') hasImage = true;
      chain.push({ bg: toRgba(s.backgroundColor), o: +s.opacity });
      const c = chain[chain.length - 1].bg;
      if (c && c[3] >= 0.999 && +s.opacity >= 0.999) break;
      n = n.parentElement;
    }

    // chain[0] is the element, chain.at(-1) is the outermost ancestor.
    // Fade each background by every opacity from the root down to that node.
    const stack = [];
    let faded = 1;
    for (let i = chain.length - 1; i >= 0; i--) {
      faded *= chain[i].o;
      const c = chain[i].bg;
      if (c && c[3] > 0) stack.push([c[0], c[1], c[2], c[3] * faded]);
    }

    let out = [255, 255, 255, 1];
    for (const c of stack) out = over(c, out);
    return { rgb: out, hasImage, faded };
  }

  /*
   * WCAG 1.4.3 exempts inactive controls, so a disabled button at 2:1 is not a
   * violation — it is the convention. Detect the whole inert subtree.
   */
  const inert = (el) => {
    let n = el;
    while (n && n.nodeType === 1) {
      if (n.disabled === true) return true;
      if (n.getAttribute && (n.getAttribute('aria-disabled') === 'true' || 'disabled' in n.dataset))
        return true;
      n = n.parentElement;
    }
    return false;
  };

  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const sel = (el) => {
    const bits = [];
    let n = el;
    for (let i = 0; i < 4 && n && n.nodeType === 1; i++) {
      let s = n.tagName.toLowerCase();
      const cls = (n.className || '').toString().trim().split(/\\s+/).filter(Boolean).slice(0, 3);
      if (cls.length) s += '.' + cls.join('.');
      bits.unshift(s);
      n = n.parentElement;
    }
    return bits.join(' > ');
  };

  const out = [];
  const seen = new Set();

  for (const el of document.querySelectorAll('body *')) {
    // Only elements that own a text node directly — otherwise every wrapper
    // reports its child's colour and the list is all noise.
    const own = [...el.childNodes].filter(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1,
    );
    if (!own.length) continue;
    if (!visible(el)) continue;

    const text = own.map((n) => n.textContent.trim()).join(' ').slice(0, 48);
    const s = getComputedStyle(el);
    const fgRaw = toRgba(s.color);
    if (!fgRaw || fgRaw[3] === 0) continue;
    if (inert(el)) continue;
    const bg = bgOf(el);
    // The text fades with every ancestor group too, not just its own alpha.
    const fgA = fgRaw[3] * bg.faded;
    const fg = fgA < 0.999 ? over([fgRaw[0], fgRaw[1], fgRaw[2], fgA], bg.rgb) : fgRaw;

    const size = parseFloat(s.fontSize);
    const weight = +s.fontWeight || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const r = ratio(fg, bg.rgb);

    const key = [s.color, bg.rgb.join(','), Math.round(size), weight, text].join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      ratio: Math.round(r * 100) / 100,
      need: large ? 3 : 4.5,
      large,
      fg: s.color,
      bg: \`rgb(\${bg.rgb.slice(0, 3).map(Math.round).join(' ')})\`,
      onImage: bg.hasImage,
      size: Math.round(size),
      text,
      where: sel(el),
    });
  }
  return out;
`;

const ROUTES = [
  { path: '/', name: 'dashboard' },
  { path: '/erd', name: 'erd' },
  { path: '/sql', name: 'sql' },
  { path: '/dojo', name: 'dojo' },
  { path: '/blueprint', name: 'blueprint' },
  { path: '/design-system', name: 'design-system' },
];

async function setTheme(theme) {
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
  throw new Error(`page never became ready for ${theme}`);
}

async function main() {
  await launch();
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const failures = [];
  let scanned = 0;

  for (const theme of ['light', 'dark']) {
    for (const route of ROUTES) {
      await send('Page.navigate', { url: BASE + route.path });
      await sleep(700);
      await setTheme(theme);
      await sleep(450);
      const rows = await evaluate(AUDIT);
      scanned += rows.length;
      for (const r of rows) {
        if (r.ratio < r.need) failures.push({ theme, route: route.name, ...r });
      }
    }
  }

  // Group: one line per distinct colour pair, not per element.
  const groups = new Map();
  for (const f of failures) {
    const key = `${f.theme}|${f.fg}|${f.bg}|${f.need}`;
    if (!groups.has(key)) groups.set(key, { ...f, count: 0, samples: new Set() });
    const g = groups.get(key);
    g.count++;
    if (g.samples.size < 3) g.samples.add(`${f.route}: "${f.text}"`);
  }

  const list = [...groups.values()].sort((a, b) => a.ratio - b.ratio);

  if (!list.length) {
    console.log(`\ncontrast audit — ${scanned} text pairs scanned across ${ROUTES.length} routes × 2 themes`);
    console.log(`all pairs meet WCAG AA (${THRESHOLD}:1 body / 3:1 large)\n`);
  } else {
    console.log(`\ncontrast audit — ${scanned} text pairs scanned`);
    console.log(`${failures.length} failing elements in ${list.length} distinct colour pairs\n`);
    for (const g of list) {
      console.log(
        `${String(g.ratio).padStart(5)}:1  need ${g.need}  ${g.theme.padEnd(5)}  ${g.fg} on ${g.bg}`,
      );
      console.log(`          ×${g.count}  ${[...g.samples].join(' · ')}`);
      console.log(`          ${g.where}`);
    }
    console.log('');
  }

  fs.writeFileSync(
    new URL('../brand/contrast-audit.json', import.meta.url).pathname,
    JSON.stringify({ scanned, failures: list.map(({ samples, ...g }) => ({ ...g, samples: [...samples] })) }, null, 2) + '\n',
  );

  chrome.kill();
  process.exit(list.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  chrome?.kill();
  process.exit(1);
});
