import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Database } from 'sql.js';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database as DatabaseIcon,
  Lightbulb,
  Play,
  RotateCcw,
  Table2,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/MobileChrome';
import { CodeEditor } from '@/components/CodeEditor';
import { ResultGrid } from './ResultGrid';
import { QueryExplainer } from './QueryExplainer';
import { QuestList } from './QuestList';
import { QUESTS, WORLDS, isWorldUnlocked, type Quest } from './quests';
import {
  compareResults,
  datasetDatabase,
  erdDataset,
  execSql,
  getDatabase,
  invalidate,
  listTables,
  type QueryResult,
  type TableInfo,
} from './engine';
import { DATASETS, getDataset } from './datasets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersistentState, readStore, writeStore } from '@/lib/storage';
import { useProgress } from '@/lib/progress';
import { useIsDesktop } from '@/lib/use-media';
import { cn } from '@/lib/utils';

const QUICK_KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'LIMIT'];

export function SqlPage() {
  const { state, completeQuest } = useProgress();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();

  const [datasetKey, setDatasetKey] = usePersistentState<string>('sql:dataset', 'ecommerce');
  const [questId, setQuestId] = React.useState<string | null>(() => readStore<string | null>('sql:quest', null));
  const [drafts, setDrafts] = React.useState<Record<string, string>>(() =>
    readStore<Record<string, string>>('sql:drafts', {}),
  );

  const [db, setDb] = React.useState<Database | null>(null);
  const [dbKey, setDbKey] = React.useState<string>('');
  const [tables, setTables] = React.useState<TableInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [result, setResult] = React.useState<QueryResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [verdict, setVerdict] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [mobileTab, setMobileTab] = React.useState('editor');
  const [showHint, setShowHint] = React.useState(false);
  const [erdReady, setErdReady] = React.useState<boolean>(() => !!erdDataset());

  const quest = React.useMemo(() => QUESTS.find((q) => q.id === questId) ?? null, [questId]);
  const world = quest ? WORLDS.find((w) => w.id === quest.world) : undefined;

  React.useEffect(() => {
    writeStore('sql:quest', questId);
  }, [questId]);

  React.useEffect(() => {
    if (quest && quest.dataset !== datasetKey) setQuestId(null);
  }, [datasetKey, quest]);

  // Load (or rebuild) the in-browser database
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    setVerdict(null);

    (async () => {
      try {
        if (datasetKey === 'my-schema') {
          const erd = erdDataset();
          if (!erd) {
            if (!cancelled) {
              setDb(null);
              setTables([]);
              setErdReady(false);
              setLoading(false);
            }
            return;
          }
          setErdReady(true);
          const database = await getDatabase(erd.key, () => erd.script);
          if (cancelled) return;
          setDb(database);
          setDbKey(erd.key);
          setTables(listTables(database));
        } else {
          const ds = getDataset(datasetKey) ?? DATASETS[0];
          const database = await datasetDatabase(ds);
          if (cancelled) return;
          setDb(database);
          setDbKey(`dataset:${ds.id}`);
          setTables(listTables(database));
        }
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [datasetKey, reloadToken]);

  const draftKey = questId ?? datasetKey;
  const defaultSql = quest
    ? quest.starter
    : `SELECT * FROM ${tables[0]?.name ?? 'users'}\nLIMIT 20;`;
  const sql = drafts[draftKey] ?? defaultSql;

  const setSql = React.useCallback(
    (value: string) => {
      setDrafts((prev) => {
        const next = { ...prev, [draftKey]: value };
        writeStore('sql:drafts', next);
        return next;
      });
    },
    [draftKey],
  );

  const selectQuest = (q: Quest) => {
    setQuestId(q.id);
    setDatasetKey(q.dataset);
    setShowHint(false);
    setMobileTab('editor');
  };

  const nextQuest = React.useMemo(() => {
    if (!quest) return null;
    const idx = QUESTS.findIndex((q) => q.id === quest.id);
    return (
      QUESTS.slice(idx + 1).find((q) => isWorldUnlocked(q.world, state.quests)) ??
      QUESTS.find((q) => !state.quests.includes(q.id) && isWorldUnlocked(q.world, state.quests)) ??
      null
    );
  }, [quest, state.quests]);

  const execute = React.useCallback(
    (check: boolean) => {
      if (!db) return;
      try {
        const actual = execSql(db, sql);
        setResult(actual);
        setError(null);

        if (check && quest) {
          let passed = false;
          let message = 'The result does not match yet.';
          for (const solution of quest.solutions) {
            const expected = execSql(db, solution);
            const outcome = compareResults(actual, expected);
            if (outcome.ok) {
              passed = true;
              message = outcome.message;
              break;
            }
            message = outcome.message;
          }
          setVerdict({ ok: passed, message });
          if (passed) completeQuest(quest.id, quest.xp);
          setMobileTab('results');
        } else {
          setVerdict(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setResult(null);
        setVerdict(null);
      }
    },
    [db, sql, quest, completeQuest],
  );

  const resetDatabase = () => {
    if (dbKey) invalidate(dbKey);
    setReloadToken((n) => n + 1);
  };

  const insertKeyword = (kw: string) => {
    const base = sql.endsWith(' ') || sql.endsWith('\n') ? sql : `${sql} `;
    setSql(`${base}${kw} `);
  };

  const datasetOptions = [
    ...DATASETS.map((d) => ({ id: d.id, name: d.name })),
    ...(erdReady ? [{ id: 'my-schema', name: 'My schema (ERD)' }] : []),
  ];

  const editorBlock = (
    <div className="flex min-h-0 flex-col">
      {quest ? (
        <div className="border-b border-border bg-elevated/30 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              W{quest.world} · {world?.name}
            </Badge>
            <span className="display text-[0.9375rem]">{quest.title}</span>
            <Badge variant="lime" className="ml-auto">
              +{quest.xp} XP
            </Badge>
          </div>
          <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted-foreground">{quest.brief}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-1 font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground transition-colors hover:text-amber"
            >
              <Lightbulb className="h-3 w-3" />
              {showHint ? 'hide hint' : 'hint'}
            </button>
            <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground/50">
              {quest.teaches.join(' · ')}
            </span>
          </div>
          {showHint && (
            <p className="mt-1.5 rounded-sm border border-amber/25 bg-amber/5 px-2 py-1.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
              {quest.hint}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
            free query · {datasetKey === 'my-schema' ? 'my schema' : getDataset(datasetKey)?.name}
          </p>
          <span className="font-mono text-[0.5625rem] text-muted-foreground/50">
            ⌘↵ to run
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
        <Button size="xs" onClick={() => execute(!!quest)} disabled={!db || loading}>
          <Play className="h-3 w-3" />
          {quest ? 'Check answer' : 'Run'}
        </Button>
        {quest && (
          <Button size="xs" variant="outline" onClick={() => execute(false)} disabled={!db}>
            Run only
          </Button>
        )}
        <Button size="xs" variant="ghost" onClick={resetDatabase} title="Rebuild the database">
          <RotateCcw className="h-3 w-3" />
        </Button>
        <div className="ml-auto">
          <Select
            value={datasetKey}
            onValueChange={(v) => {
              setDatasetKey(v);
              setMobileTab('editor');
            }}
          >
            <SelectTrigger className="h-7 w-[168px] font-mono text-[0.625rem]">
              <DatabaseIcon className="mr-1 h-3 w-3 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {datasetOptions.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-xs">
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-3 pb-3">
        <CodeEditor
          value={sql}
          onChange={setSql}
          language="sql"
          onRun={() => execute(!!quest)}
          minHeight={isDesktop ? 168 : 200}
          ariaLabel="SQL editor"
        />
        <div className="mt-1.5 flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {tables.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setSql(`SELECT *\nFROM ${t.name}\nLIMIT 20;`)}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 font-mono text-[0.5625rem] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Table2 className="h-2.5 w-2.5" />
              {t.name}
              <span className="text-muted-foreground/40">{t.rows}</span>
            </button>
          ))}
        </div>
      </div>

      {!isDesktop && (
        <div className="flex gap-1 overflow-x-auto border-t border-border px-3 py-1.5 no-scrollbar">
          {QUICK_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => insertKeyword(kw)}
              className="shrink-0 rounded-sm border border-border bg-surface px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-wider text-muted-foreground active:bg-elevated"
            >
              {kw}
            </button>
          ))}
        </div>
      )}

      {verdict && (
        <div
          className={cn(
            'mx-3 mb-3 rounded-md border p-2.5',
            verdict.ok ? 'border-lime/40 bg-lime/5' : 'border-destructive/35 bg-destructive/5',
          )}
        >
          <div className="flex items-start gap-2">
            {verdict.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[0.75rem] font-medium">
                {verdict.ok ? 'Quest cleared.' : 'Not quite yet.'}
              </p>
              <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
                {verdict.ok ? `+${quest?.xp ?? 0} XP banked. ${verdict.message}` : verdict.message}
              </p>
              {!verdict.ok && (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="mt-1 font-mono text-[0.5625rem] uppercase tracking-widest text-amber hover:underline"
                >
                  reveal hint
                </button>
              )}
            </div>
            {verdict.ok && nextQuest && (
              <Button size="xs" variant="outline" onClick={() => selectQuest(nextQuest)}>
                Next
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const resultsBlock = (
    <Tabs defaultValue="results" className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2 py-1.5">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="explain">Explainer</TabsTrigger>
        </TabsList>
        {result && (
          <span className="font-mono text-[0.5625rem] text-muted-foreground">
            {result.rows.length} rows · {result.durationMs.toFixed(1)}ms
          </span>
        )}
      </div>
      <TabsContent value="results" className="mt-0 min-h-0 flex-1">
        <ResultGrid result={result} error={error} loading={loading} />
      </TabsContent>
      <TabsContent value="explain" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
        <QueryExplainer sql={sql} result={result} />
      </TabsContent>
    </Tabs>
  );

  const emptyErd = datasetKey === 'my-schema' && !erdReady;

  return (
    <div>
      <PageHeader
        eyebrow="02 · Query master arena"
        title={
          <>
            Query <span className="text-muted-foreground/50">Arena</span>
          </>
        }
        description="Real SQLite in the browser. Five worlds of quests, each answer verified against the actual result set — not a string match."
        actions={
          <>
            <Badge variant="outline" className="hidden sm:inline-flex">
              {state.quests.length}/{QUESTS.length} cleared
            </Badge>
            <Button size="sm" variant="outline" onClick={() => navigate('/erd')}>
              Seed my schema
            </Button>
          </>
        }
      />

      {emptyErd ? (
        <div className="panel flex flex-col items-center justify-center gap-3 p-10 text-center">
          <DatabaseIcon className="h-6 w-6 text-muted-foreground" />
          <p className="display text-lg">No schema to query yet</p>
          <p className="max-w-sm text-[0.8125rem] leading-relaxed text-muted-foreground">
            Design at least one table in the Schema Studio and hit “Seed data”. Your tables will appear here as a
            queryable database.
          </p>
          <Button size="sm" onClick={() => navigate('/erd')}>
            Open Schema Studio
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : isDesktop ? (
        <div className="grid gap-3 lg:grid-cols-[286px_minmax(0,1fr)]">
          <aside className="panel flex flex-col overflow-hidden lg:h-[calc(100dvh-198px)]">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <p className="eyebrow">Quest log</p>
              <span className="font-mono text-[0.5625rem] text-muted-foreground">
                {QUESTS.length} quests
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <QuestList
                selectedId={questId}
                onSelect={selectQuest}
                completed={state.quests}
                datasetKey={datasetKey}
              />
            </div>
          </aside>

          <div className="flex min-h-0 flex-col gap-3 lg:h-[calc(100dvh-198px)]">
            <section className="panel shrink-0 overflow-hidden">{editorBlock}</section>
            <section className="panel flex min-h-[240px] flex-1 flex-col overflow-hidden">
              {resultsBlock}
            </section>
          </div>
        </div>
      ) : (
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="quest" className="flex-1">
              Quest
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex-1">
              Editor
            </TabsTrigger>
            <TabsTrigger value="results" className="flex-1">
              Results
            </TabsTrigger>
          </TabsList>
          <TabsContent value="quest" className="mt-2">
            <div className="panel p-2">
              <QuestList
                selectedId={questId}
                onSelect={selectQuest}
                completed={state.quests}
                datasetKey={datasetKey}
              />
            </div>
          </TabsContent>
          <TabsContent value="editor" className="mt-2">
            <div className="panel overflow-hidden">{editorBlock}</div>
          </TabsContent>
          <TabsContent value="results" className="mt-2">
            <div className="panel flex min-h-[360px] flex-col overflow-hidden">{resultsBlock}</div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
