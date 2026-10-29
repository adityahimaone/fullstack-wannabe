// sRGB -> OKLCH + WCAG contrast. No deps. Used to generate the token file honestly.
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const hexToRgb = (h) => {
  h = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
function oklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  const f = (n) => Number(n.toFixed(3));
  return `oklch(${f(L)} ${f(C)} ${H.toFixed(1)})`;
}
const lum = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return ((x + 0.05) / (y + 0.05)).toFixed(2);
};

const c = {
  ink: '#1B1626',
  paper: '#FFF6E5',
  card: '#FFFDF7',
  pink: '#FF4D8D',
  grape: '#7B5CFF',
  cyan: '#2ED3F0',
  lime: '#C6F24E',
  mango: '#FFB020',
  tangerine: '#FF6B35',
  mint: '#2ED3A6',
  night: '#171226',
  nightCard: '#241B36',
  nightEdge: '#FFF6E5',
};
for (const [k, v] of Object.entries(c)) console.log(k.padEnd(10), v, oklch(v));
console.log('');
const pairs = [
  ['ink', 'paper'], ['ink', 'card'], ['ink', 'lime'], ['ink', 'mango'], ['ink', 'cyan'],
  ['ink', 'mint'], ['ink', 'pink'], ['ink', 'grape'], ['ink', 'tangerine'],
  ['paper', 'grape'], ['paper', 'pink'], ['ink', 'night'],
];
for (const [a, b] of pairs) console.log(`${a}/${b}`.padEnd(18), contrast(c[a], c[b]));
