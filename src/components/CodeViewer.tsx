import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn, copyText } from '@/lib/utils';
import { highlight, type CodeLanguage } from '@/lib/prism';

interface CodeViewerProps {
  code: string;
  language?: CodeLanguage;
  className?: string;
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  actions?: React.ReactNode;
}

export function CodeViewer({
  code,
  language = 'sql',
  className,
  filename,
  showLineNumbers = true,
  maxHeight = '520px',
  actions,
}: CodeViewerProps) {
  const [copied, setCopied] = React.useState(false);
  const html = React.useMemo(() => highlight(code, language), [code, language]);
  const lineCount = React.useMemo(() => code.split('\n').length, [code]);

  const handleCopy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-[color-mix(in_oklch,var(--background)_70%,var(--surface))]', className)}>
      {(filename || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
          <span className="truncate font-mono text-[0.6875rem] text-muted-foreground">
            {filename}
          </span>
          <div className="flex items-center gap-1">
            {actions}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-sm px-1.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
              aria-label="Copy code"
            >
              {copied ? <Check className="h-3 w-3 text-lime" /> : <Copy className="h-3 w-3" />}
              {copied ? 'copied' : 'copy'}
            </button>
          </div>
        </div>
      )}
      <div className="flex overflow-auto" style={{ maxHeight }}>
        {showLineNumbers && (
          <div
            aria-hidden
            className="sticky left-0 shrink-0 select-none border-r border-border/60 bg-surface/60 px-2 py-3 text-right font-mono text-[0.75rem] leading-[1.65] text-muted-foreground/35"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words p-3 font-mono text-[0.8125rem] leading-[1.65]">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  );
}
