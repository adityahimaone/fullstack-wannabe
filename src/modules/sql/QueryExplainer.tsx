import * as React from 'react';
import { ArrowRight, GitMerge, Layers, Sparkles } from 'lucide-react';
import type { QueryResult } from './engine';
import { cn } from '@/lib/utils';

type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | null;

const JOIN_COPY: Record<Exclude<JoinType, null>, string> = {
  INNER: 'Only rows with a match on both sides survive. Unmatched rows are dropped silently.',
  LEFT: 'Every row from the left table survives. When nothing matches, right-side columns come back NULL.',
  RIGHT: 'Every row from the right table survives. Left-side columns become NULL when there is no match.',
  FULL: 'The union of both sides: matched rows plus orphans from either table, padded with NULL.',
};

function detect(sql: string) {
  const lower = sql.toLowerCase();
  const joinMatch = lower.match(/\b(left|right|full|inner)?\s*(outer\s+)?join\b/);
  let joinType: JoinType = null;
  if (joinMatch) {
    const kind = (joinMatch[1] ?? 'inner').toUpperCase();
    joinType = kind as JoinType;
  }
  const fromMatch = sql.match(/\bfrom\s+([a-z_][\w]*)/i);
  const joinTables = [...sql.matchAll(/\bjoin\s+([a-z_][\w]*)/gi)].map((m) => m[1]);

  return {
    joinType,
    left: fromMatch?.[1] ?? 'left',
    right: joinTables[0] ?? 'right',
    hasWhere: /\bwhere\b/i.test(lower),
    hasGroup: /\bgroup\s+by\b/i.test(lower),
    hasHaving: /\bhaving\b/i.test(lower),
    hasOrder: /\border\s+by\b/i.test(lower),
    hasLimit: /\blimit\b/i.test(lower),
    hasDistinct: /\bdistinct\b/i.test(lower),
    hasCte: /\bwith\b[\s\S]*\bas\s*\(/i.test(lower),
    hasCase: /\bcase\b/i.test(lower),
    hasWindow: /\bover\s*\(/i.test(lower),
    hasSubquery: (lower.match(/\(\s*select/g) ?? []).length > 0,
  };
}

function Venn({ type, left, right }: { type: JoinType; left: string; right: string }) {
  const inner = type === 'INNER';
  const leftOn = type === 'LEFT' || type === 'FULL' || inner;
  const rightOn = type === 'RIGHT' || type === 'FULL' || inner;

  return (
    <svg viewBox="0 0 260 118" className="w-full max-w-[260px]" role="img" aria-label={`${type ?? 'join'} diagram`}>
      <defs>
        <clipPath id="venn-left">
          <circle cx="100" cy="56" r="40" />
        </clipPath>
      </defs>
      <circle
        cx="100"
        cy="56"
        r="40"
        fill="var(--cyan)"
        fillOpacity={leftOn ? 0.2 : 0.06}
        stroke="var(--cyan)"
        strokeOpacity={leftOn ? 0.85 : 0.3}
        strokeWidth={1.4}
      />
      <circle
        cx="160"
        cy="56"
        r="40"
        fill="var(--amber)"
        fillOpacity={rightOn ? 0.18 : 0.06}
        stroke="var(--amber)"
        strokeOpacity={rightOn ? 0.85 : 0.3}
        strokeWidth={1.4}
      />
      <g clipPath="url(#venn-left)">
        <circle cx="160" cy="56" r="40" fill="var(--lime)" fillOpacity={inner || type === 'FULL' ? 0.38 : 0.14} />
      </g>
      <text x="100" y="108" textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontFamily="JetBrains Mono, monospace">
        {left}
      </text>
      <text x="160" y="108" textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontFamily="JetBrains Mono, monospace">
        {right}
      </text>
    </svg>
  );
}

export function QueryExplainer({ sql, result }: { sql: string; result: QueryResult | null }) {
  const info = React.useMemo(() => detect(sql), [sql]);

  const clauses = [
    { key: 'select', label: 'SELECT', active: true },
    { key: 'from', label: 'FROM', active: /\bfrom\b/i.test(sql) },
    { key: 'where', label: 'WHERE', active: info.hasWhere },
    { key: 'group', label: 'GROUP BY', active: info.hasGroup },
    { key: 'having', label: 'HAVING', active: info.hasHaving },
    { key: 'order', label: 'ORDER BY', active: info.hasOrder },
    { key: 'limit', label: 'LIMIT', active: info.hasLimit },
  ];

  const notes: string[] = [];
  if (info.hasCte) notes.push('WITH builds a named result set first — the rest of the query reads it like a table.');
  if (info.hasSubquery) notes.push('A subquery runs inside another query; correlated ones re-run for each outer row.');
  if (info.hasCase) notes.push('CASE evaluates conditions top-down and stops at the first match.');
  if (info.hasWindow) notes.push('Window functions compute across a partition without collapsing rows — unlike GROUP BY.');
  if (info.hasDistinct) notes.push('DISTINCT de-duplicates the projected columns, not the underlying rows.');

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow mb-2">Query anatomy</p>
        <div className="flex flex-wrap items-center gap-1">
          {clauses.map((clause, i) => (
            <React.Fragment key={clause.key}>
              {i > 0 && <ArrowRight className="h-2.5 w-2.5 text-border" />}
              <span
                className={cn(
                  'rounded-sm border px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider transition-colors',
                  clause.active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground/35',
                )}
              >
                {clause.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {info.joinType && (
        <div className="rounded-md border border-border bg-elevated/30 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <GitMerge className="h-3 w-3 text-cyan" />
            <p className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
              {info.joinType} JOIN
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Venn type={info.joinType} left={info.left} right={info.right} />
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              {JOIN_COPY[info.joinType]}
            </p>
          </div>
        </div>
      )}

      {info.hasGroup && (
        <div className="rounded-md border border-border bg-elevated/30 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-amber" />
            <p className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
              GROUP BY collapses rows
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              ))}
            </div>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            <div className="flex flex-wrap gap-1" aria-hidden>
              {Array.from({ length: Math.min(result?.rows.length ?? 3, 6) }, (_, i) => (
                <span key={i} className="h-3 w-3 rounded-sm border border-amber/50 bg-amber/20" />
              ))}
            </div>
          </div>
          <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
            Many rows become one row per distinct key. Aggregates like COUNT and SUM read the collapsed bucket,
            not the individual rows.
            {result && ` Your result has ${result.rows.length} group${result.rows.length === 1 ? '' : 's'}.`}
          </p>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="space-y-1.5">
          {notes.map((note) => (
            <li key={note} className="flex gap-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet" />
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
