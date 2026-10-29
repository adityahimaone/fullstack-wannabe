import * as React from 'react';
import { useToast } from '@/components/ui/toast';
import { CHALLENGES } from '@/modules/dojo/challenges';
import { readStore, usePersistentState, writeStore } from '@/lib/storage';

export type Stack = 'go' | 'node' | 'frontend' | 'php';

export const STACKS: { id: Stack; label: string; short: string; accent: string }[] = [
  { id: 'go', label: 'Go', short: 'GO', accent: 'text-cyan-ink' },
  { id: 'node', label: 'Node.js', short: 'TS', accent: 'text-lime-ink' },
  { id: 'frontend', label: 'Frontend TS', short: 'UI', accent: 'text-mango-ink' },
  { id: 'php', label: 'PHP', short: 'PHP', accent: 'text-grape-ink' },
];

/**
 * Stacks the Blueprint module can generate. Its six layers are server-shaped
 * (migration → model → repository → service → controller → router), so the
 * Frontend TS track is Dojo-only and has no blueprint of its own.
 */
export const BACKEND_STACKS = STACKS.filter((s) => s.id !== 'frontend');

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  glyph: string;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first-query',
    name: 'First Blood',
    description: 'Solve your first SQL quest.',
    glyph: '⌘',
  },
  {
    id: 'schema-smith',
    name: 'Schema Smith',
    description: 'Design a table with at least 3 columns and seed it.',
    glyph: '◫',
  },
  {
    id: 'join-master',
    name: 'Join Master',
    description: 'Clear every quest in World 4 — The Art of the Join.',
    glyph: '⋈',
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Solve 6 dojo challenges across at least two stacks.',
    glyph: '⌁',
  },
  {
    id: 'deep-end',
    name: 'Deep End',
    description: 'Clear a hard challenge in every stack, frontend included.',
    glyph: '⚡',
  },
  {
    id: 'request-tracer',
    name: 'Request Tracer',
    description: 'Fire a request in the Mini-Postman client.',
    glyph: '→',
  },
  {
    id: 'architect',
    name: 'Fullstack Architect',
    description: 'Complete all 6 pipeline steps for all three stacks.',
    glyph: '▲',
  },
];

export interface ProgressState {
  xp: number;
  streak: number;
  lastActive: string;
  activeStack: Stack;
  quests: string[];
  challenges: string[];
  steps: string[];
  badges: string[];
  requests: number;
}

const DEFAULT_STATE: ProgressState = {
  xp: 0,
  streak: 1,
  lastActive: new Date().toISOString().slice(0, 10),
  activeStack: 'go',
  quests: [],
  challenges: [],
  steps: [],
  badges: [],
  requests: 0,
};

const LEVELS = [
  { level: 1, title: 'Curious Intern', min: 0 },
  { level: 2, title: 'Schema Tinkerer', min: 120 },
  { level: 3, title: 'Query Runner', min: 320 },
  { level: 4, title: 'Join Whisperer', min: 620 },
  { level: 5, title: 'Data Wrangler', min: 1000 },
  { level: 6, title: 'Struct Alchemist', min: 1480 },
  { level: 7, title: 'Layer Architect', min: 2050 },
  { level: 8, title: 'API Smith', min: 2700 },
  { level: 9, title: 'Fullstack Architect', min: 3450 },
  { level: 10, title: 'Wannabe No More', min: 4300 },
];

export function levelInfo(xp: number) {
  const current = [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.min > xp);
  const spanStart = current.min;
  const spanEnd = next?.min ?? current.min + 1000;
  const progress = Math.min(100, Math.round(((xp - spanStart) / (spanEnd - spanStart)) * 100));
  return {
    ...current,
    next,
    progress,
    toNext: next ? next.min - xp : 0,
  };
}

interface ProgressContextValue {
  state: ProgressState;
  level: ReturnType<typeof levelInfo>;
  award: (amount: number, title: string, description?: string) => void;
  completeQuest: (id: string, xp: number) => void;
  completeChallenge: (id: string, xp: number) => void;
  completeStep: (stack: Stack, step: number) => void;
  setActiveStack: (stack: Stack) => void;
  registerRequest: () => void;
  resetAll: () => void;
  hasBadge: (id: string) => boolean;
}

const ProgressContext = React.createContext<ProgressContextValue | null>(null);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { push } = useToast();
  const [state, setState] = usePersistentState<ProgressState>('progress', DEFAULT_STATE);
  const badgeQueue = React.useRef<string[]>([]);

  // Streak bookkeeping — runs once per mount.
  React.useEffect(() => {
    const t = today();
    if (state.lastActive === t) return;
    const gap = daysBetween(state.lastActive, t);
    setState((prev) => ({
      ...prev,
      streak: gap === 1 ? prev.streak + 1 : 1,
      lastActive: t,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const award = React.useCallback(
    (amount: number, title: string, description?: string) => {
      if (amount <= 0) return;
      setState((prev) => ({ ...prev, xp: prev.xp + amount }));
      push({ title: `+${amount} XP · ${title}`, description, variant: 'xp' });
    },
    [push, setState],
  );

  const completeQuest = React.useCallback(
    (id: string, xp: number) => {
      setState((prev) => {
        if (prev.quests.includes(id)) return prev;
        return { ...prev, quests: [...prev.quests, id], xp: prev.xp + xp };
      });
      push({ title: `+${xp} XP · Quest cleared`, description: `Quest ${id} logged in the arena.`, variant: 'xp' });
    },
    [push, setState],
  );

  const completeChallenge = React.useCallback(
    (id: string, xp: number) => {
      setState((prev) => {
        if (prev.challenges.includes(id)) return prev;
        return { ...prev, challenges: [...prev.challenges, id], xp: prev.xp + xp };
      });
      push({ title: `+${xp} XP · Dojo cleared`, description: 'Payload transformed correctly.', variant: 'xp' });
    },
    [push, setState],
  );

  const completeStep = React.useCallback(
    (stack: Stack, step: number) => {
      const key = `${stack}:${step}`;
      setState((prev) => {
        if (prev.steps.includes(key)) return prev;
        return { ...prev, steps: [...prev.steps, key], xp: prev.xp + 40 };
      });
      push({ title: '+40 XP · Layer understood', description: `Step ${step} mapped for ${stack.toUpperCase()}.`, variant: 'xp' });
    },
    [push, setState],
  );

  const setActiveStack = React.useCallback(
    (stack: Stack) => setState((prev) => ({ ...prev, activeStack: stack })),
    [setState],
  );

  const registerRequest = React.useCallback(() => {
    setState((prev) => ({ ...prev, requests: prev.requests + 1 }));
  }, [setState]);

  const resetAll = React.useCallback(() => {
    setState(DEFAULT_STATE);
    writeStore('progress', DEFAULT_STATE);
  }, [setState]);

  // Badge engine
  React.useEffect(() => {
    const earned = new Set(state.badges);
    const unlock: string[] = [];

    if (state.quests.length > 0) unlock.push('first-query');
    if (state.quests.filter((q) => q.startsWith('w4-')).length >= 5) unlock.push('join-master');
    const cleared = CHALLENGES.filter((c) => state.challenges.includes(c.id));
    if (state.challenges.length >= 6 && new Set(cleared.map((c) => c.stack)).size >= 2) {
      unlock.push('polyglot');
    }
    if (
      STACKS.every((s) =>
        cleared.some((c) => c.stack === s.id && c.difficulty === 'hard'),
      )
    ) {
      unlock.push('deep-end');
    }
    if (state.requests > 0) unlock.push('request-tracer');
    if (readStore<boolean>('erd:seeded', false) && state.steps.length > 0) unlock.push('schema-smith');
    const allSteps = ['go', 'node', 'php'].every((s) =>
      [1, 2, 3, 4, 5, 6].every((n) => state.steps.includes(`${s}:${n}`)),
    );
    if (allSteps) unlock.push('architect');

    const fresh = unlock.filter((id) => !earned.has(id));
    if (fresh.length === 0) return;

    badgeQueue.current = fresh;
    setState((prev) => ({ ...prev, badges: Array.from(new Set([...prev.badges, ...fresh])) }));

    fresh.forEach((id) => {
      const badge = BADGES.find((b) => b.id === id);
      if (badge) {
        push({
          title: `Badge unlocked — ${badge.name}`,
          description: badge.description,
          variant: 'success',
          duration: 5200,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.quests.length, state.challenges.length, state.steps.length, state.requests]);

  const level = React.useMemo(() => levelInfo(state.xp), [state.xp]);

  const value = React.useMemo<ProgressContextValue>(
    () => ({
      state,
      level,
      award,
      completeQuest,
      completeChallenge,
      completeStep,
      setActiveStack,
      registerRequest,
      resetAll,
      hasBadge: (id: string) => state.badges.includes(id),
    }),
    [state, level, award, completeQuest, completeChallenge, completeStep, setActiveStack, registerRequest, resetAll],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = React.useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
