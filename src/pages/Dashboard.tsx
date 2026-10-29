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
import { QUESTS, WORLDS } from '@/modules/sql/quests';
import { CHALLENGES } from '@/modules/dojo/challenges';
import { schemaStats } from '@/modules/erd/sql';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WORLD_HAT, WORLD_ON, type World } from '@/lib/world';
import { cn } from '@/lib/utils';

const MODULE_META: {
  to: string;
  code: string;
  name: string;
  kicker: string;
  icon: typeof Boxes;
  world: World;
}[] = [
  { to: '/erd', code: '01', name: 'Schema Studio', kicker: 'Architect mode', icon: Boxes, world: 'schema' },
  { to: '/sql', code: '02', name: 'Query Arena', kicker: 'Five worlds', icon: SquareTerminal, world: 'arena' },
  { to: '/dojo', code: '03', name: 'Polyglot Dojo', kicker: 'Three stacks', icon: Braces, world: 'dojo' },
  { to: '/blueprint', code: '04', name: 'API Blueprint', kicker: 'Six layers', icon: Network, world: 'blueprint' },
];

/**
 * The hero is the one place in the app that gets the night stage. It is the
 * only surface dark enough to let the candy colours speak at full strength —
 * which is why the headline can be lime here and nowhere else.
 */
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
  const nextWorld = nextQuest ? WORLDS.find((w) => w.id === nextQuest.world) : undefined;
  const nextLevel = levelInfo(state.xp);

  return (
    <div className="space-y-4">
      {/* ── Hero: the night stage ─────────────────────────────────────── */}
      <section
        className="stage relative overflow-hidden"
        style={{ '--grid-line': 'oklch(var(--wb-on-grape-c) / 0.09)' } as React.CSSProperties}
      >
        <div className="dot-field absolute inset-0" aria-hidden />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] border-[1.5px] border-white/70 bg-[var(--mango)]" />
              <p className="font-mono text-[0.6875rem] uppercase leading-none tracking-[0.13em] on-stage-3">
                Fullstack wannabe · local sandbox
              </p>
            </div>
            <h1 className="display mt-3 text-balance text-[2.15rem] leading-[0.95] on-stage sm:text-[3rem] lg:text-[3.2rem]">
              Design the schema.
              <br />
              <span className="text-lime">Then earn the API.</span>
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-[0.8125rem] leading-relaxed on-stage-2 sm:text-sm">
              Four modules that chain into one workflow: draw tables, seed them, interrogate them
              with SQL, then rebuild the backend layers around them in Go, TypeScript or PHP. No
              videos, no copy-paste — every answer is checked against real execution.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link to={next.to}>
                  Continue · {next.name}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="stage">
                <Link to="/sql">Jump into the arena</Link>
              </Button>
              {!seed && (
                <span className="inline-flex items-center gap-1.5 font-mono text-[0.5625rem] uppercase tracking-widest text-mango">
                  <span className="h-1.5 w-1.5 rounded-full bg-mango" />
                  schema not seeded yet
                </span>
              )}
            </div>
          </div>

          {/*
           * One operator card, not four stat boxes. The sidebar already owns
           * level/XP/streak/badges, so a 2x2 grid here repeated it in five
           * near-identical frames and then needed a sixth block for the meter.
           * A single card says the same thing once, and says what is next.
           */}
          <div className="rounded-[16px] border-[2px] stage-line stage-fill p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[0.5625rem] uppercase leading-none tracking-[0.16em] on-stage-3">
                {level.title}
              </p>
              <p className="numeric shrink-0 font-mono text-[0.5625rem] uppercase leading-none tracking-[0.16em] text-lime">
                Lv {level.level}
              </p>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="flex items-baseline gap-1.5">
                <span className="numeric text-[2.5rem] font-bold leading-[0.8] text-lime">
                  {state.xp}
                </span>
                <span className="numeric font-mono text-[0.8125rem] font-semibold leading-none on-stage-3">
                  / {nextLevel.next ? nextLevel.next.min : '∞'}
                </span>
              </p>
              <p className="font-mono text-[0.5625rem] uppercase tracking-widest on-stage-3">xp</p>
            </div>

            <Progress
              value={level.progress}
              className="meter-on-stage mt-3"
              indicatorClassName="bg-lime"
            />

            <p className="mt-2.5 text-[0.6875rem] leading-relaxed on-stage-2">
              {nextLevel.next
                ? `Reach ${nextLevel.next.min} XP to become a ${nextLevel.next.title}.`
                : 'Top rank reached. You are no longer a wannabe.'}
            </p>

            <div className="mt-3.5 grid grid-cols-2 gap-3 border-t-[1.5px] border-white/15 pt-3">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 shrink-0 text-pink" />
                <span className="numeric text-[0.8125rem] font-semibold text-pink">
                  {state.streak}d
                </span>
                <span className="font-mono text-[0.5rem] uppercase tracking-widest on-stage-3">
                  streak
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan" />
                <span className="numeric text-[0.8125rem] font-semibold text-cyan">
                  {state.badges.length}/{BADGES.length}
                </span>
                <span className="font-mono text-[0.5rem] uppercase tracking-widest on-stage-3">
                  badges
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Route + next action ───────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-border px-4 py-2.5">
            <p className="eyebrow">The route</p>
            <span className="truncate font-mono text-[0.5625rem] uppercase tracking-widest text-tertiary">
              schema → sql → language → api
            </span>
          </div>
          <ul className="divide-y-[1.5px] divide-border">
            {moduleProgress.map((mod) => (
              <li key={mod.to}>
                <Link
                  to={mod.to}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="numeric w-5 shrink-0 font-mono text-[0.625rem] text-tertiary">
                    {mod.code}
                  </span>
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border-[2px] border-edge shadow-hard-sm transition-transform duration-150 group-hover:-translate-y-0.5"
                    style={{ background: WORLD_HAT[mod.world], color: WORLD_ON[mod.world] }}
                  >
                    <mod.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate text-[0.8125rem] font-semibold">{mod.name}</span>
                      <span className="hidden shrink-0 font-mono text-[0.5rem] uppercase tracking-widest text-tertiary sm:inline">
                        {mod.kicker}
                      </span>
                    </span>
                    <span className="mt-1.5 flex items-center gap-2.5">
                      <Progress
                        value={mod.pct}
                        segments={6}
                        size="sm"
                        className="max-w-[200px] flex-1"
                      />
                      <span className="numeric shrink-0 font-mono text-[0.5625rem] text-muted-foreground">
                        {mod.metric}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-tertiary transition-all group-hover:-translate-y-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/*
         * The spec table is load-bearing, not decoration. Without it this panel
         * had a title at the top and a button at the bottom with ~90px of
         * nothing between them, because it stretched to match the four-row
         * route list next door. Give the height something to hold.
         */}
        <section className="panel flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-border px-4 py-2.5">
            <p className="eyebrow">Next best move</p>
            <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-tertiary">
              one at a time
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border-[2px] border-edge bg-mango text-on-candy shadow-hard-sm">
                <Target className="h-3.5 w-3.5" strokeWidth={2.3} />
              </span>
              <div className="min-w-0">
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

            {nextQuest && (
              <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5 border-t-[1.5px] border-border pt-3">
                <SpecRow label="World" value={nextWorld ? `${nextWorld.id} · ${nextWorld.name}` : '—'} />
                <SpecRow label="Dataset" value={nextQuest.dataset} mono />
                <SpecRow label="Reward" value={`+${nextQuest.xp} XP`} />
                <SpecRow label="Teaches" value={nextQuest.teaches.slice(0, 2).join(' · ')} mono />
              </dl>
            )}

            <div className="mt-auto space-y-2">
              {nextQuest && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">W{nextQuest.world}</Badge>
                  <Badge variant="lime">+{nextQuest.xp} XP</Badge>
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

      {/* ── Badges ────────────────────────────────────────────────────── */}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-border px-4 py-2.5">
          <p className="eyebrow">Badges</p>
          <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-tertiary">
            {state.badges.length} of {BADGES.length}
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x-[1.5px] divide-y-[1.5px] divide-border sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 xl:divide-y-0">
          {BADGES.map((badge) => {
            const earned = hasBadge(badge.id);
            return (
              /*
               * No `opacity-55` on the unearned tiles. Fading a whole card fades
               * the words with it: the description landed at 2.54:1 in light and
               * 3.45:1 in dark, and the name at 3.93:1. "Locked" is a state, not
               * a transparency — say it with a dashed edge and the low end of
               * the text ramp, which is still AA.
               */
              <div
                key={badge.id}
                className={cn('flex flex-col gap-1.5 p-3', earned && 'bg-mango/[0.10]')}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-[9px] border-[2px] font-mono text-[0.8125rem] font-bold',
                    earned
                      ? 'border-edge bg-mango text-on-candy shadow-hard-sm'
                      : 'border-dashed border-border text-tertiary',
                  )}
                  aria-hidden
                >
                  {badge.glyph}
                </span>
                <p
                  className={cn(
                    'text-[0.6875rem] font-semibold leading-tight',
                    earned ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {badge.name}
                </p>
                <p className="text-[0.625rem] leading-snug text-tertiary">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <p className="px-1 pb-2 text-center font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-tertiary">
        everything runs locally · no account · progress saved in this browser
      </p>
    </div>
  );
}

/** A key/value line in the next-move spec table. */
function SpecRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="font-mono text-[0.5rem] uppercase tracking-widest text-tertiary">{label}</dt>
      <dd
        className={cn(
          'min-w-0 truncate text-[0.6875rem] leading-snug',
          mono ? 'font-mono text-muted-foreground' : 'text-foreground',
        )}
        title={value}
      >
        {value}
      </dd>
    </>
  );
}
