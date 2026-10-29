import * as React from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { CodeViewer } from '@/components/CodeViewer';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { defaultBody, handleRequest, type ApiResult } from './mockApi';
import type { Ctx } from './ctx';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

export function ApiTester({
  ctx,
  onTrace,
  onRequest,
}: {
  ctx: Ctx;
  onTrace: (step: number | null) => void;
  onRequest: () => void;
}) {
  const [method, setMethod] = React.useState('GET');
  const [path, setPath] = React.useState(ctx.route);
  const [body, setBody] = React.useState(() => defaultBody(ctx));
  const [result, setResult] = React.useState<ApiResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const timers = React.useRef<number[]>([]);

  React.useEffect(() => {
    setPath(ctx.route);
    setBody(defaultBody(ctx));
    setResult(null);
  }, [ctx.route]);

  React.useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const send = async () => {
    setLoading(true);
    const res = await handleRequest({ method, path, body, ctx });
    setResult(res);
    setLoading(false);
    onRequest();

    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = res.trace.map((step, i) =>
      window.setTimeout(() => onTrace(step), i * 140),
    );
    timers.current.push(window.setTimeout(() => onTrace(null), res.trace.length * 140 + 600));
  };

  const statusTone =
    result == null
      ? ''
      : result.status < 300
        ? 'border-lime/40 bg-lime/10 text-lime-ink'
        : result.status < 500
          ? 'border-amber/40 bg-amber/10 text-mango-ink'
          : 'border-destructive/40 bg-destructive/10 text-destructive';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <p className="eyebrow">Mini-postman</p>
        <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-tertiary">
          live against your seed
        </span>
      </div>

      <div className="space-y-2 border-b border-border p-3">
        <div className="flex gap-1.5">
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="h-8 w-[86px] font-mono text-[0.625rem] font-medium" aria-label="HTTP method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m} className="font-mono text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="h-8 flex-1 font-mono text-[0.6875rem]"
            aria-label="Request path"
          />
          <Button size="icon-sm" onClick={send} disabled={loading} aria-label="Send request">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {[
            { m: 'GET', p: ctx.route },
            { m: 'GET', p: `${ctx.route}/1` },
            { m: 'POST', p: ctx.route },
          ].map((q) => (
            <button
              key={`${q.m}-${q.p}`}
              type="button"
              onClick={() => {
                setMethod(q.m);
                setPath(q.p);
              }}
              className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary-ink"
            >
              {q.m} {q.p.replace('/api/v1', '')}
            </button>
          ))}
        </div>

        {(method === 'POST' || method === 'PUT') && (
          <div>
            <p className="eyebrow mb-1">JSON body</p>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="h-24 text-[0.6875rem]"
              aria-label="Request body"
            />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!result && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Send className="h-5 w-5 text-tertiary" />
            <p className="max-w-[220px] text-[0.75rem] leading-relaxed text-muted-foreground">
              Send a request and watch it travel router → controller → service → repository → database.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            awaiting response
          </div>
        )}

        {result && !loading && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={cn('border', statusTone)}>
                {result.status} {result.statusText}
              </Badge>
              <span className="font-mono text-[0.5625rem] text-muted-foreground">{result.ms} ms</span>
              <span className="ml-auto font-mono text-[0.5625rem] text-tertiary">
                {result.trace.length} hops
              </span>
            </div>

            <CodeViewer
              code={result.body === null ? '// 204 No Content' : JSON.stringify(result.body, null, 2)}
              language="json"
              filename={`${result.method} ${result.path}`}
              maxHeight="300px"
              showLineNumbers={false}
            />

            <div className="flex flex-wrap gap-1">
              {result.trace.map((step, i) => (
                <span
                  key={`${step}-${i}`}
                  className="rounded-sm border border-border/70 px-1 py-0.5 font-mono text-[0.5rem] text-muted-foreground"
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-1.5">
        <p className="font-mono text-[0.5rem] uppercase tracking-widest text-tertiary">
          steps light up as the request moves
        </p>
        <Button
          size="xs"
          variant="ghost"
          className="ml-auto h-5 px-1 text-muted-foreground"
          onClick={() => setResult(null)}
          aria-label="Clear response"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
