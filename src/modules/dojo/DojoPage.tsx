import * as React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Eye,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/MobileChrome';
import { CodeEditor } from '@/components/CodeEditor';
import { StateVisualizer } from './StateVisualizer';
import {
  CHALLENGES,
  DIFFICULTIES,
  STACK_META,
  challengesByStack,
  staticCheck,
  type Challenge,
  type Difficulty,
} from './challenges';
import { deepEqualLoose, runJs } from './runner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProgress, STACKS } from '@/lib/progress';
import { usePersistentState, readStore, writeStore } from '@/lib/storage';
import { useIsDesktop } from '@/lib/use-media';
import { cn } from '@/lib/utils';

interface Outcome {
  ok: boolean;
  message: string;
  value?: unknown;
  expected?: unknown;
  error?: string;
}

const DIFFICULTY_STYLE: Record<Difficulty, { text: string; badge: 'outline' | 'amber' | 'violet'; bar: string }> = {
  easy: { text: 'text-lime', badge: 'outline', bar: 'bg-lime' },
  medium: { text: 'text-amber', badge: 'amber', bar: 'bg-amber' },
  hard: { text: 'text-violet', badge: 'violet', bar: 'bg-violet' },
};

function DifficultyPips({ pips, className }: { pips: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-end gap-[2px]', className)} aria-hidden>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-[1px] bg-current', i <= pips ? '' : 'opacity-25')}
          style={{ height: `${2 + i * 2}px` }}
        />
      ))}
    </span>
  );
}

export function DojoPage() {
  const { state, completeChallenge, setActiveStack } = useProgress();
  const isDesktop = useIsDesktop();
  const stack = state.activeStack;

  const [challengeId, setChallengeId] = usePersistentState<string | null>(`dojo:active:${stack}`, null);
  const [difficulty, setDifficulty] = usePersistentState<Difficulty | 'all'>('dojo:difficulty', 'all');
  const [drafts, setDrafts] = React.useState<Record<string, string>>(() =>
    readStore<Record<string, string>>('dojo:drafts', {}),
  );
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  const [running, setRunning] = React.useState(false);
  const [showSolution, setShowSolution] = React.useState(false);

  const list = React.useMemo(() => challengesByStack(stack), [stack]);
  const visible = React.useMemo(
    () => (difficulty === 'all' ? list : list.filter((c) => c.difficulty === difficulty)),
    [list, difficulty],
  );
  const challenge = React.useMemo(
    () => visible.find((c) => c.id === challengeId) ?? list.find((c) => c.id === challengeId) ?? visible[0] ?? list[0],
    [visible, list, challengeId],
  );

  React.useEffect(() => {
    if (!list.some((c) => c.id === challengeId)) {
      setChallengeId(list[0]?.id ?? null);
    }
    setOutcome(null);
    setShowSolution(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stack]);

  // Keep the selection inside the active filter so the editor never shows a hidden challenge.
  React.useEffect(() => {
    if (visible.length > 0 && !visible.some((c) => c.id === challengeId)) {
      setChallengeId(visible[0].id);
      setOutcome(null);
      setShowSolution(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, stack]);

  const code = drafts[challenge.id] ?? challenge.starter;

  const setCode = (value: string) => {
    setDrafts((prev) => {
      const next = { ...prev, [challenge.id]: value };
      writeStore('dojo:drafts', next);
      return next;
    });
  };

  const selectChallenge = (c: Challenge) => {
    setChallengeId(c.id);
    setOutcome(null);
    setShowSolution(false);
  };

  const run = async () => {
    setRunning(true);
    setOutcome(null);
    try {
      if (challenge.mode === 'run') {
        const opts = { ts: challenge.ts };
        const expected = await runJs(challenge.solution, challenge.payload, opts);
        const actual = await runJs(code, challenge.payload, opts);

        if (!actual.ok) {
          setOutcome({
            ok: false,
            message: actual.timedOut ? 'Execution timed out.' : 'Your code threw an error.',
            error: actual.error,
            expected: expected.result,
          });
        } else if (!expected.ok) {
          setOutcome({
            ok: false,
            message: 'The reference implementation failed — please report this challenge.',
            error: expected.error,
          });
        } else {
          const ok = deepEqualLoose(actual.result, expected.result);
          setOutcome({
            ok,
            message: ok ? 'Output matches the reference implementation.' : 'Output differs from the reference.',
            value: actual.result,
            expected: expected.result,
          });
          if (ok) completeChallenge(challenge.id, challenge.xp);
        }
      } else {
        const result = staticCheck(code, challenge);
        setOutcome({
          ok: result.ok,
          message: result.message,
          value: undefined,
          expected: challenge.expected,
        });
        if (result.ok) completeChallenge(challenge.id, challenge.xp);
      }
    } catch (err) {
      setOutcome({
        ok: false,
        message: 'Something broke while running your code.',
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setRunning(false);
    }
  };

  /** Easy → hard buckets; within a bucket the authored order is kept. */
  const groups = React.useMemo(
    () =>
      DIFFICULTIES.map((d) => ({
        ...d,
        items: visible.filter((c) => c.difficulty === d.id),
      })).filter((g) => g.items.length > 0),
    [visible],
  );

  const counts = React.useMemo(() => {
    const byDiff = (d: Difficulty) => list.filter((c) => c.difficulty === d).length;
    return {
      all: list.length,
      easy: byDiff('easy'),
      medium: byDiff('medium'),
      hard: byDiff('hard'),
    };
  }, [list]);

  const solvedCount = list.filter((c) => state.challenges.includes(c.id)).length;

  const difficultyChips = (
    <div className="grid grid-cols-2 gap-1">
      {([{ id: 'all' as const, label: 'All', pips: 0 }, ...DIFFICULTIES] as const).map((d) => {
        const active = difficulty === d.id;
        const total = counts[d.id];
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => setDifficulty(d.id)}
            aria-pressed={active}
            className={cn(
              'flex items-center justify-center gap-1 rounded-sm border px-1 py-1 font-mono text-[0.5625rem] uppercase tracking-wider transition-colors',
              active
                ? d.id === 'all'
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : cn('border-current/40 bg-current/10', DIFFICULTY_STYLE[d.id].text)
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {d.id !== 'all' && <DifficultyPips pips={d.pips} />}
            {d.label}
            <span className="text-[0.5rem] opacity-60">{total}</span>
          </button>
        );
      })}
    </div>
  );

  const challengeList = (
    <div className="space-y-3">
      {groups.map((group) => {
        const style = DIFFICULTY_STYLE[group.id];
        const cleared = group.items.filter((c) => state.challenges.includes(c.id)).length;
        return (
          <div key={group.id}>
            <div className="mb-1.5 flex items-center gap-1.5 px-1">
              <DifficultyPips pips={group.pips} className={style.text} />
              <p className={cn('eyebrow', style.text)}>{group.label}</p>
              <span className="numeric ml-auto font-mono text-[0.5rem] text-muted-foreground/60">
                {cleared}/{group.items.length}
              </span>
            </div>
            <ul className="space-y-0.5">
              {group.items.map((c) => {
                const done = state.challenges.includes(c.id);
                const active = c.id === challenge.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => selectChallenge(c)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors',
                        active
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:bg-elevated hover:text-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border',
                          done
                            ? 'border-primary bg-primary text-primary-foreground'
                            : active
                              ? 'border-primary'
                              : 'border-border',
                        )}
                      >
                        {done && <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[0.75rem]">{c.title}</span>
                      <span className="numeric shrink-0 font-mono text-[0.5625rem] text-muted-foreground/70">
                        {c.xp}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {groups.length === 0 && (
        <p className="px-2 py-6 text-center text-[0.75rem] text-muted-foreground">
          No {difficulty} challenges in this stack yet.
        </p>
      )}
    </div>
  );

  const stackSwitcher = (
    <div className="flex gap-1">
      {STACKS.map((s) => {
        const total = challengesByStack(s.id).length;
        const done = challengesByStack(s.id).filter((c) => state.challenges.includes(c.id)).length;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveStack(s.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-sm border px-1 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider transition-colors',
              stack === s.id
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {s.short}
            <span className="text-[0.5rem] opacity-60">
              {done}/{total}
            </span>
          </button>
        );
      })}
    </div>
  );

  const briefBlock = (
    <div className="border-b border-border bg-elevated/30 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{challenge.track}</Badge>
        <span className="display text-[0.9375rem]">{challenge.title}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Badge variant={DIFFICULTY_STYLE[challenge.difficulty].badge}>
            <DifficultyPips pips={DIFFICULTIES.find((d) => d.id === challenge.difficulty)!.pips} />
            {challenge.difficulty}
          </Badge>
          <Badge variant="lime">+{challenge.xp} XP</Badge>
        </div>
      </div>
      <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted-foreground">{challenge.brief}</p>
    </div>
  );

  const editorBlock = (
    <div className="flex min-h-0 flex-col">
      {briefBlock}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
        <Button size="xs" onClick={run} disabled={running}>
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {running ? 'Running' : challenge.mode === 'run' ? 'Run tests' : 'Check code'}
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setCode(challenge.starter)} title="Reset to starter">
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => {
            setShowSolution((v) => !v);
          }}
        >
          <Eye className="h-3 w-3" />
          {showSolution ? 'Hide' : 'Reveal'}
        </Button>
        <span className="ml-auto font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground/60">
          {challenge.mode === 'run'
            ? `sandboxed ${challenge.ts ? 'ts' : 'js'} · 1.6s limit`
            : 'static analysis'}
        </span>
      </div>
      <div className="px-3 pb-3">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={STACK_META[stack].lang}
          onRun={run}
          minHeight={isDesktop ? 230 : 240}
          ariaLabel="Challenge editor"
        />
      </div>

      {outcome && (
        <div
          className={cn(
            'mx-3 mb-3 rounded-md border p-2.5',
            outcome.ok ? 'border-lime/40 bg-lime/5' : 'border-destructive/35 bg-destructive/5',
          )}
        >
          <div className="flex items-start gap-2">
            {outcome.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[0.75rem] font-medium">
                {outcome.ok ? 'Solved.' : 'Not passing yet.'}
              </p>
              <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
                {outcome.message}
              </p>
              {outcome.error && (
                <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-sm border border-destructive/25 bg-background/40 p-2 font-mono text-[0.625rem] text-destructive">
                  {outcome.error}
                </pre>
              )}
              {!outcome.ok && (
                <button
                  type="button"
                  onClick={() => setShowSolution(true)}
                  className="mt-1 font-mono text-[0.5625rem] uppercase tracking-widest text-amber hover:underline"
                >
                  show reference solution
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showSolution && (
        <div className="mx-3 mb-3">
          <p className="eyebrow mb-1.5">Reference solution</p>
          <pre className="max-h-56 overflow-auto rounded-md border border-border bg-background/60 p-2.5 font-mono text-[0.6875rem] leading-relaxed text-muted-foreground">
            {challenge.solution}
          </pre>
        </div>
      )}
    </div>
  );

  const inspectBlock = (
    <div className="flex min-h-0 flex-col gap-3 p-3">
      <div>
        <p className="eyebrow mb-2">Memory inspector</p>
        <StateVisualizer
          value={outcome?.value ?? (outcome?.ok ? undefined : undefined)}
          sourceRows={Array.isArray(challenge.payload) ? challenge.payload.length : undefined}
        />
      </div>

      {challenge.payload !== null && challenge.mode === 'run' && (
        <div>
          <p className="eyebrow mb-1.5">Input payload</p>
          <pre className="max-h-28 overflow-auto rounded-md border border-border bg-background/60 p-2 font-mono text-[0.625rem] leading-relaxed text-muted-foreground">
            {JSON.stringify(challenge.payload, null, 1)}
          </pre>
        </div>
      )}

      {challenge.mode === 'static' && (
        <div>
          <p className="eyebrow mb-1.5">Input payload</p>
          <pre className="max-h-32 overflow-auto rounded-md border border-border bg-background/60 p-2 font-mono text-[0.625rem] leading-relaxed text-muted-foreground">
            {String(challenge.payload)}
          </pre>
        </div>
      )}

      {(challenge.expected || outcome?.expected !== undefined) && (
        <div>
          <p className="eyebrow mb-1.5">Reference output</p>
          <pre className="max-h-40 overflow-auto rounded-md border border-lime/25 bg-lime/5 p-2 font-mono text-[0.625rem] leading-relaxed text-foreground/80">
            {challenge.expected ??
              (typeof outcome?.expected === 'string'
                ? outcome?.expected
                : JSON.stringify(outcome?.expected, null, 2))}
          </pre>
        </div>
      )}

      <div className="rounded-md border border-border bg-elevated/30 p-2.5">
        <p className="flex items-center gap-1.5 font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
          <CircleDot className="h-3 w-3 text-violet" />
          why it works
        </p>
        <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-muted-foreground">{challenge.explain}</p>
      </div>

      <div className="rounded-md border border-border/70 p-2.5">
        <p className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">hint</p>
        <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">{challenge.hint}</p>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="03 · Polyglot dojo"
        title={
          <>
            Polyglot <span className="text-muted-foreground/50">Dojo</span>
          </>
        }
        description="The same payload transformation, written four ways. Go maps, JS array methods, TypeScript state shaping, Laravel collections — build the muscle memory before the API needs it."
        actions={
          <Badge variant="outline">
            {solvedCount}/{list.length} {STACK_META[stack].label} cleared
          </Badge>
        }
      />

      {isDesktop ? (
        <div className="grid gap-3 lg:grid-cols-[248px_minmax(0,1fr)_330px]">
          <aside className="panel flex flex-col overflow-hidden lg:h-[calc(100dvh-198px)]">
            <div className="shrink-0 space-y-2 border-b border-border p-2.5">
              <p className="eyebrow">Stack</p>
              {stackSwitcher}
              <p className="eyebrow pt-0.5">Difficulty</p>
              {difficultyChips}
              <p className="font-mono text-[0.5625rem] leading-relaxed text-muted-foreground/70">
                {STACK_META[stack].tagline}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">{challengeList}</div>
          </aside>

          <section className="panel flex min-h-0 flex-col overflow-hidden lg:h-[calc(100dvh-198px)]">
            <div className="min-h-0 flex-1 overflow-y-auto">{editorBlock}</div>
          </section>

          <aside className="panel min-h-0 overflow-y-auto lg:h-[calc(100dvh-198px)]">{inspectBlock}</aside>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="panel p-2.5">
            <div className="space-y-2">
              {stackSwitcher}
              {difficultyChips}
              <Select value={challenge.id} onValueChange={(v) => selectChallenge(list.find((c) => c.id === v)!)}>
                <SelectTrigger className="h-8 font-mono text-[0.6875rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectGroup key={group.id}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.items.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {state.challenges.includes(c.id) ? '✓ ' : ''}
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="panel overflow-hidden">{editorBlock}</div>
          <div className="panel">{inspectBlock}</div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-lime" />
        <p className="min-w-0 flex-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
          JS and TypeScript run in a disposable worker with a 1.6s budget — TypeScript is transpiled on the fly, so
          types, interfaces and generics work as written. Go and PHP are verified by static analysis of the required
          constructs plus a reference output you can compare by eye.
        </p>
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
          {CHALLENGES.length} challenges
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
