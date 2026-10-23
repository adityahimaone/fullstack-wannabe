/**
 * Shared autocomplete primitives for the code editor.
 *
 * The editor is a transparent <textarea> laid over a highlighted <pre>, so the
 * caret has no DOM node to anchor to — `caretPoint()` measures one with a
 * throwaway mirror element instead.
 */

export type CompletionKind = 'keyword' | 'table' | 'column' | 'function';

export interface Completion {
  /** text inserted when accepted */
  label: string;
  kind: CompletionKind;
  /** right-aligned hint: column type, row count, … */
  detail?: string;
  /** owning table, so `orders.` can narrow to that table's columns */
  parent?: string;
}

const IDENT = /[A-Za-z_][A-Za-z0-9_]*$/;
const KIND_ORDER: Record<CompletionKind, number> = { table: 0, column: 1, function: 2, keyword: 3 };

export interface WordContext {
  /** the partial identifier being typed */
  prefix: string;
  /** index where that identifier starts */
  start: number;
  /** index of the caret */
  end: number;
  /** identifier before a trailing dot, e.g. `orders` in `orders.us|` */
  scope?: string;
}

export function wordBefore(text: string, caret: number): WordContext {
  const upto = text.slice(0, caret);
  const match = IDENT.exec(upto);
  const prefix = match ? match[0] : '';
  const start = caret - prefix.length;

  let scope: string | undefined;
  if (start > 0 && upto[start - 1] === '.') {
    const owner = IDENT.exec(upto.slice(0, start - 1));
    if (owner) scope = owner[0];
  }

  return { prefix, start, end: caret, scope };
}

/** True when the caret sits inside a `--` comment or an odd-quoted string. */
export function inNoSuggestZone(text: string, caret: number): boolean {
  const lineStart = text.lastIndexOf('\n', caret - 1) + 1;
  const line = text.slice(lineStart, caret);
  if (line.includes('--')) return true;
  return (line.match(/'/g) ?? []).length % 2 === 1;
}

export function rankCompletions(all: Completion[], prefix: string, scope?: string): Completion[] {
  const needle = prefix.toLowerCase();
  const seen = new Set<string>();
  const out: Completion[] = [];

  for (const item of all) {
    if (scope) {
      // `orders.` means exactly that table's columns — nothing else is valid there.
      if (item.parent !== scope) continue;
    }
    if (needle && !item.label.toLowerCase().startsWith(needle)) continue;

    const key = scope ? `${item.parent}.${item.label}` : item.label;
    if (seen.has(key)) continue;
    seen.add(key);

    // Unqualified columns are ambiguous, so name their table instead of the type.
    out.push(!scope && item.kind === 'column' && item.parent ? { ...item, detail: item.parent } : item);
  }

  out.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.label.localeCompare(b.label));
  return out.slice(0, 8);
}

const MIRROR_PROPS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'textIndent',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'wordBreak',
  'overflowWrap',
  'tabSize',
] as const;

/**
 * Caret offset (relative to the textarea's padding box, before scrolling) by
 * replaying the text into an identically-styled hidden element.
 */
export function caretPoint(ta: HTMLTextAreaElement, index: number): { top: number; left: number } {
  const cs = window.getComputedStyle(ta);
  const mirror = document.createElement('div');
  mirror.setAttribute('aria-hidden', 'true');
  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.width = `${ta.clientWidth}px`;
  mirror.style.whiteSpace = ta.wrap === 'off' ? 'pre' : 'pre-wrap';
  for (const prop of MIRROR_PROPS) mirror.style[prop] = cs[prop];

  mirror.textContent = ta.value.slice(0, index);
  const marker = document.createElement('span');
  marker.textContent = ta.value.slice(index, index + 1) || '.';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const point = { top: marker.offsetTop, left: marker.offsetLeft };
  document.body.removeChild(mirror);
  return point;
}

/** Fixed-position anchor for the menu, flipped when it would fall off-screen. */
export function menuPosition(
  ta: HTMLTextAreaElement,
  index: number,
  menuWidth: number,
  menuHeight: number,
): { top: number; left: number } {
  const rect = ta.getBoundingClientRect();
  const point = caretPoint(ta, index);
  const lineHeight = parseFloat(window.getComputedStyle(ta).lineHeight) || 20;

  const anchorTop = rect.top + point.top - ta.scrollTop;
  const viewportH = window.visualViewport?.height ?? window.innerHeight;

  let left = rect.left + point.left - ta.scrollLeft;
  left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

  let top = anchorTop + lineHeight + 4;
  if (top + menuHeight > viewportH - 8) {
    top = Math.max(8, anchorTop - menuHeight - 4);
  }
  return { top, left };
}
