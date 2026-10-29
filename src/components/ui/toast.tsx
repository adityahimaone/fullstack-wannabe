import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'error' | 'xp';

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

interface ToastContextValue {
  push: (toast: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  error: AlertTriangle,
  xp: Sparkles,
};

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  default: 'text-muted-foreground',
  success: 'text-mint-ink',
  error: 'text-destructive',
  xp: 'text-mango-ink',
};

/* The edge of the toast carries the state, so the state is not colour-only. */
const VARIANT_EDGE: Record<ToastVariant, string> = {
  default: 'border-edge',
  success: 'border-mint',
  error: 'border-destructive',
  xp: 'border-mango',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (toast: ToastInput) => {
      const id = ++counter.current;
      setItems((prev) => [...prev.slice(-3), { ...toast, id }]);
      const duration = toast.duration ?? 4200;
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end md:px-0"
        role="region"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const variant = item.variant ?? 'default';
            const Icon = VARIANT_ICON[variant];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[14px] border-[2.5px] bg-popover p-3 pr-2 shadow-hard-lg',
                  VARIANT_EDGE[variant],
                )}
              >
                <div className={cn('mt-0.5', VARIANT_ACCENT[variant])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] font-semibold leading-snug">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
