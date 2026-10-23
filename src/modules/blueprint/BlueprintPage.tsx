import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderTree as FolderTreeIcon, Info, PanelLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/MobileChrome';
import { CodeViewer } from '@/components/CodeViewer';
import { FolderTree } from './FolderTree';
import { Pipeline } from './Pipeline';
import { ApiTester } from './ApiTester';
import { STEPS, resolvePath, stackFiles, type StackFile } from './trees';
import { deriveContext } from './ctx';
import { useErd } from '@/modules/erd/store';
import { useMediaQuery } from '@/lib/use-media';
import { useProgress, STACKS } from '@/lib/progress';
import { readStore, writeStore } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetGrabber, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function BlueprintPage() {
  const { schema, seed } = useErd();
  const { state, completeStep, setActiveStack, registerRequest } = useProgress();
  const navigate = useNavigate();
  const stack = state.activeStack;
  const isXl = useMediaQuery('(min-width: 1280px)');

  const [selectedPath, setSelectedPath] = React.useState<string>('');
  const [traceStep, setTraceStep] = React.useState<number | null>(null);
  const [treeOpen, setTreeOpen] = React.useState(false);

  const ctx = React.useMemo(() => deriveContext(schema), [schema]);
  const files = React.useMemo<StackFile[]>(
    () => stackFiles(stack).map((f) => ({ ...f, path: resolvePath(f.path, ctx) })),
    [stack, ctx],
  );

  React.useEffect(() => {
    const saved = readStore<string | null>(`blueprint:file:${stack}`, null);
    const fallback = files.find((f) => f.step === 1) ?? files[0];
    setSelectedPath(saved && files.some((f) => f.path === saved) ? saved : fallback.path);
  }, [stack, files]);

  const selected = files.find((f) => f.path === selectedPath) ?? files[0];
  const activeStep = selected.step > 0 ? selected.step : 1;
  const stepMeta = STEPS.find((s) => s.step === activeStep) ?? STEPS[0];
  const doneSteps = [1, 2, 3, 4, 5, 6].filter((n) => state.steps.includes(`${stack}:${n}`));

  const selectFile = (file: StackFile) => {
    setSelectedPath(file.path);
    writeStore(`blueprint:file:${stack}`, file.path);
    if (file.step > 0) completeStep(stack, file.step);
    setTreeOpen(false);
  };

  const selectStep = (step: number) => {
    const file = files.find((f) => f.step === step);
    if (file) selectFile(file);
  };

  const treePanel = (
    <>
      <div className="shrink-0 space-y-2 border-b border-border p-2.5">
        <p className="eyebrow">Stack</p>
        <div className="flex gap-1">
          {STACKS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStack(s.id)}
              className={cn(
                'flex-1 rounded-sm border px-1 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider transition-colors',
                stack === s.id
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {s.short}
            </button>
          ))}
        </div>
        <p className="font-mono text-[0.5rem] leading-relaxed text-muted-foreground/60">
          {files.length} files · {doneSteps.length}/6 layers visited
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <FolderTree
          files={files}
          activePath={selected.path}
          onSelect={selectFile}
          activeStep={activeStep}
          traceStep={traceStep}
        />
      </div>
    </>
  );

  return (
    <div>
      <PageHeader
        eyebrow="04 · Backend blueprint"
        title={
          <>
            API <span className="text-muted-foreground/50">Blueprint</span>
          </>
        }
        description="Six layers, three stacks, one request path. Click any file to see why it lives in that folder — the code is generated from your own schema."
        actions={
          <>
            {!seed && (
              <Button size="sm" variant="outline" onClick={() => navigate('/erd')}>
                Seed a schema first
              </Button>
            )}
            <Badge variant="outline">
              {ctx.table} · {ctx.model}
            </Badge>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[236px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)_336px]">
        <aside className="panel hidden flex-col overflow-hidden lg:flex lg:h-[calc(100dvh-198px)]">
          {treePanel}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col gap-3 lg:h-[calc(100dvh-198px)]">
          <div className="panel shrink-0 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2 lg:hidden">
              <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
                <SheetTrigger asChild>
                  <Button size="xs" variant="outline">
                    <FolderTreeIcon className="h-3 w-3" />
                    Files
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="px-0">
                  <SheetGrabber />
                  <SheetHeader>
                    <SheetTitle>Folder tree</SheetTitle>
                  </SheetHeader>
                  <div className="flex min-h-0 flex-col overflow-hidden px-2 pb-6">{treePanel}</div>
                </SheetContent>
              </Sheet>
              <span className="truncate font-mono text-[0.5625rem] text-muted-foreground">
                {selected.path}
              </span>
            </div>
            <Pipeline
              activeStep={activeStep}
              doneSteps={doneSteps}
              traceStep={traceStep}
              onSelect={selectStep}
            />
          </div>

          <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="lime">Step {stepMeta.step}</Badge>
                <span className="display text-[0.9375rem]">{stepMeta.name}</span>
                <span className="ml-auto hidden font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground sm:inline">
                  {stack === 'go' ? 'go · gin · gorm' : stack === 'node' ? 'ts · express · prisma' : 'php · laravel 11'}
                </span>
              </div>
              <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted-foreground">{stepMeta.detail}</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {selected.path.split('/').map((part, i, arr) => (
                  <React.Fragment key={`${part}-${i}`}>
                    <span
                      className={cn(
                        'shrink-0 font-mono text-[0.625rem]',
                        i === arr.length - 1 ? 'text-foreground' : 'text-muted-foreground/60',
                      )}
                    >
                      {part}
                    </span>
                    {i < arr.length - 1 && <ArrowRight className="h-2.5 w-2.5 shrink-0 text-border" />}
                  </React.Fragment>
                ))}
                <Badge variant="outline" className="ml-auto shrink-0">
                  {selected.language}
                </Badge>
              </div>

              <div className="flex items-start gap-2 rounded-sm border border-border/70 bg-elevated/30 px-2.5 py-2">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-cyan" />
                <p className="min-w-0 flex-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                  {selected.note}
                </p>
              </div>

              <CodeViewer
                code={selected.code(ctx, schema)}
                language={selected.language}
                filename={selected.path}
                maxHeight="100%"
                className="min-h-0 flex-1"
              />
            </div>
          </section>

          {!isXl && (
            <div className="panel h-[430px] shrink-0 overflow-hidden">
              <ApiTester ctx={ctx} onTrace={setTraceStep} onRequest={registerRequest} />
            </div>
          )}
        </div>

        {isXl && (
          <aside className="panel hidden min-h-0 flex-col overflow-hidden xl:flex xl:h-[calc(100dvh-198px)]">
            <ApiTester ctx={ctx} onTrace={setTraceStep} onRequest={registerRequest} />
          </aside>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2">
        <PanelLeft className="h-3.5 w-3.5 text-violet" />
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          The tree is generated from your ERD table <span className="font-mono text-foreground">{ctx.table}</span> —
          change a column in the Schema Studio and every snippet here updates.
        </p>
        <Button size="xs" variant="ghost" className="ml-auto" onClick={() => navigate('/erd')}>
          Edit schema
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
