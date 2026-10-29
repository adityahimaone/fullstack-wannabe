import * as React from 'react';
import { Check, CornerDownRight, KeyRound, Link2, Play, Table2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMediaQuery } from '@/lib/use-media';
import { cn, copyText } from '@/lib/utils';
import type { TableColumn, TableSchema } from './engine';

/**
 * A table chip that reveals its column list on hover (or tap, on touch).
 * The schema is read from the live SQLite database, so it is always the real
 * shape of the table you are querying — not a hand-written summary.
 */
export function TableChip({ table, onPick }: { table: TableSchema; onPick: () => void }) {
  const [open, setOpen] = React.useState(false);
  const hoverable = useMediaQuery('(hover: hover) and (pointer: fine)');
  const timer = React.useRef<number | null>(null);

  const cancel = React.useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  React.useEffect(() => cancel, [cancel]);

  const scheduleOpen = () => {
    cancel();
    timer.current = window.setTimeout(() => setOpen(true), 130);
  };
  const scheduleClose = () => {
    cancel();
    timer.current = window.setTimeout(() => setOpen(false), 180);
  };

  const pick = () => {
    onPick();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={pick}
          onMouseEnter={hoverable ? scheduleOpen : undefined}
          onMouseLeave={hoverable ? scheduleClose : undefined}
          onFocus={scheduleOpen}
          onBlur={scheduleClose}
          aria-label={`${table.name} — ${table.columns.length} columns, ${table.rows} rows`}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 font-mono text-[0.5625rem] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary-ink focus-visible:border-primary/60 focus-visible:text-primary-ink data-[state=open]:border-primary/40 data-[state=open]:text-primary-ink"
        >
          <Table2 className="h-2.5 w-2.5" />
          {table.name}
          <span className="text-tertiary">{table.rows}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        collisionPadding={12}
        className="w-[326px]"
        onMouseEnter={cancel}
        onMouseLeave={hoverable ? scheduleClose : undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
          <Table2 className="h-3 w-3 shrink-0 text-primary-ink" />
          <span className="truncate font-mono text-[0.75rem] text-foreground">{table.name}</span>
          <span className="ml-auto shrink-0 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">
            {table.columns.length} cols · {table.rows} rows
          </span>
        </div>

        <ul className="max-h-[264px] overflow-y-auto py-1">
          {table.columns.length === 0 && (
            <li className="px-2.5 py-2 text-[0.6875rem] text-muted-foreground">No columns reported.</li>
          )}
          {table.columns.map((col) => (
            <ColumnRow key={col.name} col={col} />
          ))}
        </ul>

        <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5">
          <span className="font-mono text-[0.5rem] uppercase tracking-widest text-tertiary">
            click to query
          </span>
          <button
            type="button"
            onClick={pick}
            className="inline-flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-primary-ink transition-colors hover:bg-primary/20"
          >
            <Play className="h-2.5 w-2.5" />
            SELECT *
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ColumnRow({ col }: { col: TableColumn }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    if (await copyText(col.name)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <li>
      <button
        type="button"
        onClick={copy}
        title={`Copy “${col.name}”`}
        className="group flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left transition-colors hover:bg-elevated/60"
      >
        <span className="flex min-w-0 items-center gap-1">
          {col.pk ? (
            <KeyRound className="h-2.5 w-2.5 shrink-0 text-lime-ink" />
          ) : col.fk ? (
            <Link2 className="h-2.5 w-2.5 shrink-0 text-grape-ink" />
          ) : (
            <span className="h-2.5 w-2.5 shrink-0" />
          )}
          <span
            className={cn(
              'truncate font-mono text-[0.6875rem]',
              col.pk || col.fk ? 'text-foreground' : 'text-foreground',
            )}
          >
            {col.name}
          </span>
          {copied && <Check className="h-2.5 w-2.5 shrink-0 text-lime-ink" />}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-1">
          {col.fk && (
            <span className="inline-flex items-center gap-0.5 font-mono text-[0.5rem] text-grape-ink/90">
              <CornerDownRight className="h-2 w-2" />
              {col.fk.table}
            </span>
          )}
          <span className="font-mono text-[0.5625rem] uppercase text-muted-foreground">{col.type}</span>
          {col.pk && <Marker tone="lime">pk</Marker>}
          {col.autoIncrement && <Marker tone="amber">ai</Marker>}
          {col.unique && <Marker tone="cyan">uq</Marker>}
          {col.notNull && <Marker tone="muted">nn</Marker>}
        </span>
      </button>
    </li>
  );
}

function Marker({ children, tone }: { children: React.ReactNode; tone: 'lime' | 'amber' | 'cyan' | 'muted' }) {
  return (
    <span
      className={cn(
        'rounded-[2px] border px-1 font-mono text-[0.5rem] uppercase leading-[1.35] tracking-wider',
        tone === 'lime' && 'border-lime/30 bg-lime/10 text-lime-ink',
        tone === 'amber' && 'border-amber/30 bg-amber/10 text-mango-ink',
        tone === 'cyan' && 'border-cyan/30 bg-cyan/10 text-cyan-ink',
        tone === 'muted' && 'border-border text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}
