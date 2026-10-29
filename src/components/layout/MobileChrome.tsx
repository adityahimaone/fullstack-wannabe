import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Flame, Menu, Moon, Palette, Sun } from 'lucide-react';
import { Logo } from './Logo';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { useProgress, STACKS, type Stack } from '@/lib/progress';
import { useTheme } from '@/lib/theme';
import { WORLD_HAT, WORLD_ON, useWorld } from '@/lib/world';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetGrabber,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function MobileHeader() {
  const { state, level } = useProgress();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b-[2.5px] border-edge bg-surface px-4 lg:hidden">
      <Logo showWord={false} />
      <div className="flex items-center gap-2">
        <Badge variant="lime" className="h-6 gap-1 px-2 normal-case tracking-normal">
          <span className="numeric text-[0.625rem] font-bold">Lv {level.level}</span>
        </Badge>
        <span className="inline-flex items-center gap-0.5 font-mono text-[0.625rem] text-muted-foreground">
          <Flame className="h-3 w-3 text-mango-ink" />
          {state.streak}
        </span>
        <button
          type="button"
          onClick={toggle}
          className="rounded-[8px] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="rounded-[8px] p-1.5 text-foreground transition-colors hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[86%] max-w-[330px] p-0">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>{state.xp} XP · {level.title}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-1 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-start gap-3 rounded-[12px] border-[2px] px-3 py-2.5 transition-colors',
                      isActive
                        ? 'border-edge bg-elevated'
                        : 'border-transparent text-muted-foreground hover:bg-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border-[2px]',
                          isActive ? 'border-edge' : 'border-border/70',
                        )}
                        style={
                          isActive
                            ? { background: WORLD_HAT[item.world], color: WORLD_ON[item.world] }
                            : undefined
                        }
                      >
                        <item.icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.3 : 1.8} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
                          {item.blurb}
                        </div>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            <div className="mt-auto border-t border-border p-4">
              <p className="eyebrow mb-2">Active stack</p>
              <div className="flex gap-1.5">
                {STACKS.map((s) => (
                  <StackPill key={s.id} id={s.id} label={s.label} short={s.short} />
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between font-mono text-[0.625rem] text-muted-foreground">
                  <span>Level {level.level}</span>
                  <span>{level.next ? `${level.toNext} XP to go` : 'max rank'}</span>
                </div>
                <Progress value={level.progress} />
              </div>
              <NavLink
                to="/design-system"
                className="mt-3 flex items-center gap-2 rounded-[10px] border-[2px] border-edge bg-elevated px-3 py-2 text-[0.75rem] font-medium shadow-hard-sm"
              >
                <Palette className="h-3.5 w-3.5" />
                Design system
              </NavLink>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function StackPill({ id, label, short }: { id: Stack; label: string; short: string }) {
  const { state, setActiveStack } = useProgress();
  return (
    <button
      type="button"
      onClick={() => setActiveStack(id)}
      className={cn(
        'flex-1 rounded-[8px] border-[2px] px-2 py-2 font-mono text-[0.625rem] uppercase tracking-wider transition-colors',
        state.activeStack === id
          ? 'border-edge bg-secondary font-semibold text-foreground'
          : 'border-transparent text-muted-foreground',
      )}
      aria-label={`Switch to ${label}`}
    >
      {short}
    </button>
  );
}

export function MobileNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-[2.5px] border-edge bg-surface lg:hidden">
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-2 text-[0.5625rem] font-medium uppercase tracking-wider transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-[8px] border-[2px] transition-colors',
                    isActive ? 'border-edge' : 'border-transparent',
                  )}
                  style={
                    isActive
                      ? { background: WORLD_HAT[item.world], color: WORLD_ON[item.world] }
                      : undefined
                  }
                >
                  <item.icon className="h-[16px] w-[16px]" strokeWidth={isActive ? 2.3 : 1.8} />
                </span>
                {item.short}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Small helper used by pages that need a mobile-only drawer trigger. */
export function DrawerSheet({
  trigger,
  title,
  description,
  children,
  side = 'bottom',
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: 'bottom' | 'right';
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side={side} className={side === 'bottom' ? 'px-0' : 'px-0'}>
        {side === 'bottom' && <SheetGrabber />}
        <SheetHeader className="border-b-0 pb-1">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const world = useWorld();

  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-[3px] border-[1.5px] border-edge"
            style={{ background: WORLD_HAT[world] }}
            aria-hidden
          />
          <p className="eyebrow">{eyebrow}</p>
        </div>
        <h1 className="display mt-2 text-[1.75rem] leading-[1.05] sm:text-[2.15rem]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-pretty text-[0.8125rem] leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
