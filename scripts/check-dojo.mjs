/**
 * Integrity check for the Polyglot Dojo challenge bank.
 *
 * Every challenge ships a reference solution, and the app grades the learner by
 * comparing their output against it. So the reference has to actually run. This
 * script executes each `mode: 'run'` solution through the exact same contract the
 * worker uses (sucrase transpile + `new Function`), and verifies the static
 * challenges satisfy their own `must` / `mustNot` patterns.
 *
 * Run with: npm run check:dojo
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import sucrase from 'sucrase';

const { transform } = sucrase;
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const src = fs.readFileSync(path.join(root, 'src/modules/dojo/challenges.ts'), 'utf8');
const js = transform(src, { transforms: ['typescript', 'imports'], disableESTransforms: true }).code;

const mod = { exports: {} };
new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
const { CHALLENGES, DIFFICULTIES, staticCheck } = mod.exports;

/** Mirrors src/modules/dojo/runner.worker.ts */
async function exec(code, input, ts) {
  const source = ts ? transform(code, { transforms: ['typescript'], disableESTransforms: true }).code : code;
  const factory = new Function(
    'data',
    `"use strict";\n${source}\n;return typeof solve === 'function' ? solve(data) : undefined;`,
  );
  const result = await factory(input);
  return JSON.parse(JSON.stringify(result ?? null));
}

const problems = [];
const stacks = ['go', 'node', 'frontend', 'php'];

console.log(`\nPolyglot Dojo — ${CHALLENGES.length} challenges\n`);
for (const stack of stacks) {
  const items = CHALLENGES.filter((c) => c.stack === stack);
  const dist = DIFFICULTIES.map((d) => `${d.id} ${items.filter((c) => c.difficulty === d.id).length}`).join(' · ');
  console.log(`  ${stack.padEnd(9)} ${String(items.length).padStart(2)}   ${dist}`);
  for (const d of DIFFICULTIES) {
    if (!items.some((c) => c.difficulty === d.id)) problems.push(`${stack} has no ${d.id} challenge`);
  }
}

const ids = CHALLENGES.map((c) => c.id);
ids.forEach((id, i) => {
  if (ids.indexOf(id) !== i) problems.push(`duplicate challenge id: ${id}`);
});

const runnable = CHALLENGES.filter((c) => c.mode === 'run');
console.log(`\nExecuting ${runnable.length} reference solutions…`);
for (const c of runnable) {
  try {
    const out = await exec(c.solution, c.payload, c.ts);
    if (out === null || out === undefined) problems.push(`${c.id}: reference solution returned ${out}`);
  } catch (err) {
    problems.push(`${c.id}: reference solution threw ${err.name}: ${err.message}`);
  }
}

const statics = CHALLENGES.filter((c) => c.mode === 'static');
console.log(`Grading ${statics.length} static references with the real staticCheck()…`);
for (const c of statics) {
  const verdict = staticCheck(c.solution, c);
  if (!verdict.ok) problems.push(`${c.id}: its own reference solution is rejected — "${verdict.message}"`);

  // The starter must not already pass, or the challenge is free XP.
  const freebie = staticCheck(c.starter, c);
  if (freebie.ok) problems.push(`${c.id}: the untouched starter already passes`);
}

console.log(`Checking ${CHALLENGES.length} starters differ from their solution…`);
for (const c of CHALLENGES) {
  if (c.starter.trim() === c.solution.trim()) problems.push(`${c.id}: starter equals solution (free XP)`);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.log(`  · ${p}`));
  process.exit(1);
}
console.log('\nAll challenge checks passed.\n');
