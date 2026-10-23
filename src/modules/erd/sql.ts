import type { ColumnType, Dialect, ErdColumn, ErdRelation, ErdSchema, ErdTable } from './types';

export interface PhysicalColumn {
  name: string;
  type: ColumnType;
  length?: number;
  precision?: number;
  scale?: number;
  primaryKey: boolean;
  unique: boolean;
  notNull: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  /** set when this column is a foreign key */
  references?: { table: string; column: string; onDelete: string; onUpdate: string };
  originColumnId?: string;
}

export interface PhysicalTable {
  /** physical SQL name (junction tables get a synthesized name) */
  name: string;
  tableId: string;
  kind: 'entity' | 'junction';
  columns: PhysicalColumn[];
  uniqueKeys: string[][];
  compositePrimaryKey?: string[];
}

export function quoteIdent(name: string, dialect: Dialect) {
  return dialect === 'mysql' ? `\`${name}\`` : `"${name}"`;
}

function singular(name: string) {
  if (name.endsWith('ies')) return `${name.slice(0, -3)}y`;
  if (name.endsWith('ses')) return name.slice(0, -2);
  if (name.endsWith('s')) return name.slice(0, -1);
  return name;
}

function junctionName(source: string, target: string, taken: Set<string>) {
  let base = `${source}_${target}`;
  if (base.length > 52) base = `${singular(source)}_${singular(target)}`;
  let name = base;
  let i = 2;
  while (taken.has(name)) {
    name = `${base}_${i++}`;
  }
  return name;
}

/** Flatten the logical ERD into the physical tables that the SQL compiler and seeder both use. */
export function resolvePhysicalTables(schema: ErdSchema): PhysicalTable[] {
  const tables = schema.tables.map<PhysicalTable>((table) => ({
    name: table.name,
    tableId: table.id,
    kind: 'entity',
    columns: table.columns.map((c) => ({
      name: c.name,
      type: c.type,
      length: c.length,
      precision: c.precision,
      scale: c.scale,
      primaryKey: c.primaryKey,
      unique: c.unique,
      notNull: c.notNull || c.primaryKey,
      autoIncrement: c.autoIncrement,
      defaultValue: c.defaultValue,
      originColumnId: c.id,
    })),
    uniqueKeys: [],
  }));

  const byTableId = new Map(tables.map((t) => [t.tableId, t]));
  const takenNames = new Set(tables.map((t) => t.name));

  for (const rel of schema.relations) {
    const source = byTableId.get(rel.sourceTableId);
    const target = byTableId.get(rel.targetTableId);
    if (!source || !target) continue;

    if (rel.kind === 'N:M') {
      const name = junctionName(source.name, target.name, takenNames);
      takenNames.add(name);
      const leftCol = `${singular(source.name)}_id`;
      const rightCol = `${singular(target.name)}_id`;
      const leftType = source.columns.find((c) => c.name === source.columns.find((x) => x.primaryKey)?.name);
      const rightType = target.columns.find((c) => c.name === target.columns.find((x) => x.primaryKey)?.name);
      tables.push({
        name,
        tableId: `junction:${rel.id}`,
        kind: 'junction',
        columns: [
          {
            name: leftCol,
            type: leftType?.type ?? 'BIGINT',
            primaryKey: true,
            unique: false,
            notNull: true,
            autoIncrement: false,
            references: {
              table: source.name,
              column: rel.sourceColumnId ? colName(source, rel.sourceColumnId) : 'id',
              onDelete: rel.onDelete,
              onUpdate: rel.onUpdate,
            },
          },
          {
            name: rightCol,
            type: rightType?.type ?? 'BIGINT',
            primaryKey: true,
            unique: false,
            notNull: true,
            autoIncrement: false,
            references: {
              table: target.name,
              column: rel.targetColumnId ? colName(target, rel.targetColumnId) : 'id',
              onDelete: rel.onDelete,
              onUpdate: rel.onUpdate,
            },
          },
        ],
        uniqueKeys: [[leftCol, rightCol]],
        compositePrimaryKey: [leftCol, rightCol],
      });
      continue;
    }

    // 1:N and 1:1 — attach FK on the "many" side (source for 1:N, source for 1:1 too)
    const sourceCol = source.columns.find((c) => c.name === colName(source, rel.sourceColumnId));
    if (!sourceCol) continue;
    sourceCol.references = {
      table: target.name,
      column: colName(target, rel.targetColumnId),
      onDelete: rel.onDelete,
      onUpdate: rel.onUpdate,
    };
    if (rel.kind === '1:1') sourceCol.unique = true;
  }

  return tables;
}

function colName(table: PhysicalTable, columnId: string) {
  return table.columns.find((c) => c.originColumnId === columnId)?.name ?? 'id';
}

export function sqlType(col: PhysicalColumn, dialect: Dialect): string {
  switch (col.type) {
    case 'INT':
      return dialect === 'postgres' ? 'INTEGER' : 'INT';
    case 'BIGINT':
      if (dialect === 'sqlite' && col.autoIncrement) return 'INTEGER';
      return 'BIGINT';
    case 'VARCHAR':
      if (dialect === 'sqlite') return 'TEXT';
      return `VARCHAR(${col.length ?? 255})`;
    case 'TEXT':
      return 'TEXT';
    case 'BOOLEAN':
      return dialect === 'mysql' ? 'TINYINT(1)' : dialect === 'sqlite' ? 'INTEGER' : 'BOOLEAN';
    case 'TIMESTAMP':
      return dialect === 'mysql' ? 'DATETIME' : 'TIMESTAMP';
    case 'DATE':
      return 'DATE';
    case 'DECIMAL':
      return `DECIMAL(${col.precision ?? 10}, ${col.scale ?? 2})`;
    case 'UUID':
      if (dialect === 'postgres') return 'UUID';
      if (dialect === 'mysql') return 'CHAR(36)';
      return 'TEXT';
    case 'JSON':
      if (dialect === 'postgres') return 'JSONB';
      if (dialect === 'sqlite') return 'TEXT';
      return 'JSON';
    default:
      return 'TEXT';
  }
}

function defaultSql(col: PhysicalColumn, dialect: Dialect): string | null {
  if (col.autoIncrement) return null;
  if (col.defaultValue === undefined || col.defaultValue === '') return null;
  let value = col.defaultValue.trim();
  if (col.type === 'BOOLEAN' && dialect === 'sqlite') {
    if (value.toLowerCase() === 'true') value = '1';
    if (value.toLowerCase() === 'false') value = '0';
  }
  if (col.type === 'UUID' && dialect === 'postgres' && /uuid/i.test(value)) {
    return 'gen_random_uuid()';
  }
  return value;
}

function columnDefinition(col: PhysicalColumn, dialect: Dialect, inlineRef = false): string {
  const q = (n: string) => quoteIdent(n, dialect);
  const parts: string[] = [q(col.name)];

  if (col.autoIncrement && col.primaryKey) {
    if (dialect === 'postgres') parts.push(col.type === 'INT' ? 'SERIAL' : 'BIGSERIAL');
    else if (dialect === 'sqlite') parts.push('INTEGER');
    else parts.push(sqlType(col, dialect));
  } else {
    parts.push(sqlType(col, dialect));
  }

  if (col.primaryKey && (dialect === 'sqlite' || col.autoIncrement)) parts.push('PRIMARY KEY');
  if (dialect === 'mysql' && col.autoIncrement) parts.push('AUTO_INCREMENT');
  if (dialect === 'sqlite' && col.autoIncrement) parts.push('AUTOINCREMENT');
  if (col.notNull && !(col.primaryKey && dialect === 'sqlite')) parts.push('NOT NULL');
  if (col.unique && !col.primaryKey) parts.push('UNIQUE');

  const def = defaultSql(col, dialect);
  if (def) parts.push(`DEFAULT ${def}`);

  if (inlineRef && col.references) {
    parts.push(
      `REFERENCES ${q(col.references.table)}(${q(col.references.column)}) ON DELETE ${col.references.onDelete} ON UPDATE ${col.references.onUpdate}`,
    );
  }

  return parts.join(' ');
}

/** Compile the ERD into a full, human-readable SQL script. */
export function generateSql(schema: ErdSchema): string {
  const dialect = schema.dialect;
  const tables = resolvePhysicalTables(schema);
  const q = (n: string) => quoteIdent(n, dialect);
  const out: string[] = [
    `-- Fullstack Wannabe · generated DDL`,
    `-- dialect: ${dialect}   tables: ${tables.length}   relations: ${schema.relations.length}`,
    `-- ${new Date().toISOString()}`,
    '',
  ];

  if (dialect === 'postgres') out.push('CREATE EXTENSION IF NOT EXISTS "pgcrypto";', '');

  for (const table of tables) {
    const lines: string[] = [];
    for (const col of table.columns) {
      lines.push(`  ${columnDefinition(col, dialect, dialect === 'sqlite')}`);
    }
    if (table.compositePrimaryKey?.length) {
      lines.push(`  PRIMARY KEY (${table.compositePrimaryKey.map(q).join(', ')})`);
    }
    for (const key of table.uniqueKeys) {
      if (table.compositePrimaryKey && key.length === table.compositePrimaryKey.length) continue;
      lines.push(`  UNIQUE (${key.map(q).join(', ')})`);
    }

    out.push(`CREATE TABLE ${q(table.name)} (`);
    out.push(lines.join(',\n'));
    out.push(');', '');
  }

  if (dialect !== 'sqlite') {
    for (const table of tables) {
      for (const col of table.columns) {
        if (!col.references) continue;
        const name = `fk_${table.name}_${col.name}`;
        out.push(
          `ALTER TABLE ${q(table.name)}`,
          `  ADD CONSTRAINT ${q(name)}`,
          `  FOREIGN KEY (${q(col.name)}) REFERENCES ${q(col.references.table)} (${q(col.references.column)})`,
          `  ON DELETE ${col.references.onDelete} ON UPDATE ${col.references.onUpdate};`,
          '',
        );
      }
    }
  }

  for (const table of tables) {
    for (const col of table.columns) {
      if (!col.references) continue;
      const indexName = `idx_${table.name}_${col.name}`;
      out.push(`CREATE INDEX ${q(indexName)} ON ${q(table.name)} (${q(col.name)});`);
    }
  }

  if (out[out.length - 1] !== '') out.push('');
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Individual statements, ready to hand to the in-browser engine. */
export function schemaStatements(schema: ErdSchema): string[] {
  const sql = generateSql(schema);
  return sql
    .split(/;\s*\n/)
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter(Boolean)
    .map((s) => `${s};`);
}

export function findTable(schema: ErdSchema, tableId: string): ErdTable | undefined {
  return schema.tables.find((t) => t.id === tableId);
}

export function findColumn(table: ErdTable | undefined, columnId: string): ErdColumn | undefined {
  return table?.columns.find((c) => c.id === columnId);
}

export function relationLabel(rel: ErdRelation, schema: ErdSchema) {
  const s = findTable(schema, rel.sourceTableId);
  const t = findTable(schema, rel.targetTableId);
  return `${s?.name ?? '?'} → ${t?.name ?? '?'}`;
}

export function schemaStats(schema: ErdSchema) {
  const tables = resolvePhysicalTables(schema);
  return {
    tables: tables.length,
    entities: schema.tables.length,
    columns: tables.reduce((n, t) => n + t.columns.length, 0),
    relations: schema.relations.length,
  };
}
