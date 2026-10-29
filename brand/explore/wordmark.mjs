// Monoline wordmark generator. One hand, one weight, no <text>.
// Letters are drawn on a 40-unit baseline, 18-unit x-height, 12-unit ascender.
const X = 18, BASE = 40, ASC = 12;

// each entry: [advance, [path strings]]
const L = {
  f: [13, ['M11,14 Q4,14 4,22 V40', 'M0,23 H11']],
  u: [15, ['M3,22 V32 A4.5 4.5 0 0 0 12,32 V22']],
  l: [5, ['M2.5,12 V40']],
  s: [13, [
    'M11,26 Q11,22 6.5,22 Q2,22 2,26 Q2,29.5 6.5,30 Q11,30.5 11,34.5 Q11,40 6.5,40 Q2,40 2,36',
  ]],
  t: [10, ['M4,15 V34 Q4,40 9,40', 'M0.5,23 H9.5']],
  a: [14, [
    'M11,22 V40',
    'M11,30 Q11,22 6,22 Q1.5,22 1.5,31 Q1.5,40 6,40 Q11,40 11,32',
  ]],
  c: [13, ['M11,26 Q11,22 6.5,22 Q1.5,22 1.5,31 Q1.5,40 6.5,40 Q11,40 11,36']],
  k: [14, ['M2,12 V40', 'M12,22 L4,31', 'M6.5,28 L12.5,40']],
  w: [21, ['M1.5,22 L5.4,40 L10.2,28.5 L15,40 L18.9,22']],
  n: [15, ['M2.5,22 V40', 'M2.5,27 Q2.5,22 7.5,22 Q12.5,22 12.5,27 V40']],
  b: [14, [
    'M2.5,12 V40',
    'M2.5,30 Q2.5,22 7.5,22 Q12.5,22 12.5,31 Q12.5,40 7.5,40 Q2.5,40 2.5,32',
  ]],
  e: [13, [
    'M1.5,31 H11.5 Q11.5,22 6.5,22 Q1.5,22 1.5,31 Q1.5,40 7,40 Q10.5,40 11.5,37',
  ]],
};

const TRACK = 3.6;
const SPACE = 9;

function word(str, startX) {
  let x = startX;
  const out = [];
  for (const ch of str) {
    const [adv, paths] = L[ch];
    for (const p of paths) out.push({ d: shift(p, x), ch });
    x += adv + TRACK;
  }
  return { paths: out, end: x - TRACK };
}

// shift every absolute coordinate in a path by dx (all coords are absolute; H/V take one value)
function shift(d, dx) {
  return d.replace(/([MLQVAH])([^MLQVAH]*)/g, (m, cmd, args) => {
    const nums = args.trim().split(/[\s,]+/).filter(Boolean);
    if (!nums.length) return m;
    const map = {
      M: (n) => [n[0] + dx, n[1]], L: (n) => [n[0] + dx, n[1]],
      Q: (n) => [n[0] + dx, n[1], n[2] + dx, n[3]],
      A: (n) => [n[0], n[1], n[2], n[3], n[4], n[5] + dx, n[6]],
      H: (n) => [n[0] + dx], V: (n) => [n[0]],
    }[cmd];
    return cmd + map(nums.map(Number)).join(' ');
  });
}

const w1 = word('fullstack', 4);
const w2 = word('wannabe', w1.end + SPACE);
const total = w2.end + 4;

const path = (list, color, stroke = 5.8) =>
  list.map((p) => `<path d="${p.d}" />`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} 52" role="img" aria-label="fullstack wannabe">
  <g transform="skewX(-6)" fill="none" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="#1B1626">${path(w1.paths)}</g>
    <g stroke="#FF4D8D">${path(w2.paths)}</g>
  </g>
</svg>
`;
console.log(svg);
console.error('width', total);
