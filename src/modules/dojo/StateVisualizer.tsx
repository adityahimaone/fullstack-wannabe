import { motion } from 'framer-motion';
import { Braces, Boxes, Hash, ListTree } from 'lucide-react';
import { cn } from '@/lib/utils';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function StateVisualizer({
  value,
  sourceRows,
  className,
}: {
  value: unknown;
  sourceRows?: number;
  className?: string;
}) {
  if (value === undefined || value === null) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 p-6 text-center', className)}>
        <Boxes className="h-5 w-5 text-tertiary" />
        <p className="text-[0.75rem] leading-relaxed text-muted-foreground">
          Run your solution and the resulting data structure renders here — keys, buckets and magnitudes.
        </p>
      </div>
    );
  }

  const isNumberMap =
    isPlainObject(value) && Object.values(value).every((v) => typeof v === 'number');
  const isPrimitiveArray = Array.isArray(value) && value.every((v) => typeof v !== 'object');
  const isObjectArray =
    Array.isArray(value) && value.every((v) => v && typeof v === 'object' && !Array.isArray(v));

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
          {isNumberMap ? <Hash className="h-2.5 w-2.5" /> : isObjectArray ? <ListTree className="h-2.5 w-2.5" /> : <Braces className="h-2.5 w-2.5" />}
          {isNumberMap ? 'object' : Array.isArray(value) ? 'array' : typeof value}
        </span>
        <span className="font-mono text-[0.5625rem] text-tertiary">
          {isNumberMap && `${Object.keys(value).length} buckets`}
          {Array.isArray(value) && `${value.length} items`}
          {sourceRows !== undefined && ` · ${sourceRows} source rows`}
        </span>
      </div>

      {isNumberMap && <NumberBuckets map={value as Record<string, number>} />}
      {isPrimitiveArray && <ChipList items={value as (string | number | boolean)[]} />}
      {isObjectArray && <ObjectTable rows={value as Record<string, unknown>[]} />}
      {!isNumberMap && !isPrimitiveArray && !isObjectArray && (
        <pre className="max-h-56 overflow-auto rounded-md border border-border bg-background/60 p-2.5 font-mono text-[0.6875rem] leading-relaxed">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

function NumberBuckets({ map }: { map: Record<string, number> }) {
  const entries = Object.entries(map);
  const max = Math.max(...entries.map(([, v]) => Math.abs(v)), 1);

  return (
    <div className="space-y-1.5">
      {entries.map(([key, value], i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2"
        >
          <span className="w-16 shrink-0 truncate font-mono text-[0.625rem] text-muted-foreground">
            {key}
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded-[4px] border-[1.5px] border-border bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(3, (Math.abs(value) / max) * 100)}%` }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-primary"
            />
          </div>
          <span className="numeric w-16 shrink-0 text-right font-mono text-[0.625rem] text-foreground">
            {value.toFixed(2)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function ChipList({ items }: { items: (string | number | boolean)[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <motion.span
          key={`${item}-${i}`}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03, duration: 0.25 }}
          className="rounded-sm border border-border bg-elevated/50 px-1.5 py-0.5 font-mono text-[0.625rem]"
        >
          {String(item)}
        </motion.span>
      ))}
    </div>
  );
}

function ObjectTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).slice(0, 5);
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-elevated/50">
            {columns.map((c) => (
              <th
                key={c}
                className="px-2 py-1 text-left font-mono text-[0.5625rem] uppercase tracking-wider text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="border-b border-border/50 last:border-0"
            >
              {columns.map((c) => (
                <td key={c} className="px-2 py-1 font-mono text-[0.625rem]">
                  {typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c] ?? '∅')}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {rows.length > 8 && (
        <p className="border-t border-border px-2 py-1 font-mono text-[0.5625rem] text-muted-foreground">
          +{rows.length - 8} more rows
        </p>
      )}
    </div>
  );
}
