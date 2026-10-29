import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Fingerprint, KeyRound, Link2, Sigma } from 'lucide-react';
import type { ErdTable } from './types';
import { cn } from '@/lib/utils';

export type TableNodeData = { table: ErdTable; fkColumnIds?: string[] };
export type TableNodeType = Node<TableNodeData, 'table'>;

/**
 * A table on the canvas is the mark at table scale: a node with a header
 * strip that names it. The strip is the table's colour — one colour, one
 * label — and the body is plain paper with an ink edge and a hard offset.
 */
const ACCENT: Record<string, { bg: string; on: string }> = {
  lime: { bg: 'var(--lime)', on: 'var(--on-candy)' },
  amber: { bg: 'var(--mango)', on: 'var(--on-candy)' },
  violet: { bg: 'var(--grape)', on: 'var(--on-grape)' },
  cyan: { bg: 'var(--cyan)', on: 'var(--on-candy)' },
  pink: { bg: 'var(--pink)', on: 'var(--on-candy)' },
  mint: { bg: 'var(--mint)', on: 'var(--on-candy)' },
};

const TYPE_LABEL: Record<string, string> = {
  INT: 'int',
  BIGINT: 'bigint',
  VARCHAR: 'varchar',
  TEXT: 'text',
  BOOLEAN: 'bool',
  TIMESTAMP: 'ts',
  DATE: 'date',
  DECIMAL: 'decimal',
  UUID: 'uuid',
  JSON: 'json',
};

function TableNodeInner({ data, selected }: NodeProps<TableNodeType>) {
  const { table, fkColumnIds = [] } = data;
  const pk = table.columns.find((c) => c.primaryKey);
  const accent = ACCENT[table.color ?? 'lime'] ?? ACCENT.lime;

  return (
    <div className={cn('node-card group w-[236px]', selected && 'is-selected')}>
      <div
        className="drag-handle node-head cursor-grab justify-between px-2.5 py-2 active:cursor-grabbing"
        style={{ ['--node-accent' as string]: accent.bg, ['--node-on' as string]: accent.on }}
      >
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] leading-tight">{table.name}</p>
          {/* No opacity here. `--node-on` is already tuned to the strip it sits
              on; dimming it 30% drops grape from 5.0:1 to 3.4:1. The 9px mono
              uppercase is the whole hierarchy. */}
          <p className="mt-0.5 font-mono text-[0.5625rem] uppercase leading-none tracking-[0.14em]">
            {table.columns.length} col{table.columns.length === 1 ? '' : 's'}
          </p>
        </div>
        {/* An outline in `currentColor`, not a black wash: a wash darkens the
            strip, which helps cream text but hurts the ink text dark mode puts
            on the same strip. */}
        <span className="chip-on shrink-0 rounded-[6px] border-[1.5px] px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest">
          {pk?.name ?? 'no pk'}
        </span>
      </div>

      <div className="divide-y-[1.5px] divide-border/70 bg-card">
        {table.columns.map((col) => {
          const isFk = fkColumnIds.includes(col.id);
          return (
            <div
              key={col.id}
              className="relative flex items-center gap-1.5 px-2.5 py-[5px] text-[0.6875rem]"
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`${col.id}-t`}
                className="-left-[2px]"
                style={{ opacity: selected ? 1 : 0.55 }}
              />
              <span className="grid w-3 shrink-0 place-items-center">
                {col.primaryKey ? (
                  <KeyRound className="h-2.5 w-2.5 text-mango-ink" />
                ) : isFk ? (
                  <Link2 className="h-2.5 w-2.5 text-cyan-ink" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-border" />
                )}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate font-mono',
                  col.primaryKey ? 'font-semibold text-foreground' : 'text-foreground',
                )}
              >
                {col.name}
              </span>
              {col.autoIncrement && (
                <Fingerprint
                  className="h-2.5 w-2.5 shrink-0 text-muted-foreground"
                  aria-label="auto increment"
                />
              )}
              {!col.notNull && !col.primaryKey && (
                <Sigma className="h-2.5 w-2.5 shrink-0 text-tertiary" aria-label="nullable" />
              )}
              <span className="shrink-0 font-mono text-[0.5625rem] uppercase tracking-wider text-muted-foreground">
                {TYPE_LABEL[col.type] ?? col.type.toLowerCase()}
                {col.type === 'VARCHAR' && col.length ? `(${col.length})` : ''}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`${col.id}-s`}
                className="-right-[2px]"
                style={{ opacity: selected ? 1 : 0.55 }}
              />
            </div>
          );
        })}
      </div>

      {table.columns.length === 0 && (
        <p className="bg-card px-3 py-3 text-[0.6875rem] text-muted-foreground">No columns yet.</p>
      )}
    </div>
  );
}

export const TableNode = memo(TableNodeInner);
