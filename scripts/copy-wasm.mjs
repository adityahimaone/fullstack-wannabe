import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(process.cwd());
const src = resolve(root, 'node_modules/sql.js/dist/sql-wasm.wasm');
const destDir = resolve(root, 'public');
const dest = resolve(destDir, 'sql-wasm.wasm');

try {
  if (!existsSync(src)) {
    console.warn('[copy-wasm] sql.js wasm not found, skipping.');
    process.exit(0);
  }
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
  console.log('[copy-wasm] sql-wasm.wasm -> public/');
} catch (err) {
  console.warn('[copy-wasm] failed:', err);
}
