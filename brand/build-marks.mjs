/**
 * Wanni — mark system builder.
 * One geometry source → every asset. No <text> anywhere: the wordmark is paths.
 *
 *   node brand/build-marks.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = new URL('../public/brand/wannabe/', import.meta.url).pathname;
const INK = '#1B1626';
const PAPER = '#FFF6E5';
const STOCK = '#FFFFFF';
const NIGHT = '#171226';
const LIME = '#C6F24E';
const PINK = '#FF4D8D';
const GRAPE = '#6C4BF0';
const CYAN = '#2ED3F0';
const MANGO = '#FFB020';
const MINT = '#2ED3A6';

const inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const write = (rel, body) => {
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
  return rel;
};

const svg = (vb, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none"${extra}>${body}</svg>\n`;

/* ── geometry ─────────────────────────────────────────────────────────── */
// Primary tile: 56 × 52 on a 64 grid, dog-ear bottom-right, 3.5 hard offset.
const TILE = 'M14 3 H48 A11 11 0 0 1 59 14 V46 L50 55 H14 A11 11 0 0 1 3 44 V14 A11 11 0 0 1 14 3 Z';
const TILE_COMPACT = 'M17 5 H47 A14 14 0 0 1 61 19 V45 A14 14 0 0 1 47 59 H17 A14 14 0 0 1 3 45 V19 A14 14 0 0 1 17 5 Z';

const face = (stroke = 2.8) => `
  <rect x="22" y="25.5" width="5.5" height="8.5" rx="2.75" fill="${INK}"/>
  <rect x="34.5" y="25.5" width="5.5" height="8.5" rx="2.75" fill="${INK}"/>
  <path d="M24.5 41.5 Q31 48 37.5 41.5" stroke="${INK}" stroke-width="${stroke}" stroke-linecap="round"/>`;

/* Primary mark. accent = the "hat" — the only thing that changes per world. */
function mark({ accent = 'var(--hat, #C6F24E)', edge = INK, body = STOCK, shadow = INK, offset = 3.5, ticks = true } = {}) {
  const s = offset ? `<path d="${TILE}" fill="${shadow}" transform="translate(${offset} ${offset})"/>` : '';
  return svg('0 0 66 66', `
  <defs><clipPath id="t"><path d="${TILE}"/></clipPath></defs>
  ${s}
  <path d="${TILE}" fill="${body}"/>
  <g clip-path="url(#t)">
    <rect x="0" y="0" width="66" height="17" fill="${accent}"/>
    <path d="M0 17 H66" stroke="${edge}" stroke-width="2.8"/>
    ${ticks ? `<rect x="41" y="7" width="2.6" height="5" rx="1.3" fill="${edge}"/>
    <rect x="46" y="7" width="2.6" height="5" rx="1.3" fill="${edge}"/>` : ''}
  </g>
  <path d="${TILE}" stroke="${edge}" stroke-width="2.8" stroke-linejoin="round"/>
  ${face().replaceAll(INK, edge)}`);
}

/* Compact: a separate drawing — no dog-ear, no ticks, heavier cut, bigger face. */
function compact({ accent = 'var(--hat, #C6F24E)', edge = INK, body = STOCK, shadow = INK, offset = 0 } = {}) {
  const s = offset ? `<path d="${TILE_COMPACT}" fill="${shadow}" transform="translate(${offset} ${offset})"/>` : '';
  return svg('0 0 64 64', `
  <defs><clipPath id="c"><path d="${TILE_COMPACT}"/></clipPath></defs>
  ${s}
  <path d="${TILE_COMPACT}" fill="${body}"/>
  <g clip-path="url(#c)">
    <rect x="0" y="0" width="64" height="20" fill="${accent}"/>
    <path d="M0 20 H64" stroke="${edge}" stroke-width="3.4"/>
  </g>
  <path d="${TILE_COMPACT}" stroke="${edge}" stroke-width="3.4" stroke-linejoin="round"/>
  <rect x="19" y="29" width="7.5" height="10.5" rx="3.75" fill="${edge}"/>
  <rect x="37.5" y="29" width="7.5" height="10.5" rx="3.75" fill="${edge}"/>
  <path d="M22 45.5 Q32 53.5 42 45.5" stroke="${edge}" stroke-width="3.8" stroke-linecap="round"/>`);
}

/* Mono stamp: one ink, the face is a hole. Mouth becomes a crescent so it can be
   subtracted instead of stroked. */
function mono() {
  return svg('0 0 64 64', `
  <defs><mask id="m">
    <rect width="64" height="64" fill="#000"/>
    <path d="${TILE}" fill="#fff"/>
    <rect x="22" y="25.5" width="5.5" height="8.5" rx="2.75" fill="#000"/>
    <rect x="34.5" y="25.5" width="5.5" height="8.5" rx="2.75" fill="#000"/>
    <path d="M24 40.5 Q31 47.5 38 40.5 Q31 50 24 40.5 Z" fill="#000"/>
  </mask></defs>
  <rect width="64" height="64" fill="${INK}" mask="url(#m)"/>`);
}

/* Glyph: the node with no field and no offset, for stickers and patterns. */
function glyph() {
  return svg('0 0 64 64', `
  <defs><clipPath id="g"><path d="${TILE}"/></clipPath></defs>
  <path d="${TILE}" fill="${STOCK}"/>
  <g clip-path="url(#g)">
    <rect x="0" y="0" width="64" height="17" fill="${LIME}"/>
    <path d="M0 17 H64" stroke="${INK}" stroke-width="2.8"/>
  </g>
  <path d="${TILE}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>
  ${face()}`);
}

/* ── the wordmark: one hand, drawn, no font ───────────────────────────── */
const X = 18, BASE = 40;
const LETTERS = {
  f: [13, ['M11,14 Q4,14 4,22 V40', 'M0,23 H11']],
  u: [15, ['M3,22 V32 A4.5 4.5 0 0 0 12,32 V22']],
  l: [5, ['M2.5,12 V40']],
  s: [13, ['M11,26 Q11,22 6.5,22 Q2,22 2,26 Q2,29.5 6.5,30 Q11,30.5 11,34.5 Q11,40 6.5,40 Q2,40 2,36']],
  t: [10, ['M4,15 V34 Q4,40 9,40', 'M0.5,23 H9.5']],
  a: [14, ['M11,22 V40', 'M11,30 Q11,22 6,22 Q1.5,22 1.5,31 Q1.5,40 6,40 Q11,40 11,32']],
  c: [13, ['M11,26 Q11,22 6.5,22 Q1.5,22 1.5,31 Q1.5,40 6.5,40 Q11,40 11,36']],
  k: [14, ['M2,12 V40', 'M12,22 L4,31', 'M6.5,28 L12.5,40']],
  w: [21, ['M1.5,22 L5.4,40 L10.2,28.5 L15,40 L18.9,22']],
  n: [15, ['M2.5,22 V40', 'M2.5,27 Q2.5,22 7.5,22 Q12.5,22 12.5,27 V40']],
  b: [14, ['M2.5,12 V40', 'M2.5,30 Q2.5,22 7.5,22 Q12.5,22 12.5,31 Q12.5,40 7.5,40 Q2.5,40 2.5,32']],
  e: [13, ['M1.5,31 H11.5 Q11.5,22 6.5,22 Q1.5,22 1.5,31 Q1.5,40 7,40 Q10.5,40 11.5,37']],
};
const TRACK = 3.6, SPACE = 9, WM_STROKE = 5.8;

const shift = (d, dx) =>
  d.replace(/([MLQVAH])([^MLQVAH]*)/g, (m, cmd, args) => {
    const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (!nums.length) return m;
    const map = {
      M: (n) => [n[0] + dx, n[1]], L: (n) => [n[0] + dx, n[1]],
      Q: (n) => [n[0] + dx, n[1], n[2] + dx, n[3]],
      A: (n) => [n[0], n[1], n[2], n[3], n[4], n[5] + dx, n[6]],
      H: (n) => [n[0] + dx], V: (n) => [n[0]],
    }[cmd];
    return cmd + map(nums).join(' ');
  });

function wordPaths(str, startX) {
  let x = startX;
  const out = [];
  for (const ch of str) {
    const [adv, paths] = LETTERS[ch];
    for (const p of paths) out.push(shift(p, x));
    x += adv + TRACK;
  }
  return { paths: out, end: x - TRACK };
}

function wordmark({ ink = 'var(--wm-ink, #1B1626)', accent = PINK, stroke = WM_STROKE, withLabel = true } = {}) {
  const a = wordPaths('fullstack', 4);
  const b = wordPaths('wannabe', a.end + SPACE);
  const width = b.end + 4;
  const body = `
  <g transform="skewX(-6)" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${ink}">${a.paths.map((d) => `<path d="${d}"/>`).join('')}</g>
    <g stroke="${accent}">${b.paths.map((d) => `<path d="${d}"/>`).join('')}</g>
  </g>`;
  const label = withLabel ? ' role="img" aria-label="fullstack wannabe"' : ' aria-hidden="true"';
  return { svg: svg(`0 0 ${width} 52`, body, label), width, height: 52 };
}

/* ── lockups ──────────────────────────────────────────────────────────── */
const WM = wordmark();
const H_GAP = 76;
const horizontal = () => {
  const w = H_GAP + WM.width + 4;
  return svg(`0 0 ${w} 66`, `
  <g>${inner(mark())}</g>
  <g transform="translate(${H_GAP} 7)">${inner(WM.svg)}</g>`);
};
const stacked = () => {
  const w = Math.max(WM.width + 8, 66);
  return svg(`0 0 ${w} 128`, `
  <g transform="translate(${(w - 66) / 2} 0)">${inner(mark())}</g>
  <g transform="translate(${(w - WM.width) / 2} 74)">${inner(WM.svg)}</g>`);
};

/* ── cast: punctuation, not a second logo set ─────────────────────────── */
const cast = {
  spark: { job: 'XP earned', fill: MANGO, d: 'M32 7 L37 26.6 L56.6 32 L37 37.4 L32 57 L27 37.4 L7.4 32 L27 26.6 Z' },
  bolt: { job: 'streak alive', fill: PINK, d: 'M35 7 L15 36 H28.5 L25 57 L47 26 H33 Z' },
  flag: { job: 'quest cleared', fill: LIME, d: 'M22 12 H51 L42.5 24.5 L51 37 H22 Z', extra: 'M20 9 V56' },
  dice: { job: 'roll a challenge', fill: CYAN, d: 'M13 13 H51 A8 8 0 0 1 59 21 V43 A8 8 0 0 1 51 51 H13 A8 8 0 0 1 5 43 V21 A8 8 0 0 1 13 13 Z', dots: [[21, 25], [32, 32], [43, 39]] },
  gem: { job: 'loot tier', fill: MINT, d: 'M32 7 L55 26 L32 57 L9 26 Z', extra: 'M9 26 H55' },
  key: { job: 'unlocked', fill: GRAPE, d: 'M15 20 H23 Q31 20 31 28 H52 Q58 28 58 32 Q58 36 52 36 H50 V45 H42 V36 H31 Q31 44 23 44 H15 Q7 44 7 36 V28 Q7 20 15 20 Z' },
};

const castSvg = (id) => {
  const c = cast[id];
  const extra = c.extra
    ? `<path d="${c.extra}" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    : '';
  const dots = c.dots
    ? c.dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${INK}"/>`).join('')
    : '';
  return svg('0 0 64 64', `
  <path d="${c.d}" fill="${c.fill}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>
  ${extra}${dots}`);
};

/* ── emit ─────────────────────────────────────────────────────────────── */
const files = [
  ['mark.svg', mark()],
  ['mark-reverse.svg', mark({ body: NIGHT, edge: PAPER, shadow: '#0C0913' })],
  ['mark-mono.svg', mono()],
  ['mark-compact.svg', compact()],
  ['glyph.svg', glyph()],
  ['favicon.svg', compact({ offset: 0, accent: LIME })],
  ['lockups/horizontal.svg', horizontal()],
  ['lockups/stacked.svg', stacked()],
  ['wordmark.svg', WM.svg],
  ...Object.keys(cast).map((id) => [`cast/${id}.svg`, castSvg(id)]),
];

for (const [rel, body] of files) write(rel, body);
console.log(`wrote ${files.length} svg · wordmark ${WM.width.toFixed(1)} × ${WM.height}`);
console.log(Object.entries(cast).map(([k, v]) => `${k} — ${v.job}`).join('\n'));
