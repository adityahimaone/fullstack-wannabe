import * as React from 'react';
import { Check, ChevronDown, Lock, Trophy } from 'lucide-react';
import { QUESTS, WORLDS, isWorldUnlocked, questsByWorld, type Quest } from './quests';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export function QuestList({
  selectedId,
  onSelect,
  completed,
  datasetKey,
}: {
  selectedId: string | null;
  onSelect: (quest: Quest) => void;
  completed: string[];
  datasetKey: string;
}) {
  const selectedWorld = QUESTS.find((q) => q.id === selectedId)?.world ?? 1;
  const [open, setOpen] = React.useState<number[]>([selectedWorld]);

  React.useEffect(() => {
    setOpen((prev) => (prev.includes(selectedWorld) ? prev : [...prev, selectedWorld]));
  }, [selectedWorld]);

  const toggle = (world: number) =>
    setOpen((prev) => (prev.includes(world) ? prev.filter((w) => w !== world) : [...prev, world]));

  return (
    <div className="space-y-1.5">
      {WORLDS.map((world) => {
        const quests = questsByWorld(world.id);
        const done = quests.filter((q) => completed.includes(q.id)).length;
        const unlocked = isWorldUnlocked(world.id, completed);
        const isOpen = open.includes(world.id);
        const prevWorld = WORLDS.find((w) => w.id === world.id - 1);

        return (
          <div
            key={world.id}
            className={cn(
              'overflow-hidden rounded-md border transition-colors',
              isOpen ? 'border-border bg-elevated/30' : 'border-border/70',
              /*
               * Not `opacity-70`. The header is still a live accordion — you
               * can open a locked world and read how to unlock it — so it is an
               * active control and has to clear 4.5:1. Fading the card put the
               * world number at 3.49:1. A dashed edge says "provisional"
               * without touching the ink.
               */
              !unlocked && 'border-dashed',
            )}
          >
            <button
              type="button"
              onClick={() => toggle(world.id)}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  'numeric grid h-5 w-5 shrink-0 place-items-center rounded-sm border font-mono text-[0.5625rem]',
                  done === quests.length
                    ? 'border-primary/50 bg-primary/15 text-primary-ink'
                    : 'border-border text-muted-foreground',
                )}
              >
                {done === quests.length ? <Check className="h-3 w-3" /> : String(world.id).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-medium">{world.name}</span>
                <span className="block truncate font-mono text-[0.5625rem] uppercase tracking-wider text-muted-foreground">
                  {world.subtitle}
                </span>
              </span>
              {!unlocked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
              <span className="numeric shrink-0 font-mono text-[0.5625rem] text-muted-foreground">
                {done}/{quests.length}
              </span>
              <ChevronDown
                className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
              />
            </button>

            {isOpen && (
              <div className="px-1.5 pb-1.5">
                {!unlocked && (
                  <p className="mb-1.5 rounded-sm border border-dashed border-border px-2 py-1.5 text-[0.625rem] leading-relaxed text-muted-foreground">
                    Clear {Math.ceil(questsByWorld(world.id - 1).length * 0.8)} of{' '}
                    {questsByWorld(world.id - 1).length} quests in {prevWorld?.name} to unlock.
                  </p>
                )}
                <ul className="space-y-0.5">
                  {quests.map((quest) => {
                    const isDone = completed.includes(quest.id);
                    const isActive = quest.id === selectedId;
                    return (
                      <li key={quest.id}>
                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => onSelect(quest)}
                          className={cn(
                            'group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors',
                            isActive
                              ? 'bg-primary/10 text-foreground'
                              : 'text-muted-foreground hover:bg-elevated hover:text-foreground',
                            !unlocked && 'cursor-not-allowed',
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border',
                              isDone
                                ? 'border-primary bg-primary text-primary-foreground'
                                : isActive
                                  ? 'border-primary'
                                  : 'border-border',
                            )}
                          >
                            {isDone && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[0.75rem]">{quest.title}</span>
                          {quest.dataset !== datasetKey && (
                            <span className="shrink-0 font-mono text-[0.5rem] uppercase tracking-wider text-tertiary">
                              {quest.dataset.slice(0, 4)}
                            </span>
                          )}
                          <span className="numeric shrink-0 font-mono text-[0.5625rem] text-muted-foreground">
                            {quest.xp}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-md border border-border/70 bg-elevated/20 p-2.5">
        <div className="flex items-center justify-between font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3 text-mango-ink" />
            arena progress
          </span>
          <span className="numeric">
            {completed.length}/{QUESTS.length}
          </span>
        </div>
        <Progress value={(completed.length / QUESTS.length) * 100} className="mt-2" />
      </div>
    </div>
  );
}
