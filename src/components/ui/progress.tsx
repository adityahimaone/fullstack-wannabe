import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

/**
 * The XP meter is eight segments, not a smooth bar (DESIGN.md §5).
 * Segments make progress legible at a glance — "six of eight" beats "73%" —
 * and they give the level system something to celebrate, one notch at a time.
 *
 * The leading segment fills proportionally with a hard edge, so the meter
 * still moves continuously without ever becoming a gradient.
 */
export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Colour of the filled segments. */
  indicatorClassName?: string;
  /** How many notches. Fewer for the tiny inline meter in the collapsed rail. */
  segments?: number;
  size?: 'sm' | 'md';
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, indicatorClassName, segments = 8, size = 'md', ...props }, ref) => {
    const pct = Math.max(0, Math.min(100, value ?? 0));
    const filled = (pct / 100) * segments;

    return (
      <ProgressPrimitive.Root
        ref={ref}
        value={pct}
        className={cn(
          'flex w-full',
          size === 'md' ? 'h-2.5 gap-[3px]' : 'h-1.5 gap-[2px]',
          className,
        )}
        {...props}
      >
        {Array.from({ length: segments }, (_, i) => {
          const fill = Math.max(0, Math.min(1, filled - i));
          return (
            <span
              key={i}
              aria-hidden
              className={cn(
                'relative block min-w-[2px] flex-1 overflow-hidden bg-muted',
                size === 'md'
                  ? 'rounded-[3px] border-[1.5px] border-edge'
                  : 'rounded-[2px] border border-edge',
              )}
            >
              <span
                className={cn('block h-full bg-primary transition-[width] duration-300', indicatorClassName)}
                style={{ width: `${fill * 100}%` }}
              />
            </span>
          );
        })}
      </ProgressPrimitive.Root>
    );
  },
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
