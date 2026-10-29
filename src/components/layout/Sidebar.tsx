import { NavLink } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  Flame,
  Moon,
  Palette,
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
import { WORLD_HAT, WORLD_ON } from '@/lib/world';

/**
 * The rail is the only permanently-visible piece of chrome, so it carries the
 * most identity: an opaque sheet of paper with a 2.5px cut down its right edge,
 * and one coloured tile per module. The tile is the mark's hat, at nav scale —
 * the same shape, the same one-colour rule.
 */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { state, level, setActiveStack, resetAll } = useProgress();
  const { theme, toggle } = useTheme();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r-[2.5px] border-edge bg-surface transition-[width] duration-300 ease-out-expo lg:flex',
        collapsed ? 'w-[76px]' : 'w-[252px]',
      )}
    >
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <Logo showWord={!collapsed} />
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'rounded-[8px] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            collapsed &&
              'absolute -right-3.5 top-[52px] z-50 border-[2px] border-edge bg-elevated shadow-hard-sm',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className={cn('mt-2 flex flex-1 flex-col gap-1', collapsed ? 'px-2' : 'px-2.5')}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-[12px] px-1.5 py-1.5 text-sm transition-colors duration-150',
                isActive
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border-[2px] transition-[background-color,border-color,box-shadow] duration-150',
                    isActive
                      ? 'border-edge shadow-hard-sm'
                      : 'border-border/70 group-hover:border-edge',
                  )}
                  style={
                    isActive
                      ? { background: WORLD_HAT[item.world], color: WORLD_ON[item.world] }
                      : undefined
                  }
                >
                  <item.icon className="h-4 w-4" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden />
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    <span
                      className={cn(
                        'numeric text-[0.5625rem] tracking-[0.14em]',
                        isActive ? 'text-foreground' : 'text-tertiary',
                      )}
                    >
                      {item.code}
                    </span>
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className={cn('mt-5', collapsed && 'mt-6')}>
          {!collapsed && <p className="eyebrow mb-2 px-2">Stack</p>}
          <div className={cn('flex gap-1', collapsed && 'flex-col')}>
            {STACKS.map((s) => {
              const on = state.activeStack === s.id;
              return (
                <Tooltip key={s.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setActiveStack(s.id)}
                      className={cn(
                        'flex-1 rounded-[8px] border-[2px] px-1.5 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider transition-colors duration-150',
                        on
                          ? 'border-edge bg-secondary font-semibold text-foreground'
                          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                      )}
                    >
                      {s.short}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{s.label} track</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t-[1.5px] border-border p-2.5">
        <div
          className={cn(
            'rounded-[12px] border-[2px] border-edge bg-elevated',
            collapsed ? 'flex flex-col items-center gap-2 p-2' : 'p-3',
          )}
        >
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="numeric text-[0.6875rem] font-bold text-mango-ink">
                    L{level.level}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {level.title} · {state.xp} XP
                </TooltipContent>
              </Tooltip>
              <Progress value={level.progress} segments={4} size="sm" className="w-8" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="eyebrow">Operator</span>
                <Badge variant="amber" className="normal-case tracking-normal">
                  Lv {level.level}
                </Badge>
              </div>
              <p className="display mt-1.5 truncate text-sm">{level.title}</p>
              <Progress value={level.progress} className="mt-2.5" />
              <div className="mt-2 flex items-center justify-between font-mono text-[0.625rem] text-muted-foreground">
                <span className="numeric">{state.xp} XP</span>
                <span>{level.next ? `${level.toNext} to Lv ${level.next.level}` : 'max rank'}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3 border-t-[1.5px] border-border pt-2 font-mono text-[0.625rem] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-3 w-3 text-mango-ink" />
                  <span className="numeric">{state.streak}d</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 text-grape-ink" />
                  <span className="numeric">
                    {state.badges.length}/{6}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>

        <div className={cn('mt-2 flex gap-1', collapsed && 'flex-col')}>
          <Button variant="ghost" size="xs" onClick={toggle} className="flex-1 justify-start gap-2">
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {!collapsed && (
              <span className="text-[0.6875rem]">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            )}
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

        <NavLink
          to="/design-system"
          title={collapsed ? 'Design system' : undefined}
          className={({ isActive }) =>
            cn(
              'mt-1 flex items-center gap-2 rounded-[8px] px-1.5 py-1.5 transition-colors',
              collapsed && 'justify-center',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Palette className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && (
            <span className="text-[0.6875rem] font-medium">Design system</span>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
