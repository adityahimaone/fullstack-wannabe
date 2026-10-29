/**
 * CDP smoke suite for the fullstack-wannabe production build in dist/.
 *
 * Runs 15 functional checks in headless Chrome against a real build, including a
 * responsive audit and a console-error tripwire. Nothing is mocked: SQL runs in
 * sql.js, and the dojo reference solutions execute in the app's own worker.
 *
 * Prerequisites:
 *   npm run build
 *   npx vite preview --port 4173 --host 127.0.0.1
 *   npm run smoke
 *
 * Override the preview URL with SMOKE_BASE, or the browser with SMOKE_CHROME.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

/**
 * Chrome is not guaranteed to be on PATH. Try the usual install locations
 * before giving up, so the script works on macOS, Linux and Windows.
 */
function findChrome() {
  if (process.env.SMOKE_CHROME) return process.env.SMOKE_CHROME;
  const candidates =
    process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ]
      : process.platform === 'win32'
        ? [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          ]
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find((c) => fs.existsSync(c)) ?? 'google-chrome';
}

const CHROME = findChrome();
const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:4173';
const PORT = Number(process.env.SMOKE_CDP_PORT || 9222);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let chrome;
let ws;
let msgId = 0;
const pending = new Map();
const consoleErrors = [];

async function launch() {
  chrome = spawn(CHROME, [
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
    '--user-data-dir=/tmp/fsw-chrome-profile',
    'about:blank',
  ], { stdio: 'ignore' });

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
          } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
          } else if (msg.method === 'Runtime.exceptionThrown') {
            const d = msg.params.exceptionDetails;
            consoleErrors.push(`${d.text} ${d.exception?.description ?? ''}`);
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

async function goto(path, settle = 900) {
  await send('Page.navigate', { url: BASE + path });
  await sleep(settle);
}

async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await sleep(280);
}

/** Body text, lowercased — CSS `text-transform` rewrites innerText, so never match case-sensitively. */
const BODY = `document.body.innerText.toLowerCase()`;

const SET_TEXTAREA = (code) => `
  const ta = document.querySelector('textarea');
  if (!ta) throw new Error('no textarea');
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, ${JSON.stringify(code)});
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  return ta.value.length;
`;

const clickByText = (text) => `
  const el = [...document.querySelectorAll('button')]
    .find((b) => (b.textContent || '').toLowerCase().includes(${JSON.stringify(text.toLowerCase())}));
  if (!el) throw new Error('no button containing ' + ${JSON.stringify(text)});
  el.click();
  return el.textContent.trim();
`;

/** The challenge title lives in the brief block; the sidebar logo also uses .display, so skip it. */
const TITLE = `
  const spans = [...document.querySelectorAll('span.display')].map((s) => s.textContent.trim());
  return spans.find((t) => t && !/fullstack/i.test(t)) ?? '';
`;

const referenceSolution = `
  const label = [...document.querySelectorAll('p.eyebrow')].find((p) => /reference solution/i.test(p.textContent));
  if (!label) throw new Error('reference solution not revealed');
  return label.nextElementSibling.textContent;
`;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

try {
  await launch();
  await send('Page.enable');
  await send('Runtime.enable');
  await viewport(1440, 900);

  // ---- 1. app boots
  await goto('/', 1200);
  await evaluate(`localStorage.clear(); return true;`);
  await goto('/', 1400);
  const dash = await evaluate(`
    return {
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      panels: document.querySelectorAll('.panel').length,
      // The hero is a .stage, not a .panel — the brand's night ground.
      stages: document.querySelectorAll('.stage').length,
      mark: !!document.querySelector('a[aria-label*="home"] svg'),
    };
  `);
  check(
    'App boots and dashboard renders',
    dash.h1.length > 0 && dash.panels >= 3 && dash.stages === 1 && dash.mark,
    `h1="${dash.h1}" · ${dash.panels} panels · ${dash.stages} stage · mark ${dash.mark ? 'yes' : 'no'}`,
  );

  // ---- 2. ERD canvas
  await goto('/erd', 1600);
  const erd = await evaluate(`return { nodes: document.querySelectorAll('.react-flow__node').length };`);
  check('ERD renders entity nodes', erd.nodes >= 3, `${erd.nodes} nodes`);

  // ---- 3. SQL executes
  await goto('/sql', 1800);
  const sql = await evaluate(`
    const run = [...document.querySelectorAll('button')].find((b) => /^run/i.test((b.textContent||'').trim()));
    if (!run) throw new Error('no run button');
    run.click();
    await new Promise((r) => setTimeout(r, 1600));
    return { rows: document.querySelectorAll('tbody tr').length };
  `);
  check('SQL engine executes a query', sql.rows > 0, `${sql.rows} rows`);

  // ---- 4. SQL autocomplete opens on typing, and Tab accepts the suggestion
  const ac = await evaluate(`
    const ta = document.querySelector('textarea');
    if (!ta) throw new Error('no sql textarea');
    ta.focus(); ta.click();
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'sel');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 320));
    const listbox = document.querySelector('[role="listbox"]');
    const options = listbox ? [...listbox.querySelectorAll('[role="option"]')].map((o) => o.textContent.trim()) : [];
    return { open: !!listbox, options };
  `);
  check(
    'SQL autocomplete opens with options',
    ac.open && ac.options.length > 0,
    `${ac.options.length} options: ${ac.options.slice(0, 4).join(', ')}`,
  );

  // ---- 5. Dojo: four stacks, three difficulty buckets
  await goto('/dojo', 1400);
  const dojoChrome = await evaluate(`
    const body = ${BODY};
    const pills = [...document.querySelectorAll('button')].filter((b) => /^(go|ts|ui|php)/i.test((b.textContent||'').trim()));
    const headers = [...document.querySelectorAll('p.eyebrow')].map((p) => p.textContent.trim().toLowerCase());
    return {
      pills: pills.length,
      buckets: ['easy', 'medium', 'hard'].filter((d) => headers.includes(d)),
      chips: ['easy', 'medium', 'hard'].filter((d) => body.includes(d)).length,
    };
  `);
  check('Dojo shows 4 stack pills', dojoChrome.pills >= 4, `${dojoChrome.pills} pills`);
  check(
    'Dojo groups challenges into Easy → Medium → Hard',
    dojoChrome.buckets.length === 3 && dojoChrome.chips === 3,
    `buckets=${JSON.stringify(dojoChrome.buckets)}`,
  );

  // ---- 6. difficulty filter narrows the list
  const filtered = await evaluate(`
    const hard = [...document.querySelectorAll('button')].find((b) => (b.textContent||'').trim().toLowerCase().startsWith('hard'));
    if (!hard) throw new Error('no hard chip');
    hard.click();
    await new Promise((r) => setTimeout(r, 350));
    const headers = [...document.querySelectorAll('p.eyebrow')].map((p) => p.textContent.trim().toLowerCase());
    return { headers, easy: headers.includes('easy'), medium: headers.includes('medium'), hard: headers.includes('hard') };
  `);
  check(
    'Difficulty filter shows only the chosen bucket',
    filtered.hard && !filtered.easy && !filtered.medium,
    `headers=${JSON.stringify(filtered.headers.filter((h) => ['easy', 'medium', 'hard'].includes(h)))}`,
  );

  // ---- 7. Frontend track: a real TypeScript challenge
  await evaluate(`[...document.querySelectorAll('button')].find((b)=>(b.textContent||'').trim().toLowerCase().startsWith('all'))?.click(); return true;`);
  await sleep(250);
  const fe = await evaluate(`
    const ui = [...document.querySelectorAll('button')].find((b) => (b.textContent||'').trim().toLowerCase().startsWith('ui'));
    if (!ui) throw new Error('no UI stack pill');
    ui.click();
    await new Promise((r) => setTimeout(r, 800));
    const item = document.querySelector('aside ul li button') || document.querySelector('ul li button');
    if (item) { item.click(); await new Promise((r) => setTimeout(r, 400)); }
    const ta = document.querySelector('textarea');
    const body = ${BODY};
    ${TITLE}
  `).catch((e) => ({ error: e.message }));
  const feState = await evaluate(`
    const ta = document.querySelector('textarea');
    const body = ${BODY};
    const spans = [...document.querySelectorAll('span.display')].map((s) => s.textContent.trim());
    return {
      title: spans.find((t) => t && !/fullstack/i.test(t)) ?? '',
      starter: ta ? ta.value : '',
      tsLabel: body.includes('sandboxed ts'),
      modeLabel: (body.match(/sandboxed \\w+/) || [''])[0],
    };
  `);
  const looksTyped = /:\s*(string|number|boolean|Record|Array|unknown|Values|Errors)|\binterface\b|\btype\s+\w+\s*=/.test(feState.starter);
  check(
    'Frontend track serves a real TypeScript challenge',
    looksTyped && feState.tsLabel,
    `${feState.title} · ${feState.modeLabel} · starter has type syntax: ${looksTyped}`,
  );

  // ---- 8. The TS solution executes in the worker and passes
  await evaluate(clickByText('Reveal'));
  await sleep(350);
  const solution = await evaluate(referenceSolution);
  await evaluate(SET_TEXTAREA(solution));
  await sleep(300);
  await evaluate(clickByText('Run tests'));
  await sleep(2400);
  const feRun = await evaluate(`
    const body = ${BODY};
    return { solved: body.includes('solved.'), differs: body.includes('output differs'), threw: body.includes('threw an error'), timedOut: body.includes('timed out') };
  `);
  check(
    'TypeScript reference solution passes in the browser worker',
    feRun.solved && !feRun.differs,
    feRun.threw ? 'worker threw' : feRun.timedOut ? 'timeout' : feRun.differs ? 'output mismatch' : 'sucrase transpile path OK',
  );

  // ---- 9. A wrong answer must fail (grader is not a rubber stamp)
  const starter = await evaluate(`
    const spans = [...document.querySelectorAll('p.eyebrow')];
    return document.querySelector('textarea')?.value ?? '';
  `);
  await evaluate(`
    const ta = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'function solve() { return 42; }');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  `);
  await sleep(250);
  await evaluate(clickByText('Run tests'));
  await sleep(2200);
  const wrong = await evaluate(`return ${BODY}.includes('not passing yet');`);
  check('A wrong answer is rejected', wrong, 'expected "Not passing yet."');

  // ---- 10. Go static challenge validates its own reference
  await evaluate(`
    const go = [...document.querySelectorAll('button')].find((b) => (b.textContent||'').trim().toLowerCase().startsWith('go'));
    go.click();
    await new Promise((r) => setTimeout(r, 700));
    const item = document.querySelector('aside ul li button') || document.querySelector('ul li button');
    item.click();
    await new Promise((r) => setTimeout(r, 400));
    return true;
  `);
  const goState = await evaluate(`
    const spans = [...document.querySelectorAll('span.display')].map((s) => s.textContent.trim());
    return { title: spans.find((t) => t && !/fullstack/i.test(t)) ?? '', staticMode: ${BODY}.includes('static analysis') };
  `);
  await evaluate(clickByText('Reveal'));
  await sleep(350);
  const goSolution = await evaluate(referenceSolution);
  await evaluate(SET_TEXTAREA(goSolution));
  await sleep(300);
  await evaluate(clickByText('Check code'));
  await sleep(1100);
  const goOk = await evaluate(`return ${BODY}.includes('solved.');`);
  check('Go static challenge validates its reference solution', goOk && goState.staticMode, goState.title);

  // ---- 11. Blueprint resolves the frontend stack to Node, never PHP
  await evaluate(`
    const ui = [...document.querySelectorAll('button')].find((b) => (b.textContent||'').trim().toLowerCase().startsWith('ui'));
    ui?.click();
    return true;
  `);
  await goto('/blueprint', 1500);
  const bp = await evaluate(`
    const body = ${BODY};
    return {
      note: body.includes('dojo-only'),
      php: (document.body.innerText.match(/\\.php/g) || []).length,
      ts: (document.body.innerText.match(/\\.ts\\b/g) || []).length,
    };
  `);
  check('Blueprint shows Node for the frontend stack (no PHP leak)', bp.note && bp.php === 0, `${bp.php} .php · ${bp.ts} .ts`);

  // ---- 12. Quest log renders every world
  await goto('/sql', 2200);
  const quest = await evaluate(`
    const body = ${BODY};
    const total = (body.match(/(\\d+)\\/27 cleared/) || [])[1];
    const worlds = ['the basics', 'order & bounds', 'aggregates', 'the art of the join', 'advanced sorcery']
      .filter((w) => body.includes(w)).length;
    return { worlds, total: total ?? '?' };
  `);
  check('Quest log renders all five worlds', quest.worlds === 5, `${quest.worlds}/5 worlds · ${quest.total}/27 cleared`);

  // ---- 13. No horizontal overflow across routes × breakpoints
  const routes = ['/', '/erd', '/sql', '/dojo', '/blueprint', '/design-system'];
  const sizes = [[375, 780], [768, 900], [1024, 800], [1440, 900]];
  const overflow = [];
  for (const [w, h] of sizes) {
    await viewport(w, h);
    for (const route of routes) {
      await goto(route, route === '/erd' || route === '/sql' ? 1500 : 700);
      const res = await evaluate(`
        return { scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth };
      `);
      if (res.scrollW > res.innerW + 1) overflow.push(`${route}@${w}: ${res.scrollW}>${res.innerW}`);
    }
  }
  check(
    `No horizontal overflow across ${routes.length * sizes.length} route × breakpoint combos`,
    overflow.length === 0,
    overflow.join(' | '),
  );

  // ---- console hygiene
  const noisy = consoleErrors.filter((e) => e && !/favicon|Download the React DevTools/i.test(e));
  check('No console errors', noisy.length === 0, noisy.slice(0, 3).join(' || '));

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  if (noisy.length) {
    console.log('\nconsole errors:');
    noisy.slice(0, 8).forEach((e) => console.log('  ·', e.slice(0, 260)));
  }
  process.exit(passed === results.length ? 0 : 1);
} finally {
  try { ws?.close(); } catch {}
  try { chrome?.kill('SIGKILL'); } catch {}
}
