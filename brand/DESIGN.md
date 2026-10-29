# DESIGN.md — the rules

The system is small on purpose. Four material rules, six colours, three faces, one motion
curve. Everything else is a consequence.

---

## 1 · The material

| Rule | Value | Why |
|---|---|---|
| Edge | `2.5px solid var(--edge)` on every object | One sheet, cut up. The edge is always the foreground colour. |
| Offset | `4px 4px 0 var(--offset)`, **0 blur** | Depth is a second sticker, not a light source. |
| Fill | One flat colour per object | A colour is a label; two colours is two labels. |
| Header | A strip that names the object | The same move as the mark, at every scale. |
| Radius | 8 / 12 / 18 / 26 | Small controls 12, cards 18, stages 26. |
| Gradient | None, anywhere | Not in marks, not in buttons, not in decoration. |

**Press physics.** Hover `translate(-1px,-1px)` + offset 6. Rest 4. Pressed
`translate(4px,4px)` + offset 0, in 90ms. The button travels into its own shadow.

## 2 · Colour

| Token | Light | Job |
|---|---|---|
| `--wb-ink` | `#1B1626` | Text, edges, offsets. Flips to cream in dark. |
| `--wb-paper` | `#FFF6E5` | Page ground. Flips to `#171226` in dark. |
| `--wb-card` | `#FFFDF7` | Raised surface. |
| `--wb-lime` | `#C6F24E` | Brand, primary action, dojo. |
| `--wb-pink` | `#FF4D8D` | Arena, celebration. |
| `--wb-cyan` | `#2ED3F0` | Schema Studio, node headers. |
| `--wb-grape` | `#6C4BF0` | API Blueprint, focus ring. |
| `--wb-mango` | `#FFB020` | XP, badges, rewards. |
| `--wb-mint` | `#2ED3A6` | Success, solved. |
| `--wb-chili` | `#DC1F2C` | Destructive, failing. |

**Text on a fill never inherits the theme.** `--wb-oncandy` (`#1B1626`), `--wb-ongrape`
(`#FFF6E5`) and `--wb-ondanger` are fixed, because `--wb-ink` flips in dark and
"ink on lime" would become cream on lime at **1.12:1**. This is the single most likely
place to break the system.

Banned: body text on grape (3.28:1), cream on pink (2.92:1), any colour as the only
carrier of a state.

## 3 · Type

| Role | Face | Setting |
|---|---|---|
| Display | Bricolage Grotesque 700 | `-0.035em`, line-height 0.98, `text-wrap: balance` |
| Reading | Instrument Sans 400–650 | 17px / 1.6, `text-wrap: pretty` |
| Fact | JetBrains Mono 400–700 | 11px, `.13em` caps, tabular numbers |

No fourth family. The playfulness is carried by colour and shape, not by a novelty font.
Display is never used for a paragraph. Numbers that change are always tabular.

## 4 · The mark

- **Wanni** — node + dog-ear + header strip + face. 64 grid, cut 2.8, offset 3.5.
- **Compact** — a separate drawing: no dog-ear, no ticks, cut 3.4, bigger face. 16px minimum.
- **Glyph** — the node without its field or offset, for stickers and patterns.
- **Mono** — one ink, face knocked out. For stamps and single-colour print.
- **Wordmark** — drawn paths, stroke 5.8, `skewX(-6)`. No `<text>`, ever.
- **Hat** — `--hat` sets the header strip. Default lime. Never tint the body or the face.
- **Cast** — spark / bolt / flag / dice / gem / key. Decorative, `aria-hidden`, never a fact.

Clear space: half a tile. Minimum 24px (mark), 16px (compact). The favicon is the compact
drawing, not the glyph.

## 5 · Applying it to the app

**Status: applied.** The whole shell, all `ui/*` primitives and all four modules now run on
this system. `/design-system` renders it live from the same components the app ships, so the
page cannot drift from the product.

Three layers, in order:

1. **Tokens.** `brand/tokens.mjs` writes `src/styles/wannabe-tokens.css`, imported at the top
   of `src/index.css`. It re-points the app's *existing* names (`--background-c`,
   `--primary-c`, `--border-c`, `--ring-c`, …) at the brand primitives, so anything already
   using those tokens re-skins for free.
2. **Material.** `src/index.css` composes `--x` from `--x-c` and defines the four classes
   everything else is built from: `.edge`, `.lift`, `.press`, plus `.stage`, `.panel`,
   `.panel-flat` and `.node-card`.
3. **Components.** `ui/*` primitives carry the material; pages only choose a surface.

### Contrast is enforced, not eyeballed

There are two gates, and both fail the build.

**The token gate.** `brand/tokens.mjs` ends with a 43-pair table — every text/ground
combination the app actually renders — and calls `process.exit(1)` if any pair is under
its WCAG floor. You cannot write a bad token; the generator refuses to emit the file.

**The DOM gate.** `npm run audit` walks the production build across 6 routes × 2 themes,
resolves every text run's *effective* background by compositing translucent layers
bottom-up, and reports failing pairs grouped by colour. 1,424 pairs, zero failures today.

The three-step text ramp is the thing that made this possible:

| Step | Token | Use |
|---|---|---|
| 1 | `text-foreground` | body copy, anything the user must read first |
| 2 | `text-muted-foreground` | secondary copy — 6.8:1 light / 8.2:1 dark |
| 3 | `text-tertiary` | metadata, codes, captions — 5.2:1 both |

**Hierarchy is size and weight now, not opacity.** `text-muted-foreground/50` is 2.27:1 on
cream — that is not "quiet", it is broken. Sixty call sites were moved onto the ramp.

### Things that will bite you

- **`@tailwind utilities` is emitted after `@tailwind components`.** A utility always beats a
  component class, *regardless of specificity*. So `.press:hover` cannot override `shadow-hard`,
  and `.on-stage` cannot override `text-primary-foreground`. Where a component-layer class must
  win, express it as a variant (see `variant: 'stage'` in `button.tsx`) or use a utility.
- **`--wb-offset` was the colour and `--wb-offset` was also `4px`.** The later declaration
  silently killed the colour and turned every hard shadow into `4px 4px 0 0 4px`. The distance
  token is now `--wb-shift`.
- **`text-primary` on cream paper is 1.2:1.** 36 `text-primary` and 60 other candy-as-text call
  sites were re-pointed at the `-ink` forms (`text-lime-ink`, `text-mango-ink`, …). Fills keep
  the bright candy; words use the ink.
- **Arbitrary values containing `var(... / 0.2)`** are parsed as Tailwind opacity modifiers and
  produce nothing. That is why the stage has `.on-stage-2`, `.stage-line` and `.meter-on-stage`
  instead of inline `oklch(var(--x)/0.2)` strings.
- **`--hat` must be set through CSS**, so the mark is inlined as React (`brand/build-react.mjs`
  → `src/components/brand/marks.tsx`), never an `<img>`. Each instance namespaces its clipPath
  with `useId()`, or two marks on one page clip each other.
- **A JSX attribute is a string literal, so `url(#…)` has to be a template literal.** The
  generator emitted `id={`${u}t`}` but `clipPath="url(#${u}t)"` — the id resolved, the
  reference shipped the five literal characters `${u}t`, matched nothing, and the clip was
  silently dropped. Every mark rendered its hat as a raw 66×17 rectangle with square corners
  poking out of the rounded node. It is valid JSX and throws no error, so it survived review,
  the smoke suite and the contrast audit. Both halves are template literals now, and
  `build-react.mjs` refuses to write a file that still contains a plain-string clip reference.
- **`soft()` mixes in sRGB, and that overshoots lightness in dark mode.** 18% of the way from
  `#221A33` toward cream lands on `#928B9B` — oklch L 0.648, a *light grey* surface, with cream
  text on it at 2.32:1. A muted surface has to step **away** from the text, so at night it is
  darker than the card. `muted` and `secondary` are explicit hex now, never mixed.
- **`border-current/45` does not exist.** Tailwind 3 has no alpha channel for `currentColor`
  and silently emits nothing, so the chip loses its edge. Use `.chip-on` (color-mix).
- **CSS `opacity` is not a colour.** It flattens the subtree into a group and composites it at
  the given alpha, so text *and* background fade together. The audit missed this at first:
  `opacity-55` on a badge card hid a 2.54:1 failure because the resolver saw full-strength ink
  on a full-strength card and reported 16:1. Fixed — but it is why "locked" is a dashed edge
  and the low end of the ramp, never a faded card.
- **A `Suspense` boundary that wraps `<Routes>` wraps the shell too.** Any lazy chunk then
  suspends the layout: sidebar gone, skeleton flush against the viewport edge. That was the
  "no outer margin" bug — the margin was never the problem. The boundary belongs *inside*
  `AppShell`, around `<Outlet />`, so the chrome survives navigation.
- **`grep` with `\|` alternation and `$var` word-splitting both silently no-op in zsh.** Use
  the Grep tool, and pipe `grep -l` into `xargs` rather than `$files`.

### The checklist this replaced

| # | Item | Where |
|---|---|---|
| 1 | 2.5px `border-edge` on every object | `.edge`, `.panel`, `ui/*` |
| 2 | radii 8 / 12 / 18 / 26 | `tailwind.config.js` |
| 3 | `4px 4px 0` offsets, zero blur | `.lift`, `shadow-hard*` |
| 4 | press physics | `.press`, `.press-sm` |
| 5 | eyebrows stop shouting past three words | `.eyebrow` / `.eyebrow-lower` |
| 6 | mark + wordmark, `--hat` per module | `Logo.tsx`, `lib/world.ts` |
| 7 | 8-segment XP meter | `ui/progress.tsx` |
| 8 | decoration only off the working surfaces | `Dashboard.tsx` stage only |

## 6 · Do not

- Do not add a seventh accent. The palette is full.
- Do not use a gradient, a glow, or a blurred shadow. There is no exception.
- Do not put the cast over type, in a form field, or in a favicon.
- Do not re-cut the face or add a second accent to the mark.
- Do not rotate a sticker more than 3°.
- Do not animate on loop while the user is reading code.
- Do not use "Oops!" — errors say what happened and what to do.
- Do not let colour alone carry a state.

## 7 · Files

```
public/brand/wannabe/
  mark.svg  mark-compact.svg  mark-mono.svg  mark-reverse.svg  glyph.svg  favicon.svg
  wordmark.svg  lockups/{horizontal,stacked}.svg
  cast/{spark,bolt,flag,dice,gem,key}.svg
  wannabe-tokens.css  tokens.json  wannabe-forms.css  sheet.html
brand/
  brief.md  story.md  DESIGN.md  design-system.html  brandkit.html
  contrast-audit.json   (last run: pairs scanned + failures)
  assets/wannabe-brandkit.png
  explore/   (the two rounds, kept as evidence)
  shots/     (screenshots, produced by scripts/shot.mjs)

scripts/
  audit-contrast.mjs   DOM contrast audit over the production build
  smoke.mjs  shot.mjs  check-dojo.mjs  copy-wasm.mjs

src/
  styles/wannabe-tokens.css        generated — imported by index.css
  components/brand/marks.tsx       generated — WanniMark / Compact / Glyph / Wordmark
  components/layout/PageSkeleton.tsx  lazy-route fallback, renders inside the shell
  pages/DesignSystem.tsx           /design-system, built from the real components
  lib/world.ts                     route → world → --hat
```

Regenerate, never hand-edit (`npm run brand`):

```bash
node brand/build-marks.mjs   # every svg, from one geometry source
node brand/tokens.mjs        # oklch channels + contrast proof → css, json, app css
node brand/build-react.mjs   # svg → jsx, hex → tokens, ids → useId()
node brand/build-page.mjs    # sprite into the specimen + the board
```

Verify:

```bash
npm run check:dojo                        # offline challenge-bank integrity
npm run build && npm run preview          # production build
npm run smoke                             # 15 CDP checks incl. overflow + console errors
npm run audit                             # DOM contrast: 6 routes × 2 themes, fails on any pair
npm run shots                             # 1440/390 × light/dark → brand/shots/
```

`audit` and `shots` both need a preview server running (`BASE_URL` overrides the default
`http://127.0.0.1:4173`). If `smoke` reports "Chrome did not expose a debuggable page", an
orphaned Chrome is holding 9222 — set `SMOKE_CDP_PORT=9777` and rerun.
