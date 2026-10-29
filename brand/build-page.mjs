/**
 * Builds the specimen pages: reads the generated SVGs into one sprite,
 * so the page never contains a second copy of the geometry.
 *
 *   node brand/build-page.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const BRAND = new URL('../public/brand/wannabe/', import.meta.url).pathname;

const SPRITE = {
  wanni: 'mark.svg',
  'wanni-rev': 'mark-reverse.svg',
  'wanni-mono': 'mark-mono.svg',
  compact: 'mark-compact.svg',
  glyph: 'glyph.svg',
  wm: 'wordmark.svg',
  spark: 'cast/spark.svg',
  bolt: 'cast/bolt.svg',
  flag: 'cast/flag.svg',
  dice: 'cast/dice.svg',
  gem: 'cast/gem.svg',
  key: 'cast/key.svg',
};

function symbol(key, file) {
  const raw = readFileSync(BRAND + file, 'utf8');
  const vb = raw.match(/viewBox="([^"]+)"/)[1];
  const body = raw
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    // namespace every internal id so ten symbols can coexist in one document
    .replace(/id="([^"]+)"/g, (_, id) => `id="${id}-${key}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}-${key})`);
  return `<symbol id="${key}" viewBox="${vb}" fill="none">${body}</symbol>`;
}

const sprite =
  '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" ' +
  'style="position:absolute;width:0;height:0;overflow:hidden">' +
  Object.entries(SPRITE).map(([k, f]) => symbol(k, f)).join('') +
  '</svg>';

const pages = [
  ['design-system.template.html', 'design-system.html'],
  ['brandkit.template.html', 'brandkit.html'],
];

for (const [src, out] of pages) {
  let html;
  try {
    html = readFileSync(new URL(src, import.meta.url), 'utf8');
  } catch {
    continue;
  }
  const missing = [...html.matchAll(/<use href="#([\w-]+)"/g)]
    .map((m) => m[1])
    .filter((id) => !(id in SPRITE));
  if (missing.length) throw new Error(`${src}: unknown symbol(s) ${[...new Set(missing)].join(', ')}`);
  const built = html.replace('<!--@sprite-->', sprite);
  writeFileSync(new URL(out, import.meta.url), built);

  // A second copy lands in public/ so the app can link to it from /design-system.
  // The specimen is fully self-contained (inline tokens + inline sprite); the only
  // path that has to move is the favicon, which sits next door once it is served.
  writeFileSync(
    new URL(`../public/brand/${out}`, import.meta.url),
    built.replaceAll('../public/brand/wannabe/', 'wannabe/'),
  );

  console.log(`${out} ← ${src} · ${Object.keys(SPRITE).length} symbols (+ public/brand/${out})`);
}
