import type { ErdColumn, ErdSchema, ErdTable } from '@/modules/erd/types';
import { quoteIdent, sqlType } from '@/modules/erd/sql';

export interface CtxField {
  name: string;
  camel: string;
  go: string;
  ts: string;
  php: string;
  prisma: string;
  pg: string;
  raw: ErdColumn['type'];
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  pk: boolean;
}

export interface Ctx {
  table: string;
  model: string;
  plural: string;
  route: string;
  pk: string;
  pkGo: string;
  pkTs: string;
  pkPhp: string;
  pkRaw: ErdColumn['type'];
  fields: CtxField[];
  hasTimestamps: boolean;
}

export function pascal(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function camel(value: string): string {
  const p = pascal(value);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function singular(value: string): string {
  if (value.endsWith('ies')) return `${value.slice(0, -3)}y`;
  if (value.endsWith('ses')) return value.slice(0, -2);
  if (value.endsWith('s')) return value.slice(0, -1);
  return value;
}

export function goType(col: ErdColumn): string {
  switch (col.type) {
    case 'INT':
      return 'int';
    case 'BIGINT':
      return 'int64';
    case 'BOOLEAN':
      return 'bool';
    case 'DECIMAL':
      return 'float64';
    case 'TIMESTAMP':
    case 'DATE':
      return 'time.Time';
    case 'JSON':
      return 'map[string]any';
    default:
      return 'string';
  }
}

export function tsType(col: ErdColumn): string {
  switch (col.type) {
    case 'INT':
    case 'BIGINT':
    case 'DECIMAL':
      return 'number';
    case 'BOOLEAN':
      return 'boolean';
    case 'TIMESTAMP':
    case 'DATE':
      return 'Date';
    case 'JSON':
      return 'Record<string, unknown>';
    default:
      return 'string';
  }
}

export function phpType(col: ErdColumn): string {
  switch (col.type) {
    case 'INT':
    case 'BIGINT':
      return 'int';
    case 'BOOLEAN':
      return 'bool';
    case 'DECIMAL':
      return 'float';
    case 'TIMESTAMP':
    case 'DATE':
      return 'string';
    case 'JSON':
      return 'array';
    default:
      return 'string';
  }
}

export function prismaType(col: ErdColumn): string {
  switch (col.type) {
    case 'INT':
      return 'Int';
    case 'BIGINT':
      return 'BigInt';
    case 'BOOLEAN':
      return 'Boolean';
    case 'DECIMAL':
      return 'Decimal';
    case 'TIMESTAMP':
    case 'DATE':
      return 'DateTime';
    case 'JSON':
      return 'Json';
    default:
      return 'String';
  }
}

const FALLBACK: ErdTable = {
  id: 'fallback',
  name: 'users',
  x: 0,
  y: 0,
  color: 'lime',
  columns: [
    { id: 'f1', name: 'id', type: 'BIGINT', primaryKey: true, unique: true, notNull: true, autoIncrement: true },
    { id: 'f2', name: 'full_name', type: 'VARCHAR', length: 120, primaryKey: false, unique: false, notNull: true, autoIncrement: false },
    { id: 'f3', name: 'email', type: 'VARCHAR', length: 160, primaryKey: false, unique: true, notNull: true, autoIncrement: false },
    { id: 'f4', name: 'is_active', type: 'BOOLEAN', primaryKey: false, unique: false, notNull: true, autoIncrement: false },
    { id: 'f5', name: 'created_at', type: 'TIMESTAMP', primaryKey: false, unique: false, notNull: true, autoIncrement: false },
  ],
};

export function deriveContext(schema: ErdSchema): Ctx {
  const table = schema.tables.find((t) => t.columns.length > 0) ?? FALLBACK;
  const pkColumn = table.columns.find((c) => c.primaryKey) ?? table.columns[0];
  const model = pascal(singular(table.name));

  const fields: CtxField[] = table.columns
    .filter((c) => c.id !== pkColumn.id)
    .slice(0, 6)
    .map((col) => ({
      name: col.name,
      camel: camel(col.name),
      go: goType(col),
      ts: tsType(col),
      php: phpType(col),
      prisma: prismaType(col),
      pg: sqlType({ ...col, primaryKey: false }, 'postgres'),
      raw: col.type,
      length: col.length,
      precision: col.precision,
      scale: col.scale,
      nullable: !col.notNull,
      pk: false,
    }));

  return {
    table: table.name,
    model,
    plural: table.name,
    route: `/api/v1/${table.name}`,
    pk: pkColumn.name,
    pkGo: goType(pkColumn),
    pkTs: tsType(pkColumn),
    pkPhp: phpType(pkColumn),
    pkRaw: pkColumn.type,
    fields,
    hasTimestamps: table.columns.some((c) => /created_at|created/i.test(c.name)),
  };
}

/** A focused CREATE TABLE for the chosen entity, with FKs stripped to keep the snippet honest. */
export function migrationSql(schema: ErdSchema, ctx: Ctx): string {
  const table = schema.tables.find((t) => t.name === ctx.table) ?? FALLBACK;
  const q = (n: string) => quoteIdent(n, 'postgres');
  const lines = table.columns.map((col) => {
    const type = col.autoIncrement && col.primaryKey ? 'BIGSERIAL' : sqlType(col, 'postgres');
    const bits = [q(col.name), type];
    if (col.primaryKey) bits.push('PRIMARY KEY');
    if (col.notNull && !col.primaryKey) bits.push('NOT NULL');
    if (col.unique && !col.primaryKey) bits.push('UNIQUE');
    if (col.defaultValue && !col.autoIncrement) bits.push(`DEFAULT ${col.defaultValue}`);
    return `  ${bits.join(' ')}`;
  });

  return `-- migrations/000001_create_${ctx.table}.up.sql
-- up
CREATE TABLE ${q(ctx.table)} (
${lines.join(',\n')}
);

CREATE INDEX ${q(`idx_${ctx.table}_created_at`)} ON ${q(ctx.table)} (${q(ctx.hasTimestamps ? 'created_at' : ctx.pk)});

-- down
-- DROP TABLE ${q(ctx.table)};`;
}
