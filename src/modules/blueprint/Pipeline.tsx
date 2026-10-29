import { Check, Database, FileCode2, Layers, Network, Server, Waypoints } from 'lucide-react';
import { STEPS } from './trees';
import { cn } from '@/lib/utils';

const ICONS = [Database, FileCode2, Layers, Waypoints, Server, Network];

export function Pipeline({
  activeStep,
  doneSteps,
  traceStep,
  onSelect,
}: {
  activeStep: number;
  doneSteps: number[];
  traceStep: number | null;
  onSelect: (step: number) => void;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute left-3 right-3 top-[30px] hidden h-px bg-border lg:block"
      />
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar lg:grid lg:grid-cols-6 lg:gap-1.5 lg:overflow-visible">
        {STEPS.map((step, i) => {
          const Icon = ICONS[i];
          const active = step.step === activeStep;
          const done = doneSteps.includes(step.step);
          const traced = traceStep === step.step;

          return (
            <button
              key={step.step}
              type="button"
              onClick={() => onSelect(step.step)}
              title={`${step.name} — ${step.teaches}`}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'group relative z-10 flex w-[150px] shrink-0 flex-col items-start gap-1 rounded-sm border px-2 py-2 text-left transition-all duration-200 lg:w-full',
                active
                  ? 'border-primary/60 bg-primary/[0.07]'
                  : 'border-border bg-surface hover:border-muted-foreground/40',
                traced && 'border-amber/70 bg-amber/10 shadow-[0_0_0_1px_color-mix(in_oklch,var(--amber)_35%,transparent)]',
              )}
            >
              <div className="flex w-full items-center gap-1.5">
                <span
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition-colors',
                    done
                      ? 'border-primary/50 bg-primary/15 text-primary-ink'
                      : active
                        ? 'border-primary/50 text-primary-ink'
                        : 'border-border text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : <Icon className="h-3 w-3" />}
                </span>
                <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
                  0{step.step}
                </span>
                {traced && (
                  <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-amber" aria-hidden />
                )}
              </div>
              <span
                className={cn(
                  'text-[0.6875rem] font-medium leading-tight',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.short}
              </span>
              {/* The wide (w-[150px]) scroller cards have room for the hint; the
                  6-up grid at lg does not, so it is hidden there instead. */}
              <span className="truncate font-mono text-[0.5rem] uppercase leading-tight tracking-wider text-tertiary lg:hidden">
                {step.teaches.split(',')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
