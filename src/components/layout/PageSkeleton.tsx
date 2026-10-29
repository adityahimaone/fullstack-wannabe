import { Skeleton } from '@/components/ui/skeleton';

/**
 * The fallback for a lazy route.
 *
 * It renders INSIDE AppShell's padded container, on purpose. It used to sit
 * outside — the Suspense boundary wrapped `<Routes>`, which contains the shell
 * itself, so any lazy chunk suspended the whole layout: sidebar gone, skeleton
 * jammed against the viewport edge with no gutter. That is the "no outer
 * margin" bug, and the margin was never the actual problem.
 *
 * The shape mirrors a real page (eyebrow, title, action, body + rail) so the
 * swap to real content is a fill-in, not a reflow.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>

      <div className="flex items-end justify-between gap-4 px-1 pb-1">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-7 w-52 sm:w-64" />
        </div>
        <Skeleton className="hidden h-9 w-32 rounded-full sm:block" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-[58vh] min-h-[380px]" />
        <div className="hidden space-y-3 lg:block">
          <Skeleton className="h-[26vh] min-h-[168px]" />
          <Skeleton className="h-[30vh] min-h-[196px]" />
        </div>
      </div>
    </div>
  );
}
