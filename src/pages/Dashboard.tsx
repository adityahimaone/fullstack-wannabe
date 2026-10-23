import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Boxes,
  Braces,
  Flame,
  Network,
  Sparkles,
  SquareTerminal,
  Target,
} from 'lucide-react';
import { useProgress, BADGES, levelInfo } from '@/lib/progress';
import { useErd } from '@/modules/erd/store';
import { QUESTS } from '@/modules/sql/quests';
import { CHALLENGES } from '@/modules/dojo/challenges';
import { schemaStats } from '@/modules/erd/sql';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const MODULE_META = [
  {
    to: '/erd',
    code: '01',
    name: 'Schema Studio',
    kicker: 'Architect mode',
    blurb: 'Draw entities, wire 1:N and N:M relations, compile DDL in three dialects.',
    icon: Boxes,
  },
  {
    to: '/sql',
    code: '02',
    name: 'Query Arena',
    kicker: 'Five worlds',
    blurb: 'Real SQLite in the browser, quests verified against the actual result set.',
    icon: SquareTerminal,
  },
  {
    to: '/dojo',
    code: '03',
    name: 'Polyglot Dojo',
    kicker: 'Three stacks',
    blurb: 'Go maps, JS array methods, Laravel collections — same payload, three idioms.',
    icon: Braces,
  },
  {
    to: '/blueprint',
    code: '04',
    name: 'API Blueprint',
    kicker: 'Six layers',
    blurb: 'Migration to router, with a folder tree and a request tracer you can fire.',
    icon: Network,
  },
];

export function Dashboard() {
  const { state, level, hasBadge } = useProgress();
  const { schema, seed } = useErd();
  const stats = schemaStats(schema);

  const questPct = Math.round((state.quests.length / QUESTS.length) * 100);
  const dojoPct = Math.round((state.challenges.length / CHALLENGES.length) * 100);
  const stepPct = Math.round((state.steps.length / 18) * 100);

  const moduleProgress = [
    { ...MODULE_META[0], metric: `${stats.tables} tables`, pct: schema.tables.length > 0 ? 100 : 0 },
    { ...MODULE_META[1], metric: `${state.quests.length}/${QUESTS.length} quests`, pct: questPct },
    { ...MODULE_META[2], metric: `${state.challenges.length}/${CHALLENGES.length} challenges`, pct: dojoPct },
    { ...MODULE_META[3], metric: `${state.steps.length}/18 layers`, pct: stepPct },
  ];

  const next = moduleProgress.find((m) => m.pct < 100) ?? moduleProgress[0];
  const nextQuest = QUESTS.find((q) => !state.quests.includes(q.id));
  const nextLevel = levelInfo(state.xp);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="panel corner-ticks relative overflow-hidden">
        <div className="dot-field absolute inset-0 opacity-40" aria-hidden />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              <p className="eyebrow">Fullstack wannabe · local sandbox</p>
            </div>
            <h1 className="display mt-3 text-balance text-[2.15rem] leading-[0.95] sm:text-[3rem] lg:text-[3.4rem]">
              Design the schema.
              <br />
              <span className="text-muted-foreground/55">Then earn the API.</span>
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-[0.8125rem] leading-relaxed text-muted-foreground sm:text-sm">
              Four modules that chain into one workflow: draw tables, seed them, interrogate them with SQL, then
              rebuild the backend layers around them in Go, TypeScript or PHP. No videos, no copy-paste — every
              answer is checked against real execution.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link to={next.to}>
                  Continue · {next.name}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/sql">Jump into the arena</Link>
              </Button>
              {!seed && (
                <span className="inline-flex items-center gap-1 font-mono text-[0.5625rem] uppercase tracking-widest text-amber">
                  <span className="h-1 w-1 rounded-full bg-amber" />
                  schema not seeded yet
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <Stat label="Level" value={String(level.level)} hint={level.title} accent="lime" />
            <Stat label="XP" value={String(state.xp)} hint={level.next ? `${level.toNext} to Lv ${level.next.level}` : 'max rank'} accent="amber" />
            <Stat label="Streak" value={`${state.streak}d`} hint="come back tomorrow" accent="violet" icon={Flame} />
            <Stat label="Badges" value={`${state.badges.length}/${BADGES.length}`} hint="collected" accent="cyan" icon={Sparkles} />
            <div className="col-span-2 rounded-md border border-border bg-surface/80 p-3">
              <div className="mb-1.5 flex items-center justify-between font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
                <span>{level.title}</span>
                <span className="numeric">{level.progress}%</span>
              </div>
              <Progress value={level.progress} />
              <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
                {nextLevel.next
                  ? `Reach ${nextLevel.next.min} XP to become a ${nextLevel.next.title}.`
                  : 'Top rank reached. You are no longer a wannabe.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Next action + modules */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="eyebrow">The route</p>
            <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground/60">
              schema → sql → language → api
            </span>
          </div>
          <ul className="divide-y divide-border">
            {moduleProgress.map((mod, i) => (
              <li key={mod.to}>
                <Link
                  to={mod.to}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated/50"
                >
                  <span className="numeric w-6 shrink-0 font-mono text-[0.625rem] text-muted-foreground/50">
                    {mod.code}
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border bg-elevated/50">
                    <mod.icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[0.8125rem] font-medium">{mod.name}</span>
                      <span className="hidden shrink-0 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground/50 sm:inline">
                        {mod.kicker}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-out-expo"
                          style={{ width: `${Math.max(2, mod.pct)}%` }}
                        />
                      </span>
                      <span className="numeric shrink-0 font-mono text-[0.5625rem] text-muted-foreground">
                        {mod.metric}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:text-primary" />
                  {i === 0 && <span className="sr-only">start here</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <p className="eyebrow">Next best move</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex items-start gap-2.5">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="display text-lg leading-tight">
                  {nextQuest ? nextQuest.title : 'Every quest cleared'}
                </p>
                <p className="mt-1 text-[0.75rem] leading-relaxed text-muted-foreground">
                  {nextQuest
                    ? nextQuest.brief
                    : 'You have finished the arena. Re-run the join quests with different aliases to keep sharp.'}
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-1.5">
              {nextQuest && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">W{nextQuest.world}</Badge>
                  <Badge variant="lime">+{nextQuest.xp} XP</Badge>
                  <span className="ml-auto font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground/60">
                    {nextQuest.dataset}
                  </span>
                </div>
              )}
              <Button asChild size="sm" className="w-full">
                <Link to={nextQuest ? '/sql' : '/blueprint'}>
                  {nextQuest ? 'Open the quest' : 'Trace a request'}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Badges */}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="eyebrow">Badges</p>
          <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground/60">
            {state.badges.length} of {BADGES.length}
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 xl:divide-y-0">
          {BADGES.map((badge) => {
            const earned = hasBadge(badge.id);
            return (
              <div
                key={badge.id}
                className={cn('flex flex-col gap-1.5 p-3 transition-colors', earned ? 'bg-primary/[0.04]' : 'opacity-60')}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-sm border font-mono text-[0.8125rem]',
                    earned ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground/50',
                  )}
                  aria-hidden
                >
                  {badge.glyph}
                </span>
                <p className="text-[0.6875rem] font-medium leading-tight">{badge.name}</p>
                <p className="text-[0.625rem] leading-snug text-muted-foreground">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <p className="px-1 pb-2 text-center font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground/40">
        everything runs locally · no account · progress saved in this browser
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent: 'lime' | 'amber' | 'violet' | 'cyan';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const tone =
    accent === 'lime'
      ? 'text-lime'
      : accent === 'amber'
        ? 'text-amber'
        : accent === 'violet'
          ? 'text-violet'
          : 'text-cyan';

  return (
    <div className="rounded-md border border-border bg-surface/80 p-3">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        {Icon && <Icon className={cn('h-3 w-3', tone)} />}
      </div>
      <p className={cn('numeric mt-1.5 text-2xl font-semibold leading-none', tone)}>{value}</p>
      <p className="mt-1 truncate text-[0.625rem] text-muted-foreground">{hint}</p>
    </div>
  );
}
