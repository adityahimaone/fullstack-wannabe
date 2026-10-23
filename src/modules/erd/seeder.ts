import { faker } from '@faker-js/faker';
import type { Dialect, ErdSchema } from './types';
import { quoteIdent, resolvePhysicalTables, type PhysicalColumn, type PhysicalTable } from './sql';

export interface SeedResult {
  sql: string;
  rowCounts: Record<string, number>;
  totalRows: number;
  tables: string[];
}

const ROW_TARGETS: Record<string, number> = {
  users: 24,
  orders: 60,
  products: 18,
  categories: 8,
  posts: 40,
  comments: 90,
  likes: 120,
  follows: 60,
  profiles: 24,
  heroes: 20,
  guilds: 6,
  quests: 14,
  inventory: 70,
  loot_drops: 90,
};

function rowsFor(table: PhysicalTable): number {
  if (table.kind === 'junction') return 70;
  return ROW_TARGETS[table.name] ?? 20;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function columnValue(col: PhysicalColumn, dialect: Dialect, index: number, seq: number) {
  const name = col.name.toLowerCase();

  if (col.type === 'BOOLEAN') {
    if (name.includes('active') || name.includes('verified')) return Math.random() > 0.2;
    return Math.random() > 0.45;
  }

  if (col.type === 'INT' || col.type === 'BIGINT') {
    if (name.endsWith('_id')) return 1;
    if (name.includes('qty') || name.includes('quantity') || name.includes('stock')) return faker.number.int({ min: 1, max: 12 });
    if (name.includes('level') || name.includes('rank')) return faker.number.int({ min: 1, max: 60 });
    if (name.includes('score') || name.includes('xp')) return faker.number.int({ min: 0, max: 5000 });
    if (name.includes('year')) return faker.number.int({ min: 2019, max: 2026 });
    return seq;
  }

  if (col.type === 'DECIMAL') {
    if (name.includes('price')) return Number(faker.commerce.price({ min: 4, max: 480, dec: 2 }));
    if (name.includes('total') || name.includes('amount')) return Number(faker.commerce.price({ min: 12, max: 1200, dec: 2 }));
    if (name.includes('rate') || name.includes('percent') || name.includes('discount')) {
      return Number(faker.number.float({ min: 0, max: 40, fractionDigits: 2 }));
    }
    return Number(faker.number.float({ min: 1, max: 999, fractionDigits: 2 }));
  }

  if (col.type === 'TIMESTAMP') {
    return faker.date.recent({ days: 120 }).toISOString().slice(0, 19).replace('T', ' ');
  }

  if (col.type === 'DATE') {
    return faker.date.recent({ days: 200 }).toISOString().slice(0, 10);
  }

  if (col.type === 'UUID') {
    return faker.string.uuid();
  }

  if (col.type === 'JSON') {
    return JSON.stringify({ tag: faker.word.noun(), weight: faker.number.int({ min: 1, max: 9 }) });
  }

  // VARCHAR / TEXT
  if (name.includes('email')) return faker.internet.email({ provider: 'example.dev' }).toLowerCase();
  if (name.includes('slug')) return faker.lorem.slug(2);
  if (name.includes('sku')) return faker.string.alphanumeric({ length: 8, casing: 'upper' });
  if (name.includes('phone')) return faker.phone.number({ style: 'national' });
  if (name.includes('url') || name.includes('avatar') || name.includes('image')) return faker.image.avatar();
  if (name.includes('status') || name.includes('state')) return pick(['pending', 'paid', 'shipped', 'delivered', 'cancelled']);
  if (name.includes('role')) return pick(['admin', 'editor', 'member', 'guest']);
  if (name.includes('title') || name.includes('subject')) return faker.lorem.sentence({ min: 3, max: 7 }).replace('.', '');
  if (name.includes('name')) return faker.person.fullName();
  if (name.includes('city')) return faker.location.city();
  if (name.includes('country')) return faker.location.country();
  if (name.includes('class') || name.includes('type') || name.includes('category')) return faker.word.noun();
  if (name.includes('body') || name.includes('content') || name.includes('description')) {
    return faker.lorem.sentences(2);
  }
  if (name.includes('token') || name.includes('code')) return faker.string.alphanumeric(10).toUpperCase();
  if (col.type === 'TEXT') return faker.lorem.sentences(2);
  return faker.word.words({ count: { min: 1, max: 3 } });
}

function literal(value: unknown, dialect: Dialect): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
  if (typeof value === 'boolean') {
    if (dialect === 'sqlite' || dialect === 'mysql') return value ? '1' : '0';
    return value ? 'TRUE' : 'FALSE';
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Deterministically-ish fill every physical table with believable rows and
 * return a single SQL script that both creates and populates the schema.
 */
export function seedSchema(schema: ErdSchema): SeedResult {
  faker.seed(2026);
  const dialect = schema.dialect;
  const q = (n: string) => quoteIdent(n, dialect);
  const tables = resolvePhysicalTables(schema);
  const entities = tables.filter((t) => t.kind === 'entity');
  const junctions = tables.filter((t) => t.kind === 'junction');

  const pkValues = new Map<string, (string | number)[]>();
  const statements: string[] = ['-- seeded data · fullstack wannabe'];
  const rowCounts: Record<string, number> = {};

  const insert = (table: PhysicalTable, rows: string[]) => {
    if (rows.length === 0) return;
    statements.push(
      `INSERT INTO ${q(table.name)} (${table.columns.map((c) => q(c.name)).join(', ')}) VALUES`,
      `${rows.join(',\n')};`,
    );
  };

  for (const table of [...entities, ...junctions]) {
    const count = rowsFor(table);
    const pkCol = table.columns.find((c) => c.primaryKey);
    const autoSeq = pkCol?.autoIncrement ?? false;
    const keys: (string | number)[] = [];
    const rows: string[] = [];

    for (let i = 0; i < count; i++) {
      const values: string[] = [];
      let seq = i + 1;
      for (const col of table.columns) {
        if (col.references) {
          const pool = pkValues.get(col.references.table) ?? [];
          values.push(literal(pool.length ? pick(pool) : 1, dialect));
          continue;
        }
        if (col.primaryKey && autoSeq) {
          values.push(String(seq));
          keys.push(seq);
          continue;
        }
        const v = columnValue(col, dialect, i, seq);
        if (col.primaryKey) keys.push(v as string | number);
        values.push(literal(v, dialect));
      }
      rows.push(`(${values.join(', ')})`);
      seq += 1;
    }

    if (!pkValues.has(table.name)) pkValues.set(table.name, []);
    pkValues.get(table.name)!.push(...keys);
    rowCounts[table.name] = count;
    insert(table, rows);
  }

  return {
    sql: statements.join('\n'),
    rowCounts,
    totalRows: Object.values(rowCounts).reduce((a, b) => a + b, 0),
    tables: tables.map((t) => t.name),
  };
}
