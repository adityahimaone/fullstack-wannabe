import * as React from 'react';
import { ChevronRight, FileCode2, FileJson, FileText, Folder, FolderOpen, Database } from 'lucide-react';
import type { StackFile } from './trees';
import { cn } from '@/lib/utils';

interface TreeNode {
  name: string;
  path: string;
  dir: boolean;
  step: number;
  file?: StackFile;
  children: TreeNode[];
}

export function buildTree(files: StackFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  const insert = (nodes: TreeNode[], parts: string[], file: StackFile, fullPath: string) => {
    const [head, ...rest] = parts;
    if (rest.length === 0) {
      nodes.push({ name: head, path: fullPath, dir: false, step: file.step, file, children: [] });
      return;
    }
    let dir = nodes.find((n) => n.dir && n.name === head);
    if (!dir) {
      dir = { name: head, path: parts.slice(0, parts.length - rest.length).join('/'), dir: true, step: 0, children: [] };
      nodes.push(dir);
    }
    insert(dir.children, rest, file, fullPath);
  };

  files.forEach((file) => insert(root, file.path.split('/'), file, file.path));

  const sort = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      if (a.dir !== b.dir) return a.dir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sort(n.children));
    // roll up the lowest step number for directory badges
    const roll = (n: TreeNode): number => {
      if (!n.dir) return n.step;
      const steps = n.children.map(roll).filter((s) => s > 0);
      n.step = steps.length ? Math.min(...steps) : 0;
      return n.step;
    };
    nodes.forEach(roll);
    return nodes;
  };

  return sort(root);
}

function iconFor(node: TreeNode, open: boolean) {
  if (node.dir) {
    const Icon = open ? FolderOpen : Folder;
    return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (node.name.endsWith('.json') || node.name.endsWith('.prisma')) {
    return <FileJson className="h-3.5 w-3.5 text-mango-ink" />;
  }
  if (node.name.endsWith('.sql')) return <Database className="h-3.5 w-3.5 text-cyan-ink" />;
  if (node.name.endsWith('.md')) return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
  return <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function FolderTree({
  files,
  activePath,
  onSelect,
  activeStep,
  traceStep,
}: {
  files: StackFile[];
  activePath: string;
  onSelect: (file: StackFile) => void;
  activeStep: number | null;
  traceStep: number | null;
}) {
  const tree = React.useMemo(() => buildTree(files), [files]);
  const [open, setOpen] = React.useState<Set<string>>(() => new Set());

  // Open every directory on first render so the architecture is visible at a glance.
  React.useEffect(() => {
    const all = new Set<string>();
    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (n.dir) {
          all.add(n.path);
          walk(n.children);
        }
      });
    };
    walk(tree);
    setOpen(all);
  }, [tree]);

  const toggle = (path: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNodes = (nodes: TreeNode[], depth = 0): React.ReactNode =>
    nodes.map((node) => {
      const isOpen = open.has(node.path);
      const isActive = node.path === activePath;
      const dimmed = activeStep !== null && node.step > 0 && node.step !== activeStep && !node.dir;
      const traced = traceStep !== null && node.step === traceStep && !node.dir;

      return (
        <div key={node.path}>
          <button
            type="button"
            onClick={() => (node.dir ? toggle(node.path) : node.file && onSelect(node.file))}
            className={cn(
              'group flex w-full items-center gap-1.5 rounded-sm py-[3px] pr-1.5 text-left transition-colors',
              isActive
                ? 'bg-primary/12 text-foreground'
                : cn(
                    'hover:bg-elevated hover:text-foreground',
                    // `opacity-40` on a whole row is 1.8:1 — the file name stops
                    // being text and becomes texture. Step down the ramp instead.
                    dimmed ? 'text-tertiary' : 'text-muted-foreground',
                  ),
              traced && 'bg-amber/15 text-foreground ring-1 ring-inset ring-amber/40',
            )}
            style={{ paddingLeft: 6 + depth * 12 }}
          >
            {node.dir ? (
              <ChevronRight
                className={cn('h-3 w-3 shrink-0 text-tertiary transition-transform', isOpen && 'rotate-90')}
              />
            ) : (
              <span className="w-3 shrink-0" />
            )}
            {iconFor(node, isOpen)}
            <span className="min-w-0 flex-1 truncate font-mono text-[0.6875rem]">{node.name}</span>
            {node.step > 0 && (
              <span
                className={cn(
                  'numeric shrink-0 rounded-sm border px-1 font-mono text-[0.5rem] leading-4',
                  isActive || traced
                    ? 'border-primary/40 text-primary-ink'
                    : 'border-border/70 text-muted-foreground',
                )}
              >
                {node.step}
              </span>
            )}
          </button>
          {node.dir && isOpen && node.children.length > 0 && (
            <div className="relative">
              <span
                aria-hidden
                className="absolute bottom-0 top-0 border-l border-border/40"
                style={{ left: 12 + depth * 12 }}
              />
              {renderNodes(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  return <div className="-mx-1">{renderNodes(tree)}</div>;
}
