import * as React from 'react';
import { ArrowUpRight, Check, Copy, Sparkles, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/MobileChrome';
import { WanniMark, WanniCompact, WanniGlyph, WanniWordmark } from '@/components/brand/marks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WORLD_HAT, type World } from '@/lib/world';
import { cn } from '@/lib/utils';

/* ── the data behind the page ───────────────────────────────────────────── */

type Swatch = {
  name: string;
  css: string;
  role: string;
  /** WCAG ratio of ink on this fill, computed by brand/tokens.mjs. */
  onInk?: string;
  onPaper?: string;
};

const FILLS: Swatch[] = [
  { name: 'lime', css: 'var(--lime)', role: 'brand · primary action · dojo', onInk: '13.63' },
  { name: 'pink', css: 'var(--pink)', role: 'arena · celebration', onInk: '5.63' },
  { name: 'cyan', css: 'var(--cyan)', role: 'schema · node headers', onInk: '9.83' },
  { name: 'grape', css: 'var(--grape)', role: 'blueprint · focus ring', onPaper: '5.01' },
  { name: 'mango', css: 'var(--mango)', role: 'xp · badges · reward', onInk: '9.65' },
  { name: 'mint', css: 'var(--mint)', role: 'success · solved', onInk: '9.24' },
  { name: 'chili', css: 'var(--chili)', role: 'destructive · failing', onPaper: '4.58' },
];

const GROUNDS: Swatch[] = [
  { name: 'paper', css: 'var(--background)', role: 'page ground', onInk: '16.45' },
  { name: 'card', css: 'var(--card)', role: 'raised surface', onInk: '17.36' },
  { name: 'elevated', css: 'var(--elevated)', role: 'inputs · sticker stock', onInk: '17.36' },
  { name: 'stage', css: 'var(--stage)', role: 'night stage', onPaper: '17.00' },
  { name: 'border', css: 'var(--border)', role: 'hairline dividers' },
  { name: 'ink', css: 'var(--edge)', role: 'text · edge · offset' },
];

const INKS: { name: string; css: string; ratio: string }[] = [
  { name: 'lime-ink', css: 'var(--lime-ink)', ratio: '6.70' },
  { name: 'mango-ink', css: 'var(--mango-ink)', ratio: '7.10' },
  { name: 'cyan-ink', css: 'var(--cyan-ink)', ratio: '6.69' },
  { name: 'mint-ink', css: 'var(--mint-ink)', ratio: '7.07' },
  { name: 'grape-ink', css: 'var(--grape-ink)', ratio: '5.01' },
];

const WORLD_LIST: World[] = ['home', 'schema', 'arena', 'dojo', 'blueprint'];

/* ── page ───────────────────────────────────────────────────────────────── */

export function DesignSystem() {
  const [hat, setHat] = React.useState<World>('dojo');
  const [meter, setMeter] = React.useState(62);
  const [switchOn, setSwitchOn] = React.useState(true);

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        eyebrow="The system · v1.0"
        title={
          <>
            Wannabe, <span className="squiggle">drawn</span> not decorated.
          </>
        }
        description="Four material rules, seven colours, three faces, one motion curve. Every surface in this app is a consequence of those — and this page is the proof, rendered with the same components the app ships."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">v1.0</Badge>
            <Button size="sm" variant="outline" asChild>
              <a href="/brand/design-system.html" target="_blank" rel="noreferrer">
                Specimen
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="/brand/brandkit.html" target="_blank" rel="noreferrer">
                Brand kit
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        }
      />

      {/* ── 01 · The mark ─────────────────────────────────────────────── */}
      <Section
        n="01"
        title="The mark"
        note="Wanni is a table node with a face. The header strip is the only variable — one colour per world, and that colour is the hat."
      >
        <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
          <div className="panel-flat overflow-hidden">
            <div className="dot-field grid grid-cols-4 place-items-center gap-4 border-b-[1.5px] border-border px-4 py-7">
              {[88, 56, 32, 20].map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  {size >= 32 ? (
                    <WanniMark size={size} hat={WORLD_HAT[hat]} />
                  ) : (
                    <WanniCompact size={size} hat={WORLD_HAT[hat]} />
                  )}
                  <span className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">
                    {size}px
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-1.5">
                {WORLD_LIST.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setHat(w)}
                    aria-pressed={hat === w}
                    aria-label={`${w} hat`}
                    className={cn(
                      'h-7 w-7 rounded-[8px] border-[2px] transition-transform',
                      hat === w
                        ? 'border-edge shadow-hard-sm -translate-y-0.5'
                        : 'border-border hover:-translate-y-0.5',
                    )}
                    style={{ background: WORLD_HAT[w] }}
                  />
                ))}
              </div>
              <span className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
                swap the hat
              </span>
            </div>
          </div>

          <div className="panel-flat flex flex-col justify-between gap-4 p-4">
            <div>
              <p className="eyebrow">Wordmark</p>
              <div className="mt-3">
                <WanniWordmark height={26} />
              </div>
              <p className="mt-3 text-[0.75rem] leading-relaxed text-muted-foreground">
                Twelve hand-cut letters as paths, never a font. It cannot fall back to a system
                face, cannot be re-lettered by accident, and stays correct at any size.
              </p>
            </div>
            <div className="flex items-end gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <WanniGlyph size={30} />
                <span className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">
                  glyph
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <WanniCompact size={30} hat={WORLD_HAT.arena} />
                <span className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">
                  compact
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <WanniMark size={30} hat={WORLD_HAT.blueprint} />
                <span className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">
                  primary
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 02 · Colour ───────────────────────────────────────────────── */}
      <Section
        n="02"
        title="Colour"
        note="A colour is a label. Two colours on one object is two labels. The ratio under each swatch is the WCAG number for ink on that fill — measured, not eyeballed."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          {FILLS.map((s) => (
            <SwatchTile key={s.name} s={s} />
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {GROUNDS.map((s) => (
            <SwatchTile key={s.name} s={s} />
          ))}
        </div>

        <div className="panel-flat mt-2 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow">Text-safe candy</p>
            <p className="font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
              the bright candy as words · same hue, darkened
            </p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            {INKS.map((i) => (
              <div
                key={i.name}
                className="rounded-[10px] border-[1.5px] border-border bg-card px-2.5 py-2"
              >
                <p className="text-[0.9375rem] font-semibold" style={{ color: i.css }}>
                  Aa 12 XP
                </p>
                <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">
                  {i.name}
                </p>
                <p className="numeric font-mono text-[0.5625rem] text-muted-foreground">
                  {i.ratio}:1
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.75rem] leading-relaxed text-muted-foreground">
            Bright lime as text on cream paper is <strong className="text-foreground">1.2:1</strong>
            . That is not a design choice, it is a bug. Anywhere a colour carries words, use the
            <span className="font-mono"> -ink </span> form; anywhere it carries a fill, use the
            bright one.
          </p>
        </div>
      </Section>

      {/* ── 03 · Material ─────────────────────────────────────────────── */}
      <Section
        n="03"
        title="The material"
        note="One flat fill, one 2.5px ink edge, one 4px hard offset with zero blur. Depth is a second sticker, not a light source."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Demo label="Edge" spec="2.5px solid var(--edge)">
            <div className="h-16 w-full rounded-[12px] border-[2.5px] border-edge bg-card" />
          </Demo>
          <Demo label="Offset" spec="4px 4px 0, blur 0">
            <div className="h-16 w-full rounded-[12px] border-[2.5px] border-edge bg-card shadow-hard" />
          </Demo>
          <Demo label="Both" spec="the only depth in the system">
            <div className="h-16 w-full rounded-[12px] border-[2.5px] border-edge bg-lime shadow-hard" />
          </Demo>
        </div>

        <div className="panel-flat mt-2 p-4">
          <p className="eyebrow">Press physics</p>
          <p className="mt-1.5 max-w-xl text-[0.75rem] leading-relaxed text-muted-foreground">
            Hover lifts 1px and grows the offset to 6. Pressed travels 4px into its own shadow and
            the shadow collapses to zero, in 90ms. The button never gets a blur, a glow, or a
            gradient — it gets a shadow it can stand in.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button>Press me</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>
      </Section>

      {/* ── 04 · Type ─────────────────────────────────────────────────── */}
      <Section
        n="04"
        title="Type"
        note="No fourth family. The playfulness is carried by colour and shape, not by a novelty font."
      >
        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          <div className="panel-flat space-y-4 p-4">
            <div>
              <p className="eyebrow">Display · Bricolage Grotesque 700</p>
              <p className="display mt-2 text-[2rem] leading-[0.98]">
                Design the schema.
                <br />
                Then earn the API.
              </p>
              <p className="mt-1.5 font-mono text-[0.5625rem] text-muted-foreground">
                -0.035em · line-height 0.98 · never a paragraph
              </p>
            </div>
            <Separator />
            <div>
              <p className="eyebrow">Reading · Instrument Sans 400–650</p>
              <p className="mt-2 max-w-prose text-[0.9375rem] leading-[1.6] text-pretty">
                Four modules chain into one workflow: draw tables, seed them, interrogate them with
                SQL, then rebuild the backend layers around them. Every answer is checked against
                real execution, so the feedback is never an opinion.
              </p>
              <p className="mt-1.5 font-mono text-[0.5625rem] text-muted-foreground">
                17px / 1.6 · text-wrap: pretty
              </p>
            </div>
            <Separator />
            <div>
              <p className="eyebrow">Fact · JetBrains Mono</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-4">
                <span className="numeric text-lg font-semibold">1,284 XP</span>
                <span className="numeric text-lg font-semibold">0.742 s</span>
                <span className="numeric text-lg font-semibold">16 / 18</span>
              </div>
              <p className="mt-1.5 font-mono text-[0.5625rem] text-muted-foreground">
                11px · 0.13em caps · tabular numbers, always
              </p>
            </div>
          </div>

          <div className="panel-flat p-4">
            <p className="eyebrow">Scale</p>
            <ul className="mt-3 space-y-2">
              {[
                ['display-xl', '2.15rem', 'page hero'],
                ['display-lg', '1.75rem', 'section hero'],
                ['display', '1.125rem', 'card title'],
                ['body', '0.875rem', 'reading'],
                ['small', '0.75rem', 'secondary'],
                ['fact', '0.6875rem', 'mono caps'],
                ['micro', '0.5625rem', 'metadata'],
              ].map(([name, size, use]) => (
                <li key={name} className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[0.6875rem] text-foreground">{name}</span>
                  <span className="numeric font-mono text-[0.5625rem] text-muted-foreground">
                    {size}
                  </span>
                  <span className="w-24 shrink-0 text-right text-[0.625rem] text-muted-foreground">
                    {use}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── 05 · Controls ─────────────────────────────────────────────── */}
      <Section
        n="05"
        title="Controls"
        note="A field is the one object with no offset — it is a hole cut in the paper. Focus swaps its edge to grape and adds a hard 3px step."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="panel-flat space-y-4 p-4">
            <div>
              <p className="eyebrow mb-2">Buttons</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="lg">Large</Button>
                <Button>Default</Button>
                <Button size="sm">Small</Button>
                <Button size="xs">Tiny</Button>
                <Button size="icon" aria-label="Sparkle">
                  <Sparkles />
                </Button>
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2">Fields</p>
              <div className="space-y-2">
                <Input placeholder="table_name" defaultValue="order_items" />
                <Textarea rows={2} placeholder="SELECT …" defaultValue={'SELECT * FROM users\nLIMIT 20;'} />
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2">Tabs</p>
              <Tabs defaultValue="results">
                <TabsList>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="explainer">Explainer</TabsTrigger>
                  <TabsTrigger value="schema">Schema</TabsTrigger>
                </TabsList>
                <TabsContent value="results" className="text-[0.8125rem] text-muted-foreground">
                  27 rows returned in 4 ms.
                </TabsContent>
                <TabsContent value="explainer" className="text-[0.8125rem] text-muted-foreground">
                  The planner chose a sequential scan because the table is small.
                </TabsContent>
                <TabsContent value="schema" className="text-[0.8125rem] text-muted-foreground">
                  users, orders, order_items, products.
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="panel-flat space-y-4 p-4">
            <div>
              <p className="eyebrow mb-2">Switch</p>
              <label className="flex items-center gap-3 text-[0.8125rem]">
                <Switch checked={switchOn} onCheckedChange={setSwitchOn} aria-label="Toggle demo" />
                <span className="text-muted-foreground">
                  Strict mode — {switchOn ? 'on' : 'off'}
                </span>
              </label>
            </div>
            <div>
              <p className="eyebrow mb-2">Badges</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="lime">+30 XP</Badge>
                <Badge variant="amber">Streak</Badge>
                <Badge variant="violet">N:M</Badge>
                <Badge variant="destructive">Failing</Badge>
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2">Chips</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="chip">orders</span>
                <span className="chip">users · 16</span>
                <span className="chip">1:N</span>
                <span className="chip">postgresql</span>
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2">Tooltip</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    Hover the ink sticker
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ink fill, paper text. Flips with the theme.</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 06 · Feedback ─────────────────────────────────────────────── */}
      <Section
        n="06"
        title="Feedback"
        note="Progress is eight notches, not a smooth bar. Colour never carries a state alone — the shape or the label always says it too."
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="panel-flat p-4">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">XP meter</p>
              <span className="numeric font-mono text-[0.6875rem] text-muted-foreground">
                {meter}%
              </span>
            </div>
            <Progress value={meter} className="mt-3" />
            <input
              type="range"
              min={0}
              max={100}
              value={meter}
              onChange={(e) => setMeter(Number(e.target.value))}
              className="mt-3 w-full accent-[oklch(var(--primary-c))]"
              aria-label="XP meter value"
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-1.5">Quest · 5 notches</p>
                <Progress value={40} segments={5} size="sm" />
              </div>
              <div>
                <p className="eyebrow mb-1.5">Inline · 4 notches</p>
                <Progress value={75} segments={4} size="sm" indicatorClassName="bg-mint" />
              </div>
            </div>
          </div>

          <div className="panel-flat p-4">
            <p className="eyebrow mb-2">Notifications</p>
            <div className="space-y-2">
              <ToastRow tone="default" icon={<Sparkles className="h-4 w-4" />} title="Saved locally" body="Your schema is in this browser, nowhere else." />
              <ToastRow tone="success" icon={<Check className="h-4 w-4" />} title="Quest cleared" body="+30 XP · The Basics is done." />
              <ToastRow tone="error" icon={<X className="h-4 w-4" />} title="Query failed" body="no such column: order_totals — check the alias on line 3." />
            </div>
            <div className="mt-4">
              <p className="eyebrow mb-2">Loading</p>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 07 · Surfaces ─────────────────────────────────────────────── */}
      <Section
        n="07"
        title="Surfaces"
        note="Four surfaces, no more. Anything that needs a fifth is a layout problem, not a colour problem."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] border-[2.5px] border-edge bg-card p-4 lift">
            <p className="eyebrow">panel</p>
            <p className="mt-2 text-[0.8125rem] text-muted-foreground">
              Card on paper. Edge plus a 4px offset.
            </p>
          </div>
          <div className="rounded-[18px] border-[2.5px] border-edge bg-card p-4">
            <p className="eyebrow">panel-flat</p>
            <p className="mt-2 text-[0.8125rem] text-muted-foreground">
              Same cut, no offset. For full-bleed containers.
            </p>
          </div>
          <div className="stage relative overflow-hidden p-4">
            <div className="dot-field absolute inset-0" aria-hidden />
            <p className="relative font-mono text-[0.6875rem] uppercase tracking-[0.13em] on-stage-3">
              stage
            </p>
            <p className="relative mt-2 text-[0.8125rem] on-stage-2">
              Night ground. The only place bright candy is legible as text.
            </p>
          </div>
          <div className="sticker p-4">
            <p className="eyebrow">sticker</p>
            <p className="mt-2 text-[0.8125rem] text-muted-foreground">
              Rotated 1.5°. Never more than 3°.
            </p>
          </div>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card with a header strip</CardTitle>
              <CardDescription>The header names the object — the mark's move, at card scale.</CardDescription>
            </CardHeader>
            <CardContent className="text-[0.8125rem] leading-relaxed text-muted-foreground">
              Header, body and footer are separated by 1.5px hairlines rather than by colour, so
              the card reads as one sheet with folds in it.
            </CardContent>
          </Card>

          <div className="node-card">
            <div
              className="node-head"
              style={{ ['--node-accent' as string]: 'var(--cyan)', ['--node-on' as string]: 'var(--on-candy)' }}
            >
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] leading-tight">order_items</p>
                <p className="mt-0.5 font-mono text-[0.5625rem] uppercase leading-none tracking-[0.14em]">
                  4 cols
                </p>
              </div>
              <span className="chip-on shrink-0 rounded-[6px] border-[1.5px] px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest">
                id
              </span>
            </div>
            <div className="divide-y-[1.5px] divide-border/70 bg-card">
              {[
                ['id', 'bigint'],
                ['order_id', 'bigint'],
                ['product_id', 'bigint'],
                ['quantity', 'int'],
              ].map(([c, t]) => (
                <div key={c} className="flex items-center gap-2 px-2.5 py-[5px] text-[0.6875rem]">
                  <span className="min-w-0 flex-1 truncate font-mono">{c}</span>
                  <span className="font-mono text-[0.5625rem] uppercase tracking-wider text-muted-foreground">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 08 · Decoration ───────────────────────────────────────────── */}
      <Section
        n="08"
        title="Decoration"
        note="Only in empty states, heroes and completion screens — never behind the editor, the ERD canvas or a data table."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Deco label="dot-field">
            <div className="dot-field h-full w-full" />
          </Deco>
          <Deco label="grid-canvas">
            <div className="grid-canvas h-full w-full" />
          </Deco>
          <Deco label="halftone">
            <div className="relative h-full w-full bg-card">
              <div className="halftone absolute inset-0" />
            </div>
          </Deco>
          <Deco label="tape">
            <div className="relative h-full w-full bg-card">
              <div className="tape absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </Deco>
          <Deco label="corner-ticks">
            <div className="corner-ticks relative h-full w-full bg-card" />
          </Deco>
          <Deco label="squiggle">
            <div className="grid h-full w-full place-items-center bg-card">
              <span className="squiggle text-[0.8125rem] font-semibold">underlined</span>
            </div>
          </Deco>
        </div>
      </Section>

      {/* ── 09 · Rules ────────────────────────────────────────────────── */}
      <Section n="09" title="The six don'ts" note="Short, because the system is small.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            'No seventh accent. The palette is full.',
            'No gradient, glow or blurred shadow. No exception.',
            'No second colour on one object.',
            'No rotation past 3°, ever.',
            'No colour as the only carrier of a state.',
            'No loop animation while code is on screen.',
          ].map((rule) => (
            <div
              key={rule}
              className="flex items-start gap-2.5 rounded-[12px] border-[2px] border-destructive/35 bg-destructive/[0.06] p-3"
            >
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              <p className="text-[0.75rem] leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </Section>

      <p className="flex items-center justify-center gap-2 px-1 pt-2 text-center font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Copy className="h-3 w-3" />
        generated from brand/build-marks.mjs · brand/tokens.mjs · brand/build-react.mjs
      </p>
    </div>
  );
}

/* ── local pieces ───────────────────────────────────────────────────────── */

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline gap-3">
        <span className="numeric shrink-0 rounded-[6px] border-[1.5px] border-edge bg-elevated px-1.5 py-0.5 font-mono text-[0.5625rem] font-bold">
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="display text-[1.0625rem] leading-tight">{title}</h2>
          <p className="mt-1 max-w-3xl text-[0.75rem] leading-relaxed text-muted-foreground">
            {note}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SwatchTile({ s }: { s: Swatch }) {
  const ratio = s.onInk ?? s.onPaper;
  return (
    <div className="overflow-hidden rounded-[12px] border-[2.5px] border-edge bg-card lift-sm">
      <div className="h-14" style={{ background: s.css }} />
      <div className="px-2 py-1.5">
        <div className="flex items-baseline justify-between gap-1">
          <p className="font-mono text-[0.5625rem] font-semibold uppercase tracking-wider">
            {s.name}
          </p>
          {ratio && (
            <p className="numeric font-mono text-[0.5rem] font-bold text-muted-foreground">
              {ratio}
            </p>
          )}
        </div>
        <p className="mt-0.5 text-[0.5625rem] leading-snug text-muted-foreground">{s.role}</p>
      </div>
    </div>
  );
}

function Demo({
  label,
  spec,
  children,
}: {
  label: string;
  spec: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel-flat p-3">
      {children}
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <p className="font-mono text-[0.5625rem] font-semibold uppercase tracking-wider">{label}</p>
        <p className="font-mono text-[0.5rem] text-muted-foreground">{spec}</p>
      </div>
    </div>
  );
}

function Deco({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[12px] border-[2px] border-edge">
      <div className="h-16">{children}</div>
      <p className="border-t-[1.5px] border-border bg-card px-2 py-1 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ToastRow({
  tone,
  icon,
  title,
  body,
}: {
  tone: 'default' | 'success' | 'error';
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const edge = { default: 'border-edge', success: 'border-mint', error: 'border-destructive' }[tone];
  const ink = {
    default: 'text-muted-foreground',
    success: 'text-mint-ink',
    error: 'text-destructive',
  }[tone];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[14px] border-[2.5px] bg-popover p-3 shadow-hard-sm',
        edge,
      )}
    >
      <span className={cn('mt-0.5', ink)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-semibold leading-snug">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
