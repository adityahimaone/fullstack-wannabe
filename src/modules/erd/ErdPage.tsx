import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Database, Download, PanelRight, Plus, Sparkles, SquareTerminal, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/MobileChrome';
import { ErdCanvas } from './ErdCanvas';
import { ErdInspector } from './ErdInspector';
import { useErd } from './store';
import { DIALECTS, type Dialect } from './types';
import { generateSql, schemaStats } from './sql';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeViewer } from '@/components/CodeViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetGrabber, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { copyText, downloadFile } from '@/lib/utils';
import { writeStore } from '@/lib/storage';

export function ErdPage() {
  const { schema, setDialect, addTable, runSeed, loadDemo, clearAll, seed } = useErd();
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null);
  const [selectedRelation, setSelectedRelation] = React.useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = React.useState<'inspect' | 'sql' | null>(null);
  const { push } = useToast();
  const navigate = useNavigate();

  const sql = React.useMemo(() => generateSql(schema), [schema]);
  const stats = React.useMemo(() => schemaStats(schema), [schema]);

  const handleSeed = () => {
    if (schema.tables.length === 0) {
      push({ title: 'Nothing to seed', description: 'Add at least one table first.', variant: 'error' });
      return;
    }
    try {
      const result = runSeed();
      writeStore('erd:seeded', true);
      push({
        title: `Seeded ${result.totalRows} rows`,
        description: `${result.tables.length} tables ready in the Query Arena.`,
        variant: 'success',
      });
    } catch (err) {
      push({
        title: 'Seed failed',
        description: err instanceof Error ? err.message : 'Check your column types.',
        variant: 'error',
      });
    }
  };

  const handleCopy = async () => {
    if (await copyText(sql)) push({ title: 'DDL copied', variant: 'success' });
  };

  return (
    <div>
      <PageHeader
        eyebrow="01 · Architect mode"
        title={
          <>
            Schema <span className="text-tertiary">Studio</span>
          </>
        }
        description="Drag tables, wire relations between columns, and watch production-grade DDL compile as you work. Everything you build here can be seeded and queried in the next module."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={loadDemo}>
              Load demo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (confirm('Clear the canvas and all relations?')) clearAll();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
            <Button size="sm" onClick={handleSeed}>
              <Sparkles className="h-3.5 w-3.5" />
              Seed data
            </Button>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="panel flex h-[62vh] min-h-[420px] flex-col overflow-hidden lg:h-[calc(100dvh-210px)] lg:min-h-[560px]">
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-2.5 py-2">
            <Select value={schema.dialect} onValueChange={(v) => setDialect(v as Dialect)}>
              <SelectTrigger className="h-7 w-[148px] font-mono text-[0.625rem] uppercase tracking-wider">
                <Database className="mr-1 h-3 w-3 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIALECTS.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="font-mono text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="xs" variant="outline" onClick={() => addTable()}>
              <Plus className="h-3 w-3" />
              Table
            </Button>

            <div className="ml-auto flex items-center gap-1.5">
              <Badge variant="outline" className="hidden sm:inline-flex">
                {stats.tables} tables · {stats.columns} cols
              </Badge>
              {seed && (
                <Badge variant="lime" className="hidden sm:inline-flex">
                  seeded {seed.totalRows}
                </Badge>
              )}
              <Sheet
                open={mobilePanel === 'inspect'}
                onOpenChange={(o) => setMobilePanel(o ? 'inspect' : null)}
              >
                <SheetTrigger asChild>
                  <Button size="xs" variant="secondary" className="lg:hidden">
                    <PanelRight className="h-3 w-3" />
                    Inspect
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="px-0">
                  <SheetGrabber />
                  <SheetHeader>
                    <SheetTitle>Inspector</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto px-4 pb-8 pt-3">
                    <ErdInspector
                      tableId={selectedTable}
                      relationId={selectedRelation}
                      onSelectTable={setSelectedTable}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <Sheet open={mobilePanel === 'sql'} onOpenChange={(o) => setMobilePanel(o ? 'sql' : null)}>
                <SheetTrigger asChild>
                  <Button size="xs" variant="secondary" className="lg:hidden">
                    <SquareTerminal className="h-3 w-3" />
                    SQL
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="px-0">
                  <SheetGrabber />
                  <SheetHeader>
                    <SheetTitle>Generated DDL</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto px-4 pb-8 pt-3">
                    <CodeViewer code={sql} language="sql" maxHeight="52vh" filename={`${schema.dialect}.sql`} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <ErdCanvas
              selectedTableId={selectedTable}
              selectedRelationId={selectedRelation}
              onSelectTable={setSelectedTable}
              onSelectRelation={setSelectedRelation}
            />
          </div>
        </div>

        <aside className="panel hidden flex-col overflow-hidden lg:flex lg:h-[calc(100dvh-210px)] lg:min-h-[560px]">
          <Tabs defaultValue="inspect" className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-border px-3 py-2.5">
              <TabsList className="w-full">
                <TabsTrigger value="inspect" className="flex-1">
                  Inspect
                </TabsTrigger>
                <TabsTrigger value="sql" className="flex-1">
                  DDL
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="inspect" className="mt-0 min-h-0 flex-1 overflow-y-auto p-4">
              <ErdInspector
                tableId={selectedTable}
                relationId={selectedRelation}
                onSelectTable={setSelectedTable}
              />
            </TabsContent>
            <TabsContent value="sql" className="mt-0 flex min-h-0 flex-1 flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="eyebrow">{schema.dialect} · {sql.split('\n').length} lines</p>
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" onClick={handleCopy}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => downloadFile(`schema-${schema.dialect}.sql`, sql, 'text/sql')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CodeViewer code={sql} language="sql" maxHeight="100%" className="min-h-0 flex-1" showLineNumbers />
              <Button
                size="sm"
                variant="outline"
                className="w-full shrink-0"
                onClick={() => {
                  if (!seed) handleSeed();
                  navigate('/sql');
                }}
              >
                <SquareTerminal className="h-3.5 w-3.5" />
                Query this schema
              </Button>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          {
            title: 'Drag to relate',
            body: 'Pull a line from any column handle onto another table. The FK constraint is written for you.',
          },
          {
            title: 'N:M writes a pivot',
            body: 'Set an edge to N:M and a junction table with a composite key appears in the DDL.',
          },
          {
            title: 'Seed → query',
            body: 'One click fills every table with believable rows so the Arena has something to chew on.',
          },
        ].map((tip) => (
          <div key={tip.title} className="rounded-md border border-border bg-surface/60 p-3">
            <p className="font-mono text-[0.625rem] uppercase tracking-widest text-primary-ink">{tip.title}</p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted-foreground">{tip.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
