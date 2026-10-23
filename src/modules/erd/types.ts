export type Dialect = 'postgres' | 'mysql' | 'sqlite';

export type ColumnType =
  | 'INT'
  | 'BIGINT'
  | 'VARCHAR'
  | 'TEXT'
  | 'BOOLEAN'
  | 'TIMESTAMP'
  | 'UUID'
  | 'DECIMAL'
  | 'JSON'
  | 'DATE';

export const COLUMN_TYPES: { value: ColumnType; label: string }[] = [
  { value: 'INT', label: 'INT' },
  { value: 'BIGINT', label: 'BIGINT' },
  { value: 'VARCHAR', label: 'VARCHAR' },
  { value: 'TEXT', label: 'TEXT' },
  { value: 'BOOLEAN', label: 'BOOLEAN' },
  { value: 'TIMESTAMP', label: 'TIMESTAMP' },
  { value: 'DATE', label: 'DATE' },
  { value: 'DECIMAL', label: 'DECIMAL' },
  { value: 'UUID', label: 'UUID' },
  { value: 'JSON', label: 'JSON' },
];

export interface ErdColumn {
  id: string;
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
}

export interface ErdTable {
  id: string;
  name: string;
  columns: ErdColumn[];
  x: number;
  y: number;
  color?: 'lime' | 'amber' | 'violet' | 'cyan';
}

export type RelationKind = '1:1' | '1:N' | 'N:M';
export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

export interface ErdRelation {
  id: string;
  kind: RelationKind;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  onDelete: ReferentialAction;
  onUpdate: ReferentialAction;
}

export interface ErdSchema {
  tables: ErdTable[];
  relations: ErdRelation[];
  dialect: Dialect;
}

export const DIALECTS: { value: Dialect; label: string; hint: string }[] = [
  { value: 'postgres', label: 'PostgreSQL', hint: 'SERIAL · JSONB · gen_random_uuid()' },
  { value: 'mysql', label: 'MySQL', hint: 'AUTO_INCREMENT · JSON · backticks' },
  { value: 'sqlite', label: 'SQLite', hint: 'INTEGER PK · inline REFERENCES' },
];

export function emptySchema(): ErdSchema {
  return { tables: [], relations: [], dialect: 'postgres' };
}

/** A small demo schema so the canvas is never a blank page. */
export function demoSchema(): ErdSchema {
  const usersId = 'tbl_users';
  const ordersId = 'tbl_orders';
  const productsId = 'tbl_products';

  return {
    dialect: 'postgres',
    tables: [
      {
        id: usersId,
        name: 'users',
        x: 40,
        y: 60,
        color: 'lime',
        columns: [
          { id: 'u_id', name: 'id', type: 'BIGINT', primaryKey: true, unique: true, notNull: true, autoIncrement: true },
          { id: 'u_email', name: 'email', type: 'VARCHAR', length: 160, primaryKey: false, unique: true, notNull: true, autoIncrement: false },
          { id: 'u_name', name: 'full_name', type: 'VARCHAR', length: 120, primaryKey: false, unique: false, notNull: true, autoIncrement: false },
          { id: 'u_active', name: 'is_active', type: 'BOOLEAN', primaryKey: false, unique: false, notNull: true, autoIncrement: false, defaultValue: 'true' },
          { id: 'u_created', name: 'created_at', type: 'TIMESTAMP', primaryKey: false, unique: false, notNull: true, autoIncrement: false, defaultValue: 'CURRENT_TIMESTAMP' },
        ],
      },
      {
        id: ordersId,
        name: 'orders',
        x: 400,
        y: 40,
        color: 'amber',
        columns: [
          { id: 'o_id', name: 'id', type: 'BIGINT', primaryKey: true, unique: true, notNull: true, autoIncrement: true },
          { id: 'o_user', name: 'user_id', type: 'BIGINT', primaryKey: false, unique: false, notNull: true, autoIncrement: false },
          { id: 'o_status', name: 'status', type: 'VARCHAR', length: 24, primaryKey: false, unique: false, notNull: true, autoIncrement: false, defaultValue: "'pending'" },
          { id: 'o_total', name: 'total_amount', type: 'DECIMAL', precision: 10, scale: 2, primaryKey: false, unique: false, notNull: true, autoIncrement: false, defaultValue: '0' },
          { id: 'o_created', name: 'created_at', type: 'TIMESTAMP', primaryKey: false, unique: false, notNull: true, autoIncrement: false, defaultValue: 'CURRENT_TIMESTAMP' },
        ],
      },
      {
        id: productsId,
        name: 'products',
        x: 400,
        y: 300,
        color: 'violet',
        columns: [
          { id: 'p_id', name: 'id', type: 'BIGINT', primaryKey: true, unique: true, notNull: true, autoIncrement: true },
          { id: 'p_sku', name: 'sku', type: 'VARCHAR', length: 40, primaryKey: false, unique: true, notNull: true, autoIncrement: false },
          { id: 'p_name', name: 'name', type: 'VARCHAR', length: 140, primaryKey: false, unique: false, notNull: true, autoIncrement: false },
          { id: 'p_price', name: 'price', type: 'DECIMAL', precision: 10, scale: 2, primaryKey: false, unique: false, notNull: true, autoIncrement: false },
        ],
      },
    ],
    relations: [
      {
        id: 'rel_orders_users',
        kind: '1:N',
        sourceTableId: ordersId,
        sourceColumnId: 'o_user',
        targetTableId: usersId,
        targetColumnId: 'u_id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION',
      },
      {
        id: 'rel_orders_products',
        kind: 'N:M',
        sourceTableId: ordersId,
        sourceColumnId: 'o_id',
        targetTableId: productsId,
        targetColumnId: 'p_id',
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION',
      },
    ],
  };
}
