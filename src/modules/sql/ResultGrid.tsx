import * as React from 'react';
import { AlertTriangle, Clock, Rows3, Terminal } from 'lucide-react';
import type { QueryResult } from './engine';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function ResultGrid({
  result,
  error,
  loading,
}: {
  result: QueryResult | null;
  error: string | null;
  loading?: boolean;
}) {
  const numericColumns = React.useMemo(() => {
    if (!result) return [] as boolean[];
    return result.columns.map((_, i) =>
      result.rows.every((row) => row[i] === null || typeof row[i] === 'number'),
    );
  }, [result]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          mounting sqlite in wasm…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-3 rounded-md border border-destructive/35 bg-destructive/5 p-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          <p className="font-mono text-[0.625rem] uppercase tracking-widest">SQL error</p>
        </div>
        <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[0.75rem] leading-relaxed text-foreground/85">
          {error}
        </pre>
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
          SQLite stops at the first invalid token — check the clause right before the reported position.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 px-6 text-center">
        <Terminal className="h-5 w-5 text-muted-foreground/50" />
        <p className="text-[0.8125rem] text-muted-foreground">
          Nothing executed yet. Hit <kbd className="rounded-sm border border-border px-1 font-mono text-[0.625rem]">⌘↵</kbd> to run.
        </p>
      </div>
    );
  }

  if (result.columns.length === 0) {
    return (
      <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-1.5 px-6 text-center">
        <p className="text-[0.8125rem] text-foreground">Statement executed.</p>
        <p className="font-mono text-[0.6875rem] text-muted-foreground">
          {result.rowsAffected} row{result.rowsAffected === 1 ? '' : 's'} affected · {result.durationMs.toFixed(1)} ms
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-right text-[0.5625rem] text-muted-foreground/50">#</TableHead>
              {result.columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="text-right text-[0.625rem] text-muted-foreground/40">
                  {rowIndex + 1}
                </TableCell>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    className={cn(
                      numericColumns[cellIndex] && 'text-right tabular-nums',
                      cell === null && 'text-muted-foreground/50',
                    )}
                  >
                    {cell === null ? (
                      <span className="italic">NULL</span>
                    ) : typeof cell === 'number' ? (
                      new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(cell)
                    ) : (
                      cell
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {result.rows.length === 0 && (
          <p className="px-3 py-6 text-center text-[0.8125rem] text-muted-foreground">
            Zero rows. The query is valid — the data just doesn't match your filter.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border bg-surface px-3 py-1.5 font-mono text-[0.625rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Rows3 className="h-3 w-3" />
          {result.rows.length} rows × {result.columns.length} cols
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {result.durationMs.toFixed(1)} ms
        </span>
        {result.truncated && <span className="text-amber">display capped at 400 rows</span>}
      </div>
    </div>
  );
}
