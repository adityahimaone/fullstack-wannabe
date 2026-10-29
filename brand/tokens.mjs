/**
 * Token generator. One hex source → oklch channels → CSS + JSON + contrast table.
 * Never hand-edit wannabe-tokens.css; edit here and re-run.
 *
 *   node brand/tokens.mjs
 */
import { writeFileSync } from 'node:fs';

const OUT = new URL('../public/brand/wannabe/', import.meta.url).pathname;

/* ── colour maths ─────────────────────────────────────────────────────── */
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgb = (h) => {
  h = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const lum = (h) => {
  const [r, g, b] = rgb(h).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return Number(((x + 0.05) / (y + 0.05)).toFixed(2));
};
function channels(hex) {
  const [r, g, b] = rgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return `${L.toFixed(3)} ${Math.hypot(A, B).toFixed(3)} ${H.toFixed(1)}`;
}

/* ── the palette ──────────────────────────────────────────────────────── */
const P = {
  ink:       { light: '#1B1626', dark: '#FFF6E5', role: 'text, edge, offset' },
  paper:     { light: '#FFF6E5', dark: '#171226', role: 'page ground' },
  card:      { light: '#FFFDF7', dark: '#221A33', role: 'raised surface' },
  raised:    { light: '#FFFFFF', dark: '#2B2142', role: 'sticker stock, inputs' },
  lime:      { light: '#C6F24E', dark: '#D3F86B', role: 'brand · dojo · primary action' },
  pink:      { light: '#FF4D8D', dark: '#FF6FA5', role: 'arena · celebration' },
  cyan:      { light: '#2ED3F0', dark: '#5FE0F7', role: 'schema · node headers' },
  grape:     { light: '#6C4BF0', dark: '#9C86FF', role: 'blueprint · focus ring' },
  mango:     { light: '#FFB020', dark: '#FFC44D', role: 'xp · badges · reward' },
  mint:      { light: '#2ED3A6', dark: '#4FE3BC', role: 'success · solved' },
  chili:     { light: '#DC1F2C', dark: '#FF7A84', role: 'destructive · failing' },
  // text ON a fill never flips with the theme — it is fixed to the fill's own value
  onCandy:   { light: '#1B1626', dark: '#1B1626', role: 'text on lime / cyan / mango / mint / pink' },
  // Grape is the one fill that INVERTS between themes: #6C4BF0 at night becomes
  // #9C86FF, which is light. Cream on that is 2.69:1. So this one flips.
  onGrape:   { light: '#FFF6E5', dark: '#1B1626', role: 'text on the grape fill (flips with it)' },
  // The night stage is dark in BOTH themes, so its text never flips. Separate
  // token, because reusing on-grape for both is exactly how the stage broke.
  onStage:   { light: '#FFF6E5', dark: '#FFF6E5', role: 'text on the night stage' },
  onDanger:  { light: '#FFF6E5', dark: '#1B1626', role: 'text on chili (the fill flips)' },
  // text-safe versions of the candy: the same hue, dark enough to read on paper.
  // In dark mode they flip back to the bright candy, because the ground is dark.
  limeInk:   { light: '#446000', dark: '#C6F24E', role: 'lime as text / icon' },
  mangoInk:  { light: '#7A4800', dark: '#FFB020', role: 'mango as text' },
  cyanInk:   { light: '#0E6070', dark: '#2ED3F0', role: 'cyan as text' },
  mintInk:   { light: '#076045', dark: '#2ED3A6', role: 'mint as text' },
  grapeInk:  { light: '#5B3BD8', dark: '#9C86FF', role: 'grape as text' },
  dangerInk: { light: '#B3161F', dark: '#FF7A84', role: 'chili as text / icon' },
  border:    { light: '#CCC5BB', dark: '#45404C', role: 'hairline dividers' },
  edge:      { light: '#1B1626', dark: '#FFF6E5', role: 'the 2.5px edge' },
  offset:    { light: '#1B1626', dark: '#0B0813', role: 'the hard offset' },
  stage:     { light: '#171226', dark: '#0E0A17', role: 'night stage' },
};

const soft = (hex, amount, ground) => {
  // mix a colour toward the ground, used for muted surfaces
  const a = rgb(hex), b = rgb(ground);
  const mix = a.map((v, i) => v + (b[i] - v) * amount);
  const toS = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
  return '#' + mix.map((v) => toS(v).toString(16).padStart(2, '0')).join('').toUpperCase();
};

const L = {}, D = {};
for (const [k, v] of Object.entries(P)) { L[k] = v.light; D[k] = v.dark; }

// muted surfaces derived from the ground so the system stays one material
//
// These are explicit hex, NOT mixed, and that is deliberate.
// soft() interpolates in sRGB, which overshoots lightness catastrophically in
// dark mode: 18% of the way from #221A33 toward cream lands on #928B9B —
// oklch L 0.648, a *light grey* surface, with cream text on it at 2.32:1.
// A muted surface has to step AWAY from the text, so at night it is darker
// than the card, not lighter.
L.muted = '#FAF5EC'; D.muted = '#1C1530'; // table heads, meter tracks, row hover
L.secondary = '#FFFBF2'; D.secondary = '#2E2444'; // chips, secondary buttons, pills

/*
 * The text ramp. Three steps, and every step passes WCAG AA on both grounds —
 * that is the whole point. The app used to fake hierarchy with
 * `text-muted-foreground/50`, which is 2.27:1 on cream: not "quiet", broken.
 * Hierarchy is size and weight now, not opacity.
 */
L.text2 = '#5C5268'; D.text2 = '#BDB2CE'; // secondary body copy
L.textTertiary = '#6F6478'; D.textTertiary = '#948BA6'; // metadata, codes, captions

/* ── css ──────────────────────────────────────────────────────────────── */
const kebab = (k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const block = (c, indent = '    ') =>
  Object.entries(c).map(([k, v]) => `${indent}--wb-${kebab(k)}-c: ${channels(v)};`).join('\n');

const css = `/* ─────────────────────────────────────────────────────────────────────
   fullstack wannabe · design tokens v1.0
   Generated by brand/tokens.mjs — do not hand-edit.

   Two layers, same as the app already uses:
     --wb-<name>-c   raw oklch channels, for oklch(var(--x) / <alpha>)
     --wb-<name>     the composed colour, for gradients and SVG

   The semantic block at the bottom re-points the app's EXISTING token
   names (--background-c, --primary-c, …) at the brand primitives, so the
   shell re-skins without touching a single component.
   ───────────────────────────────────────────────────────────────────── */

:root {
${block(L)}

${Object.entries(L).map(([k, v]) => `  --wb-${kebab(k)}: oklch(var(--wb-${kebab(k)}-c));`).join('\n')}

  /* geometry — the material
     NOTE: the colour token is --wb-offset; the DISTANCE is --wb-shift.
     They cannot share a name — the later declaration silently kills the
     colour, and every hard shadow turns into "4px 4px 0 0 4px". */
  --wb-edge-w: 2.5px;
  --wb-shift: 4px;
  --wb-radius-sm: 8px;
  --wb-radius-md: 12px;
  --wb-radius-lg: 18px;
  --wb-radius-xl: 26px;

  /* motion */
  --wb-pop: cubic-bezier(.34, 1.56, .64, 1);
  --wb-t-press: 90ms;
  --wb-t-pop: 180ms;
  --wb-t-celebrate: 420ms;
}

[data-theme='dark'], .dark {
${block(D)}

${Object.entries(D).map(([k, v]) => `  --wb-${kebab(k)}: oklch(var(--wb-${kebab(k)}-c));`).join('\n')}
}

/* ── semantic: the app's own names, re-pointed ─────────────────────────── */
:root {
  --background-c: var(--wb-paper-c);
  --foreground-c: var(--wb-ink-c);
  --surface-c: var(--wb-card-c);
  --elevated-c: var(--wb-raised-c);
  --card-c: var(--wb-card-c);
  --card-foreground-c: var(--wb-ink-c);
  --on-candy-c: var(--wb-on-candy-c);
  --on-grape-c: var(--wb-on-grape-c);
  --on-danger-c: var(--wb-on-danger-c);
  --popover-c: var(--wb-raised-c);
  --popover-foreground-c: var(--wb-ink-c);
  --primary-c: var(--wb-lime-c);
  --primary-foreground-c: var(--wb-on-candy-c);
  --secondary-c: var(--wb-secondary-c);
  --secondary-foreground-c: var(--wb-ink-c);
  --muted-c: var(--wb-muted-c);
  --muted-foreground-c: var(--wb-text2-c);
  --accent-c: var(--wb-secondary-c);
  --accent-foreground-c: var(--wb-ink-c);
  --destructive-c: var(--wb-chili-c);
  --destructive-foreground-c: var(--wb-on-danger-c);
  --border-c: var(--wb-border-c);
  --input-c: var(--wb-border-c);
  --ring-c: var(--wb-grape-c);

  --primary-ink-c: var(--wb-lime-ink-c);
  --reward-ink-c: var(--wb-mango-ink-c);
  --info-ink-c: var(--wb-cyan-ink-c);
  --success-ink-c: var(--wb-mint-ink-c);
  --violet-ink-c: var(--wb-grape-ink-c);
  --danger-ink-c: var(--wb-danger-ink-c);
  --text-tertiary-c: var(--wb-text-tertiary-c);
  --on-stage-c: var(--wb-on-stage-c);
  --edge-c: var(--wb-edge-c);
  --offset-c: var(--wb-offset-c);
  --stage-c: var(--wb-stage-c);

  /* the app's original accent names, still referenced by old components */
  --lime-c: var(--wb-lime-c);
  --amber-c: var(--wb-mango-c);
  --violet-c: var(--wb-grape-c);
  --cyan-c: var(--wb-cyan-c);

  /* world + state — new names, no old equivalent */
  --world-schema-c: var(--wb-cyan-c);
  --world-arena-c: var(--wb-pink-c);
  --world-dojo-c: var(--wb-lime-c);
  --world-blueprint-c: var(--wb-grape-c);
  --reward-c: var(--wb-mango-c);
  --success-c: var(--wb-mint-c);

  /* geometry, short names for the material classes */
  --edge-w: var(--wb-edge-w);
  --shift: var(--wb-shift);
  --ease-pop: var(--wb-pop);
}
`;

/* ── json ─────────────────────────────────────────────────────────────── */
const json = {
  name: 'fullstack wannabe',
  slug: 'wannabe',
  version: '1.0.0',
  generated: new Date().toISOString().slice(0, 10),
  material: { edge: '2.5px', offset: '4px 4px 0', blur: 0, radius: [8, 12, 18, 26] },
  motion: { ease: 'cubic-bezier(.34,1.56,.64,1)', press: 90, pop: 180, celebrate: 420 },
  theme: {
    light: Object.fromEntries(Object.entries(L).map(([k, v]) => [k, { hex: v, oklch: channels(v) }])),
    dark: Object.fromEntries(Object.entries(D).map(([k, v]) => [k, { hex: v, oklch: channels(v) }])),
  },
  roles: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v.role])),
};

writeFileSync(OUT + 'wannabe-tokens.css', css);
writeFileSync(new URL('../src/styles/wannabe-tokens.css', import.meta.url).pathname, css);
writeFileSync(OUT + 'tokens.json', JSON.stringify(json, null, 2) + '\n');

/* ── proof ────────────────────────────────────────────────────────────── */
/*
 * Every pair the app actually renders. `min` is the WCAG floor: 4.5 for body
 * text, 3.0 only where the pairing is reserved for display-size type.
 * A failure here fails the build, because a contrast regression is a bug with
 * a number attached — there is no reason to discover it by eye later.
 */
const pairs = [
  // light — grounds and candy fills
  ['light', 'ink', 'paper'],
  ['light', 'ink', 'card'],
  ['light', 'ink', 'muted'],
  ['light', 'ink', 'secondary'],
  ['light', 'ink', 'lime'],
  ['light', 'ink', 'cyan'],
  ['light', 'ink', 'mango'],
  ['light', 'ink', 'mint'],
  ['light', 'ink', 'pink'],
  ['light', 'paper', 'grape'],
  ['light', 'ink', 'grape', 3.0],
  // light — the text ramp, all three steps must pass
  ['light', 'text2', 'paper'],
  ['light', 'text2', 'card'],
  ['light', 'textTertiary', 'paper'],
  ['light', 'textTertiary', 'card'],
  ['light', 'textTertiary', 'muted'],
  // light — candy as words
  ['light', 'limeInk', 'paper'],
  ['light', 'mangoInk', 'paper'],
  ['light', 'cyanInk', 'paper'],
  ['light', 'mintInk', 'paper'],
  ['light', 'grapeInk', 'paper'],
  ['light', 'dangerInk', 'paper'],
  ['light', 'onCandy', 'lime'],
  ['light', 'onGrape', 'grape'],
  ['light', 'onDanger', 'chili'],
  // dark — grounds. The muted/secondary pairs are the regression guard for the
  // sRGB-mix bug: both were light grey and cream text sat on them at 2.3:1.
  ['dark', 'ink', 'paper'],
  ['dark', 'ink', 'card'],
  ['dark', 'ink', 'muted'],
  ['dark', 'ink', 'secondary'],
  ['dark', 'text2', 'card'],
  ['dark', 'textTertiary', 'card'],
  ['dark', 'textTertiary', 'paper'],
  ['dark', 'textTertiary', 'muted'],
  // dark — candy, where most of it is brighter than the ground
  ['dark', 'lime', 'paper'],
  ['dark', 'cyan', 'paper'],
  ['dark', 'mango', 'paper'],
  ['dark', 'pink', 'paper'],
  ['dark', 'onCandy', 'lime'],
  ['dark', 'onGrape', 'grape'],
  ['dark', 'onStage', 'stage'],
  ['dark', 'onDanger', 'chili'],
  ['dark', 'dangerInk', 'card'],
  ['dark', 'grapeInk', 'card'],
];

console.log('pair'.padEnd(34), 'ratio', '  AA');
let failed = 0;
for (const [mode, a, b, min = 4.5] of pairs) {
  const m = mode === 'light' ? L : D;
  const r = ratio(m[a], m[b]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(
    `${mode} ${a} on ${b}`.padEnd(34),
    String(r).padStart(5),
    ok ? ' pass' : ` FAIL (needs ${min})`,
  );
}
if (failed) {
  console.error(`\n${failed} contrast pair(s) below AA — refusing to write tokens.`);
  process.exit(1);
}
console.log(`\nwrote wannabe-tokens.css (${Object.keys(L).length} tokens) + tokens.json`);
