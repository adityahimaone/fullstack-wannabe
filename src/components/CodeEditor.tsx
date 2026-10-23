import * as React from 'react';
import { cn } from '@/lib/utils';
import { highlight, type CodeLanguage } from '@/lib/prism';
import { useMediaQuery } from '@/lib/use-media';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: CodeLanguage;
  onRun?: () => void;
  minHeight?: number;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'sql',
  onRun,
  minHeight = 180,
  placeholder,
  readOnly,
  className,
  ariaLabel = 'Code editor',
}: CodeEditorProps) {
  const preRef = React.useRef<HTMLPreElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  // On narrow screens the editor soft-wraps (and drops the gutter) so no code
  // is hidden behind a horizontal scrollbar on a phone.
  const wide = useMediaQuery('(min-width: 768px)');
  const wrap = !wide;

  const html = React.useMemo(
    () => highlight(value + (value.endsWith('\n') ? ' ' : ''), language),
    [value, language],
  );
  const lines = React.useMemo(() => value.split('\n').length, [value]);

  const syncScroll = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div
      className={cn(
        'relative flex overflow-hidden rounded-md border border-border bg-[color-mix(in_oklch,var(--background)_72%,var(--surface))] font-mono text-[0.8125rem] leading-[1.65] focus-within:border-primary/50',
        className,
      )}
      style={{ minHeight }}
    >
      {wide && (
        <div
          ref={gutterRef}
          aria-hidden
          className="w-9 shrink-0 select-none overflow-hidden border-r border-border/60 bg-surface/50 py-3 text-right text-[0.75rem] text-muted-foreground/35"
        >
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="pr-2">
              {i + 1}
            </div>
          ))}
        </div>
      )}
      <div className="relative min-w-0 flex-1">
        <pre
          ref={preRef}
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 overflow-hidden p-3',
            wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
          )}
        >
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap={wrap ? 'soft' : 'off'}
          readOnly={readOnly}
          aria-label={ariaLabel}
          placeholder={placeholder}
          className={cn(
            'absolute inset-0 h-full w-full resize-none bg-transparent p-3 text-transparent caret-primary outline-none placeholder:text-muted-foreground/40 selection:bg-primary/25',
            wrap ? 'overflow-y-auto break-words no-scrollbar' : 'overflow-auto whitespace-pre',
          )}
        />
      </div>
    </div>
  );
}
