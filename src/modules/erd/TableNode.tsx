import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Fingerprint, KeyRound, Link2, Sigma } from 'lucide-react';
import type { ErdTable } from './types';
import { cn } from '@/lib/utils';

export type TableNodeData = { table: ErdTable; fkColumnIds?: string[] };
export type TableNodeType = Node<TableNodeData, 'table'>;

const ACCENT: Record<string, string> = {
  lime: 'bg-lime',
  amber: 'bg-amber',
  violet: 'bg-violet',
  cyan: 'bg-cyan',
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

  return (
    <div
      className={cn(
        'group w-[236px] overflow-hidden rounded-md border bg-surface shadow-[0_10px_30px_-16px_rgba(0,0,0,0.9)] transition-colors',
        selected ? 'border-primary/70' : 'border-border',
      )}
    >
      <div className="drag-handle relative flex cursor-grab items-center justify-between gap-2 border-b border-border bg-elevated/70 px-2.5 py-2 active:cursor-grabbing">
        <span className={cn('absolute inset-y-0 left-0 w-[2px]', ACCENT[table.color ?? 'lime'])} />
        <div className="min-w-0 pl-1">
          <p className="truncate font-mono text-[0.75rem] font-medium tracking-tight">{table.name}</p>
          <p className="mt-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground">
            {table.columns.length} col{table.columns.length === 1 ? '' : 's'}
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-border px-1 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">
          {pk?.name ?? 'no pk'}
        </span>
      </div>

      <div className="divide-y divide-border/60">
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
                className="-left-[5px]"
                style={{ opacity: selected ? 1 : 0.55 }}
              />
              <span className="grid w-3 shrink-0 place-items-center">
                {col.primaryKey ? (
                  <KeyRound className="h-2.5 w-2.5 text-amber" />
                ) : isFk ? (
                  <Link2 className="h-2.5 w-2.5 text-cyan" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-border" />
                )}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 truncate font-mono',
                  col.primaryKey ? 'text-foreground' : 'text-foreground/85',
                )}
              >
                {col.name}
              </span>
              {col.autoIncrement && (
                <Fingerprint className="h-2.5 w-2.5 shrink-0 text-muted-foreground/70" aria-label="auto increment" />
              )}
              {!col.notNull && !col.primaryKey && (
                <Sigma className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" aria-label="nullable" />
              )}
              <span className="shrink-0 font-mono text-[0.5625rem] uppercase tracking-wider text-muted-foreground/80">
                {TYPE_LABEL[col.type] ?? col.type.toLowerCase()}
                {col.type === 'VARCHAR' && col.length ? `(${col.length})` : ''}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`${col.id}-s`}
                className="-right-[5px]"
                style={{ opacity: selected ? 1 : 0.55 }}
              />
            </div>
          );
        })}
      </div>

      {table.columns.length === 0 && (
        <p className="px-3 py-3 text-[0.6875rem] text-muted-foreground">No columns yet.</p>
      )}
    </div>
  );
}

export const TableNode = memo(TableNodeInner);
