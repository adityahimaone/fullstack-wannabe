import { cn } from '@/lib/utils';

/**
 * No shimmer gradient — the brand has no gradients. A skeleton is just a
 * muted slab that breathes, which is enough to read as "content on its way".
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-[10px] border-[1.5px] border-border bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
