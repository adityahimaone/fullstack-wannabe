import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { highlight, type CodeLanguage } from '@/lib/prism';
import { useMediaQuery } from '@/lib/use-media';
import {
  inNoSuggestZone,
  menuPosition,
  rankCompletions,
  wordBefore,
  type Completion,
  type CompletionKind,
} from '@/lib/completions';

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
  /** enables the suggestion menu; omit to turn it off */
  completions?: Completion[];
}

interface MenuState {
  items: Completion[];
  active: number;
  top: number;
  left: number;
}

const MENU_WIDTH = 272;
const ROW_HEIGHT = 23;
const MENU_CHROME = 25;

const GLYPH: Record<CompletionKind, { ch: string; className: string }> = {
  table: { ch: 'T', className: 'text-cyan-ink' },
  column: { ch: 'C', className: 'text-grape-ink' },
  keyword: { ch: 'K', className: 'text-lime-ink' },
  function: { ch: 'F', className: 'text-mango-ink' },
};

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
  completions,
}: CodeEditorProps) {
  const preRef = React.useRef<HTMLPreElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  // On narrow screens the editor soft-wraps (and drops the gutter) so no code
  // is hidden behind a horizontal scrollbar on a phone.
  const wide = useMediaQuery('(min-width: 768px)');
  const wrap = !wide;

  const [caret, setCaret] = React.useState<number | null>(null);
  const [menu, setMenu] = React.useState<MenuState | null>(null);
  // caret position the user dismissed at — stops the menu reopening on accept
  const dismissed = React.useRef<number | null>(null);
  // Typing is proof of focus; `document.activeElement` is not reliable mid-input.
  const focused = React.useRef(false);

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

  const placeMenu = React.useCallback((items: Completion[], at: number) => {
    const ta = taRef.current;
    if (!ta) return;
    const height = Math.min(items.length, 8) * ROW_HEIGHT + MENU_CHROME;
    const { top, left } = menuPosition(ta, at, MENU_WIDTH, height);
    setMenu((prev) =>
      prev && prev.top === top && prev.left === left && prev.items === items
        ? prev
        : { items, active: 0, top, left },
    );
  }, []);

  // Rebuild the candidate list whenever the text or caret moves.
  // `caret` is only a trigger — the real position is read from the DOM, because
  // event ordering (input vs. select vs. keyup) can leave the state one step behind.
  React.useEffect(() => {
    if (!completions?.length || readOnly) {
      setMenu(null);
      return;
    }
    const ta = taRef.current;
    if (!ta || !focused.current) {
      setMenu(null);
      return;
    }

    const at = ta.selectionStart;
    if (dismissed.current === at || inNoSuggestZone(value, at)) {
      setMenu(null);
      return;
    }

    const word = wordBefore(value, at);
    if (!word.prefix && !word.scope) {
      setMenu(null);
      return;
    }

    const items = rankCompletions(completions, word.prefix, word.scope);
    if (items.length === 0) {
      setMenu(null);
      return;
    }

    const height = Math.min(items.length, 8) * ROW_HEIGHT + MENU_CHROME;
    const { top, left } = menuPosition(ta, at, MENU_WIDTH, height);
    setMenu((prev) => {
      const sameList =
        prev && prev.items.length === items.length && prev.items.every((it, i) => it === items[i]);
      if (prev && sameList) return { ...prev, top, left };
      return { items, active: 0, top, left };
    });
  }, [value, caret, completions, readOnly]);

  const accept = (item: Completion) => {
    const ta = taRef.current;
    const at = ta?.selectionStart ?? caret;
    if (at === null) return;

    const word = wordBefore(value, at);
    const after = value.slice(word.end);

    let insert = item.label;
    if (item.kind === 'function' && after[0] !== '(') insert = `${item.label}(`;
    else if (item.kind === 'keyword' && (!after || !/^[\s,;)]/.test(after))) insert = `${item.label} `;

    const next = value.slice(0, word.start) + insert + after;
    const pos = word.start + insert.length;

    onChange(next);
    dismissed.current = pos;
    setCaret(pos);
    setMenu(null);
    requestAnimationFrame(() => {
      ta?.focus();
      ta?.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      setMenu(null);
      onRun?.();
      return;
    }

    if (menu && menu.items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMenu({ ...menu, active: (menu.active + 1) % menu.items.length });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMenu({ ...menu, active: (menu.active - 1 + menu.items.length) % menu.items.length });
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        accept(menu.items[menu.active]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissed.current = taRef.current?.selectionStart ?? null;
        setMenu(null);
        return;
      }
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
        setCaret(start + 2);
      });
    }
  };

  const trackCaret = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCaret(e.currentTarget.selectionStart);
  };

  return (
    <div
      className={cn(
        'relative flex overflow-hidden rounded-[12px] border-[2.5px] border-edge bg-elevated font-mono text-[0.8125rem] leading-[1.65] transition-[border-color,box-shadow] focus-within:border-grape focus-within:shadow-[3px_3px_0_0_var(--grape)]',
        className,
      )}
      style={{ minHeight }}
    >
      {wide && (
        <div
          ref={gutterRef}
          aria-hidden
          className="w-9 shrink-0 select-none overflow-hidden border-r-[1.5px] border-border bg-muted py-3 text-right text-[0.75rem] text-tertiary"
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
          onChange={(e) => {
            focused.current = true;
            onChange(e.target.value);
            setCaret(e.target.selectionStart);
          }}
          onScroll={() => {
            syncScroll();
            const ta = taRef.current;
            if (menu && ta) placeMenu(menu.items, ta.selectionStart);
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={trackCaret}
          onClick={trackCaret}
          onSelect={trackCaret}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            setMenu(null);
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap={wrap ? 'soft' : 'off'}
          readOnly={readOnly}
          aria-label={ariaLabel}
          aria-autocomplete={completions?.length ? 'list' : undefined}
          aria-expanded={!!menu}
          placeholder={placeholder}
          className={cn(
            'absolute inset-0 h-full w-full resize-none bg-transparent p-3 text-transparent caret-primary outline-none placeholder:text-tertiary selection:bg-primary/25',
            wrap ? 'overflow-y-auto break-words no-scrollbar' : 'overflow-auto whitespace-pre',
          )}
        />
      </div>

      {menu &&
        createPortal(
          <div
            role="listbox"
            aria-label="Suggestions"
            style={{ position: 'fixed', top: menu.top, left: menu.left, width: MENU_WIDTH }}
            className="z-[90] overflow-hidden rounded-[12px] border-[2.5px] border-edge bg-popover shadow-hard-lg"
          >
            <ul className="max-h-[240px] overflow-y-auto py-1">
              {menu.items.map((item, i) => {
                const glyph = GLYPH[item.kind];
                return (
                  <li
                    key={`${item.kind}:${item.parent ?? ''}:${item.label}`}
                    role="option"
                    aria-selected={i === menu.active}
                    onMouseEnter={() => setMenu((m) => (m ? { ...m, active: i } : m))}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      accept(item);
                    }}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 px-2 py-[3px]',
                      i === menu.active && 'bg-primary/15',
                    )}
                  >
                    <span
                      className={cn(
                        'w-3 shrink-0 text-center font-mono text-[0.5625rem] font-semibold',
                        glyph.className,
                      )}
                      aria-hidden
                    >
                      {glyph.ch}
                    </span>
                    <span
                      className={cn(
                        'truncate font-mono text-[0.6875rem]',
                        i === menu.active ? 'text-primary-ink' : 'text-foreground',
                      )}
                    >
                      {item.label}
                    </span>
                    {item.detail && (
                      <span className="ml-auto shrink-0 font-mono text-[0.5rem] uppercase tracking-wider text-muted-foreground">
                        {item.detail}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-border px-2 py-1 font-mono text-[0.5rem] uppercase tracking-widest text-tertiary">
              <span>↑↓ move · tab insert</span>
              <span>esc</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
