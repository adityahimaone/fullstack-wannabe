import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { WanniMark, WanniWordmark } from '@/components/brand/marks';
import { WORLD_HAT, useWorld } from '@/lib/world';

/**
 * The mark, wearing the hat of the module you are standing in.
 *
 * The header strip is the only thing that changes between worlds — that is
 * the whole identity in one variable. If you can see which colour Wanni is
 * wearing, you know where you are.
 */
export function Logo({
  className,
  showWord = true,
  world,
}: {
  className?: string;
  showWord?: boolean;
  world?: keyof typeof WORLD_HAT;
}) {
  const routeWorld = useWorld();
  const w = world ?? routeWorld;

  return (
    <Link
      to="/"
      aria-label="fullstack wannabe — home"
      className={cn('group flex min-w-0 items-center gap-2.5', className)}
    >
      <span className="shrink-0 transition-transform duration-300 ease-pop group-hover:-rotate-6">
        <WanniMark size={showWord ? 34 : 30} hat={WORLD_HAT[w]} />
      </span>
      {showWord && (
        <span className="min-w-0 leading-none">
          <WanniWordmark height={18} className="block max-w-full" />
          <span className="mt-1.5 block truncate font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
            schema → api
          </span>
        </span>
      )}
    </Link>
  );
}
