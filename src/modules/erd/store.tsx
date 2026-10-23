import * as React from 'react';
import { usePersistentState, readStore, writeStore } from '@/lib/storage';
import { uid } from '@/lib/utils';
import {
  demoSchema,
  type ColumnType,
  type Dialect,
  type ErdColumn,
  type ErdRelation,
  type ErdSchema,
  type ErdTable,
  type RelationKind,
  type ReferentialAction,
} from './types';
import { seedSchema, type SeedResult } from './seeder';

const STORAGE_KEY = 'erd:schema';
const SEED_KEY = 'erd:seed';

export interface SeedSnapshot extends SeedResult {
  generatedAt: string;
  dialect: Dialect;
}

interface ErdContextValue {
  schema: ErdSchema;
  seed: SeedSnapshot | null;
  addTable: (name?: string) => string;
  updateTable: (id: string, patch: Partial<Omit<ErdTable, 'id' | 'columns'>>) => void;
  removeTable: (id: string) => void;
  moveTable: (id: string, x: number, y: number) => void;
  addColumn: (tableId: string) => void;
  updateColumn: (tableId: string, columnId: string, patch: Partial<ErdColumn>) => void;
  removeColumn: (tableId: string, columnId: string) => void;
  addRelation: (input: {
    sourceTableId: string;
    sourceColumnId: string;
    targetTableId: string;
    targetColumnId: string;
    kind: RelationKind;
  }) => void;
  updateRelation: (id: string, patch: Partial<ErdRelation>) => void;
  removeRelation: (id: string) => void;
  setDialect: (dialect: Dialect) => void;
  loadDemo: () => void;
  clearAll: () => void;
  runSeed: () => SeedSnapshot;
  clearSeed: () => void;
}

const ErdContext = React.createContext<ErdContextValue | null>(null);

function newColumn(name: string, type: ColumnType = 'VARCHAR', overrides: Partial<ErdColumn> = {}): ErdColumn {
  return {
    id: uid('col'),
    name,
    type,
    length: type === 'VARCHAR' ? 120 : undefined,
    precision: type === 'DECIMAL' ? 10 : undefined,
    scale: type === 'DECIMAL' ? 2 : undefined,
    primaryKey: false,
    unique: false,
    notNull: false,
    autoIncrement: false,
    ...overrides,
  };
}

function uniqueName(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

export function ErdProvider({ children }: { children: React.ReactNode }) {
  const [schema, setSchema] = usePersistentState<ErdSchema>(STORAGE_KEY, demoSchema());
  const [seed, setSeed] = React.useState<SeedSnapshot | null>(() => readStore<SeedSnapshot | null>(SEED_KEY, null));

  const addTable = React.useCallback(
    (name?: string) => {
      const id = uid('tbl');
      setSchema((prev) => {
        const tableName = uniqueName(
          name ?? `table_${prev.tables.length + 1}`,
          prev.tables.map((t) => t.name),
        );
        const offset = prev.tables.length % 4;
        return {
          ...prev,
          tables: [
            ...prev.tables,
            {
              id,
              name: tableName,
              x: 60 + offset * 70,
              y: 60 + offset * 90,
              color: (['lime', 'amber', 'violet', 'cyan'] as const)[prev.tables.length % 4],
              columns: [
                newColumn('id', 'BIGINT', {
                  primaryKey: true,
                  unique: true,
                  notNull: true,
                  autoIncrement: true,
                }),
                newColumn('created_at', 'TIMESTAMP', { defaultValue: 'CURRENT_TIMESTAMP' }),
              ],
            },
          ],
        };
      });
      return id;
    },
    [setSchema],
  );

  const updateTable = React.useCallback<ErdContextValue['updateTable']>(
    (id, patch) => {
      setSchema((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => {
          if (t.id !== id) return t;
          if (patch.name) {
            const taken = prev.tables.filter((x) => x.id !== id).map((x) => x.name);
            const safe = taken.includes(patch.name) ? uniqueName(patch.name, taken) : patch.name;
            return { ...t, ...patch, name: safe.replace(/\s+/g, '_').toLowerCase() };
          }
          return { ...t, ...patch };
        }),
      }));
    },
    [setSchema],
  );

  const removeTable = React.useCallback<ErdContextValue['removeTable']>(
    (id) => {
      setSchema((prev) => ({
        ...prev,
        tables: prev.tables.filter((t) => t.id !== id),
        relations: prev.relations.filter((r) => r.sourceTableId !== id && r.targetTableId !== id),
      }));
    },
    [setSchema],
  );

  const moveTable = React.useCallback<ErdContextValue['moveTable']>(
    (id, x, y) => {
      setSchema((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => (t.id === id ? { ...t, x, y } : t)),
      }));
    },
    [setSchema],
  );

  const addColumn = React.useCallback<ErdContextValue['addColumn']>(
    (tableId) => {
      setSchema((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => {
          if (t.id !== tableId) return t;
          const name = uniqueName('new_column', t.columns.map((c) => c.name));
          return { ...t, columns: [...t.columns, newColumn(name)] };
        }),
      }));
    },
    [setSchema],
  );

  const updateColumn = React.useCallback<ErdContextValue['updateColumn']>(
    (tableId, columnId, patch) => {
      setSchema((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => {
          if (t.id !== tableId) return t;
          const columns = t.columns.map((c) => {
            if (c.id !== columnId) return c;
            const next = { ...c, ...patch };
            if (patch.name !== undefined) {
              const safe = patch.name.replace(/\s+/g, '_').toLowerCase();
              const taken = t.columns.filter((x) => x.id !== columnId).map((x) => x.name);
              next.name = taken.includes(safe) ? uniqueName(safe, taken) : safe;
            }
            if (patch.primaryKey === true) {
              next.notNull = true;
              next.unique = true;
            }
            return next;
          });
          return { ...t, columns };
        }),
      }));
    },
    [setSchema],
  );

  const removeColumn = React.useCallback<ErdContextValue['removeColumn']>(
    (tableId, columnId) => {
      setSchema((prev) => ({
        ...prev,
        tables: prev.tables.map((t) =>
          t.id === tableId ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) } : t,
        ),
        relations: prev.relations.filter(
          (r) => r.sourceColumnId !== columnId && r.targetColumnId !== columnId,
        ),
      }));
    },
    [setSchema],
  );

  const addRelation = React.useCallback<ErdContextValue['addRelation']>(
    (input) => {
      setSchema((prev) => {
        const exists = prev.relations.some(
          (r) =>
            r.sourceTableId === input.sourceTableId &&
            r.targetTableId === input.targetTableId &&
            r.kind === input.kind,
        );
        if (exists) return prev;
        return {
          ...prev,
          relations: [
            ...prev.relations,
            {
              id: uid('rel'),
              onDelete: 'CASCADE',
              onUpdate: 'NO ACTION',
              ...input,
            },
          ],
        };
      });
    },
    [setSchema],
  );

  const updateRelation = React.useCallback<ErdContextValue['updateRelation']>(
    (id, patch) => {
      setSchema((prev) => ({
        ...prev,
        relations: prev.relations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }));
    },
    [setSchema],
  );

  const removeRelation = React.useCallback<ErdContextValue['removeRelation']>(
    (id) => {
      setSchema((prev) => ({ ...prev, relations: prev.relations.filter((r) => r.id !== id) }));
    },
    [setSchema],
  );

  const setDialect = React.useCallback(
    (dialect: Dialect) => setSchema((prev) => ({ ...prev, dialect })),
    [setSchema],
  );

  const loadDemo = React.useCallback(() => {
    setSchema(demoSchema());
    setSeed(null);
    writeStore(SEED_KEY, null);
    writeStore('erd:seeded', false);
  }, [setSchema]);

  const clearAll = React.useCallback(() => {
    setSchema({ tables: [], relations: [], dialect: 'postgres' });
    setSeed(null);
    writeStore(SEED_KEY, null);
    writeStore('erd:seeded', false);
  }, [setSchema]);

  const runSeed = React.useCallback(() => {
    const result = seedSchema(schema);
    const snapshot: SeedSnapshot = {
      ...result,
      generatedAt: new Date().toISOString(),
      dialect: schema.dialect,
    };
    setSeed(snapshot);
    writeStore(SEED_KEY, snapshot);
    writeStore('erd:seeded', true);
    return snapshot;
  }, [schema]);

  const clearSeed = React.useCallback(() => {
    setSeed(null);
    writeStore(SEED_KEY, null);
    writeStore('erd:seeded', false);
  }, []);

  const value = React.useMemo<ErdContextValue>(
    () => ({
      schema,
      seed,
      addTable,
      updateTable,
      removeTable,
      moveTable,
      addColumn,
      updateColumn,
      removeColumn,
      addRelation,
      updateRelation,
      removeRelation,
      setDialect,
      loadDemo,
      clearAll,
      runSeed,
      clearSeed,
    }),
    [
      schema,
      seed,
      addTable,
      updateTable,
      removeTable,
      moveTable,
      addColumn,
      updateColumn,
      removeColumn,
      addRelation,
      updateRelation,
      removeRelation,
      setDialect,
      loadDemo,
      clearAll,
      runSeed,
      clearSeed,
    ],
  );

  return <ErdContext.Provider value={value}>{children}</ErdContext.Provider>;
}

export function useErd() {
  const ctx = React.useContext(ErdContext);
  if (!ctx) throw new Error('useErd must be used inside <ErdProvider>');
  return ctx;
}
