import { cn } from '@/lib/utils';

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[7px] border border-border bg-elevated">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            d="M6 5h5.5a7 7 0 0 1 0 14H6V5Z"
            fill="none"
            stroke="var(--lime)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M6 12h5.5" stroke="var(--lime)" strokeWidth="2" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber" />
      </div>
      {showWord && (
        <div className="min-w-0 leading-none">
          <div className="display truncate text-[0.9375rem] leading-none tracking-tight">
            fullstack <span className="text-primary">wannabe</span>
          </div>
          <div className="mt-1 truncate font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
            schema → api
          </div>
        </div>
      )}
    </div>
  );
}
