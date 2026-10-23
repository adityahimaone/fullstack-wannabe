import { NavLink } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  Flame,
  Moon,
  RotateCcw,
  Shield,
  Sun,
} from 'lucide-react';
import { Logo } from './Logo';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProgress, STACKS } from '@/lib/progress';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { state, level, setActiveStack, resetAll } = useProgress();
  const { theme, toggle } = useTheme();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface/80 backdrop-blur-xl transition-[width] duration-300 ease-out-expo lg:flex',
        collapsed ? 'w-[76px]' : 'w-[252px]',
      )}
    >
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <Logo showWord={!collapsed} />
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground',
            collapsed && 'absolute -right-3 top-[52px] z-50 border border-border bg-surface',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-2.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors duration-200',
                isActive
                  ? 'bg-elevated text-foreground'
                  : 'text-muted-foreground hover:bg-elevated/60 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full transition-all duration-200',
                    isActive ? 'bg-primary opacity-100' : 'opacity-0',
                  )}
                />
                <item.icon
                  className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    <span className="font-mono text-[0.625rem] tracking-widest text-muted-foreground/60">
                      {item.code}
                    </span>
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className={cn('mt-5', collapsed && 'mt-6')}>
          {!collapsed && <p className="eyebrow mb-2 px-2.5">Active stack</p>}
          <div className={cn('flex gap-1 px-1', collapsed && 'flex-col px-1.5')}>
            {STACKS.map((s) => (
              <Tooltip key={s.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveStack(s.id)}
                    className={cn(
                      'flex-1 rounded-sm border px-1.5 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider transition-all duration-200',
                      state.activeStack === s.id
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
                    )}
                  >
                    {s.short}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{s.label} track</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-2.5">
        <div
          className={cn(
            'rounded-md border border-border bg-elevated/50 p-3',
            collapsed && 'flex flex-col items-center gap-2 p-2',
          )}
        >
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="numeric text-[0.6875rem] font-bold text-primary">L{level.level}</div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {level.title} · {state.xp} XP
                </TooltipContent>
              </Tooltip>
              <Progress value={level.progress} className="h-1 w-8" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="eyebrow">Operator</span>
                <Badge variant="lime" className="normal-case tracking-normal">
                  Lv {level.level}
                </Badge>
              </div>
              <p className="display mt-1.5 truncate text-sm">{level.title}</p>
              <Progress value={level.progress} className="mt-2" />
              <div className="mt-2 flex items-center justify-between font-mono text-[0.625rem] text-muted-foreground">
                <span className="numeric">{state.xp} XP</span>
                <span>{level.next ? `${level.toNext} to Lv ${level.next.level}` : 'max rank'}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3 border-t border-border/70 pt-2 font-mono text-[0.625rem] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-3 w-3 text-amber" />
                  <span className="numeric">{state.streak}d</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 text-violet" />
                  <span className="numeric">{state.badges.length}/{6}</span>
                </span>
              </div>
            </>
          )}
        </div>

        <div className={cn('mt-2 flex gap-1', collapsed && 'flex-col')}>
          <Button variant="ghost" size="xs" onClick={toggle} className="flex-1 justify-start gap-2">
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {!collapsed && <span className="text-[0.6875rem]">{theme === 'dark' ? 'Light' : 'Dark'}</span>}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              if (confirm('Reset all XP, quests, challenges and badges?')) resetAll();
            }}
            className="flex-1 justify-start gap-2 text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {!collapsed && <span className="text-[0.6875rem]">Reset</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
