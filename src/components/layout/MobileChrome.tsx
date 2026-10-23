import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Flame, Menu, Moon, Sun } from 'lucide-react';
import { Logo } from './Logo';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { useProgress, STACKS } from '@/lib/progress';
import { useTheme } from '@/lib/theme';
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
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:hidden">
      <Logo showWord={false} />
      <div className="flex items-center gap-2">
        <Badge variant="lime" className="h-6 gap-1 px-2 normal-case tracking-normal">
          <span className="numeric text-[0.625rem] font-bold">Lv {level.level}</span>
        </Badge>
        <span className="inline-flex items-center gap-0.5 font-mono text-[0.625rem] text-muted-foreground">
          <Flame className="h-3 w-3 text-amber" />
          {state.streak}
        </span>
        <button
          type="button"
          onClick={toggle}
          className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="rounded-sm p-1.5 text-foreground transition-colors hover:bg-elevated"
              aria-label="Open menu"
            >
              <Menu className="h-4.5 w-4.5" />
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
                      'flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors',
                      isActive ? 'bg-elevated text-foreground' : 'text-muted-foreground hover:bg-elevated/60',
                    )
                  }
                >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
                      {item.blurb}
                    </div>
                  </div>
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function StackPill({ id, label, short }: { id: 'go' | 'node' | 'php'; label: string; short: string }) {
  const { state, setActiveStack } = useProgress();
  return (
    <button
      type="button"
      onClick={() => setActiveStack(id)}
      className={cn(
        'flex-1 rounded-sm border px-2 py-2 font-mono text-[0.625rem] uppercase tracking-wider transition-colors',
        state.activeStack === id
          ? 'border-primary/50 bg-primary/10 text-primary'
          : 'border-border text-muted-foreground',
      )}
      aria-label={`Switch to ${label}`}
    >
      {short}
    </button>
  );
}

export function MobileNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[0.5625rem] font-medium uppercase tracking-wider transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute top-0 h-[2px] w-8 rounded-full transition-opacity',
                    isActive ? 'bg-primary opacity-100' : 'opacity-0',
                  )}
                />
                <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.7} />
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
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-primary" />
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
