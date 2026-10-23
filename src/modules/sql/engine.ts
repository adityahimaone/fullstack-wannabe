import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js/dist/sql-wasm.js';
import { readStore } from '@/lib/storage';
import { demoSchema, type ErdSchema } from '@/modules/erd/types';
import { generateSql } from '@/modules/erd/sql';
import { seedSchema } from '@/modules/erd/seeder';
import type { SeedSnapshot } from '@/modules/erd/store';
import { getDataset, type Dataset } from './datasets';

export interface QueryResult {
  columns: string[];
  rows: (string | number | null)[][];
  durationMs: number;
  rowsAffected: number;
  truncated: boolean;
}

export interface TableInfo {
  name: string;
  rows: number;
}

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

export function loadEngine(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
    });
  }
  return sqlJsPromise;
}

const cache = new Map<string, Database>();

export async function getDatabase(key: string, script: () => string): Promise<Database> {
  const cached = cache.get(key);
  if (cached) return cached;
  const SQL = await loadEngine();
  const db = new SQL.Database();
  db.run(script());
  cache.set(key, db);
  return db;
}

export function invalidate(key: string) {
  const db = cache.get(key);
  if (db) {
    db.close();
    cache.delete(key);
  }
}

export function invalidateAll() {
  cache.forEach((db) => db.close());
  cache.clear();
}

export async function datasetDatabase(dataset: Dataset): Promise<Database> {
  return getDatabase(`dataset:${dataset.id}`, dataset.buildScript);
}

export interface ErdDataset {
  key: string;
  name: string;
  script: string;
  tables: string[];
  totalRows: number;
}

/**
 * Build a queryable database from whatever the user designed in the ERD studio.
 * Execution always uses the SQLite dialect, regardless of the DDL preview dialect.
 */
export function erdDataset(): ErdDataset | null {
  const seed = readStore<SeedSnapshot | null>('erd:seed', null);
  const schema = readStore<ErdSchema>('erd:schema', demoSchema());
  if (!seed || schema.tables.length === 0) return null;

  const execSchema: ErdSchema = { ...schema, dialect: 'sqlite' };
  const ddl = generateSql(execSchema);
  const data = seedSchema(execSchema);

  return {
    key: `erd:${seed.generatedAt}`,
    name: 'My schema',
    script: `${ddl}\n\n${data.sql}`,
    tables: data.tables,
    totalRows: data.totalRows,
  };
}

function toPlain(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) {
    try {
      return new TextDecoder().decode(value);
    } catch {
      return '[blob]';
    }
  }
  return String(value);
}

const MAX_ROWS = 400;

export function execSql(db: Database, sql: string): QueryResult {
  const started = performance.now();
  const results = db.exec(sql);
  const durationMs = performance.now() - started;
  const rowsAffected = db.getRowsModified();

  const last = results[results.length - 1];
  if (!last) {
    return { columns: [], rows: [], durationMs, rowsAffected, truncated: false };
  }

  const rows = last.values.map((row) => row.map(toPlain));
  const truncated = rows.length > MAX_ROWS;

  return {
    columns: last.columns,
    rows: truncated ? rows.slice(0, MAX_ROWS) : rows,
    durationMs,
    rowsAffected,
    truncated,
  };
}

export function listTables(db: Database): TableInfo[] {
  try {
    const res = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    const names = (res[0]?.values ?? []).map((r) => String(r[0]));
    return names.map((name) => {
      let count = 0;
      try {
        const c = db.exec(`SELECT COUNT(*) FROM "${name}"`);
        count = Number(c[0]?.values?.[0]?.[0] ?? 0);
      } catch {
        count = 0;
      }
      return { name, rows: count };
    });
  } catch {
    return [];
  }
}

export function describeTable(db: Database, table: string) {
  try {
    const res = db.exec(`PRAGMA table_info("${table}")`);
    return (res[0]?.values ?? []).map((row) => ({
      name: String(row[1]),
      type: String(row[2] ?? ''),
      notNull: Number(row[3]) === 1,
      pk: Number(row[5]) === 1,
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Result comparison — used by the quest validator                     */
/* ------------------------------------------------------------------ */

function normalize(value: string | number | null): string {
  if (value === null) return '∅';
  if (typeof value === 'number') {
    const rounded = Math.round(value * 10_000) / 10_000;
    return `#${rounded}`;
  }
  const trimmed = value.trim();
  const asNumber = Number(trimmed);
  if (trimmed !== '' && !Number.isNaN(asNumber) && /^-?\d*\.?\d+$/.test(trimmed)) {
    return `#${Math.round(asNumber * 10_000) / 10_000}`;
  }
  return trimmed;
}

export interface CompareOutcome {
  ok: boolean;
  message: string;
}

export function compareResults(actual: QueryResult, expected: QueryResult): CompareOutcome {
  if (actual.columns.length !== expected.columns.length) {
    return {
      ok: false,
      message: `Expected ${expected.columns.length} column${expected.columns.length === 1 ? '' : 's'}, got ${actual.columns.length}.`,
    };
  }
  if (actual.rows.length !== expected.rows.length) {
    return {
      ok: false,
      message: `Expected ${expected.rows.length} row${expected.rows.length === 1 ? '' : 's'}, got ${actual.rows.length}.`,
    };
  }

  const actualSet = new Map<string, number>();
  for (const row of actual.rows) {
    const key = row.map(normalize).join('␟');
    actualSet.set(key, (actualSet.get(key) ?? 0) + 1);
  }

  for (const row of expected.rows) {
    const key = row.map(normalize).join('␟');
    const count = actualSet.get(key) ?? 0;
    if (count === 0) {
      return { ok: false, message: 'The rows are close, but at least one expected row is missing or has different values.' };
    }
    actualSet.set(key, count - 1);
  }

  return { ok: true, message: 'Result set matches.' };
}

export function detectTables(sql: string, available: string[]): string[] {
  const lower = sql.toLowerCase();
  return available.filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(lower));
}

export { getDataset };
