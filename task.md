# ✅ Build Tasks — Fullstack Wannabe

> Source of truth: `fullstack_wannabe_project_plan.md`
> Rule: every task is checked off **only after the code is written and the build passes**.
> E2E/Playwright suite intentionally skipped for fast delivery (see "Deferred").
>
> **Status: shipped.** `tsc --noEmit` clean, `vite build` clean. Verified against the
> **production build** (`vite preview`): 15/15 functional checks pass, 0 console errors,
> 0 horizontal overflow across 20 route × breakpoint combos. `npm run check:dojo` covers the
> 30-challenge bank offline.

## Phase 0 — Scaffold & Tooling
- [x] Vite + React 18 + TypeScript (`strict`) project initialized
- [x] Tailwind CSS + PostCSS + `cn()` utility + design tokens (oklch, dark/light)
- [x] shadcn/ui-style primitives vendored (button, card, badge, tabs, input, select, switch, dialog, sheet, tooltip, progress, table, separator, scroll-area, dropdown, accordion, label, textarea, skeleton)
- [x] Router + lazy module boundaries (`React.lazy` per module, `Suspense` fallback)
- [x] Deps: `@xyflow/react`, `sql.js` (+ wasm in `public/`), `faker`, `prismjs`, `framer-motion`, `lucide-react`, Radix primitives
- [x] Build passes (`npm run build`)

## Phase 1 — App Shell & Progression System
- [x] Dark "blueprint terminal" identity: Bricolage Grotesque + Instrument Sans + JetBrains Mono, acid-lime / amber accents, grid canvas texture
- [x] Persistent collapsible desktop `Sidebar` (nav, XP bar, active stack badge, module switcher)
- [x] Mobile: compact header + hamburger `Sheet` + sticky bottom nav (ERD / SQL / Dojo / API)
- [x] XP / level / streak / badges store persisted to `localStorage`
- [x] Toast system for XP & achievement popups
- [x] Dashboard: quest map, module cards, progress overview, resume-where-you-left-off

## Phase 2 — Module 1: ERD & Schema Builder
- [x] React Flow canvas with custom table node (columns, types, PK/FK/unique/not-null/default/auto-increment)
- [x] Add / rename / delete tables; add / edit / delete columns
- [x] Relationship edges: 1:1, 1:N, N:M (+ junction table synthesised in the generated DDL), ON DELETE / ON UPDATE actions
- [x] Live SQL DDL generator for PostgreSQL, MySQL, SQLite (CREATE TABLE / ALTER TABLE / constraints / indexes)
- [x] Dialect switcher + copy / download `.sql`
- [x] Dummy data seeder (Faker) that writes rows into the in-browser DB for Module 2
- [x] Mobile: full-screen touch canvas (pinch/pan) + bottom `Drawer` inspector + bottom `Drawer` DDL — *shipped as a `+ Table` toolbar button rather than a floating action button*
- [x] Schema persisted to `localStorage`

## Phase 3 — Module 2: SQL Query Master Arena
- [x] `sql.js` engine wrapper (init, exec, timing, error surface, schema introspection)
- [x] Three themed datasets: E-Commerce Empire, Social Network, Guild RPG (+ generated rows)
- [x] SQL editor with syntax highlighting and line numbers — *the planned mobile quick-keyword bar was superseded by the autocomplete dropdown, which is a better answer on a phone*
- [x] Table chips reveal the live column schema on hover (tap on touch): type, PK / FK / UQ / NN / AI markers, click a column to copy its name
- [x] Autocomplete in the editor — keywords, functions, tables and columns; `↑`/`↓` to move, `Tab`/`Enter` to insert, `Esc` to dismiss; typing `orders.` narrows to that table's columns; suppressed inside comments and strings
- [x] Result grid (sticky header, null rendering, row count, exec time, error panel)
- [x] Visual query explainer: JOIN (Venn/merge) + GROUP BY collapse animation
- [x] Worlds 1–5 curriculum: SELECT/filter, sort/paginate, aggregates, joins, advanced (subquery/CTE/CASE/window) — 27 quests
- [x] Quest validation engine (expected rows vs actual rows, order-insensitive compare) + hints + solution reveal
- [x] XP rewards, world unlock gating, quest completion persisted

## Phase 4 — Module 3: Polyglot Dojo
- [x] Go arena: maps (make/delete/comma-ok/iteration), slices (append/len/cap), structs & pointers, goroutines/channels
- [x] Node arena: map/filter/reduce/find, destructuring/spread, Map/Set/Record, async + Promise.all/allSettled ordering
- [x] **Frontend TS arena** — 8 challenges that run for real: Intl money formatting, grouping derived from state, pagination windows, a reducer over a discriminated union, optimistic row patching, form-error maps, tree flattening, memo diffing
- [x] PHP arena: array_map/filter/reduce, isset/??, Collections (pluck/groupBy/mapWithKeys), PHP 8 promotion/readonly/enums/match
- [x] **Difficulty axis** — every challenge tagged `easy | medium | hard`, XP scaled to it (35 → 100), list grouped Easy → Medium → Hard with per-bucket counters, filter chips (All / Easy / Medium / Hard), difficulty badge on the brief
- [x] 30 challenges total: Go 7 (2/3/2), Node 8 (2/4/2), Frontend 8 (3/3/2), PHP 7 (2/3/2) — every stack covers all three difficulties
- [x] "Transform the Payload" puzzles — *payload is a shared `ORDERS` fixture shaped exactly like the SQL `orders` table, not live-linked to the query result*
- [x] Bug Hunter: unhandled rejection (`Bug hunter: survive a rejection`) — *the nil-map-panic and N+1 variants were not written*
- [x] Live JS execution sandbox + memory/state visualizer (step-through data structure diff)
- [x] **TypeScript executes in the sandbox** — `sucrase` transpiles inside the worker, so `interface` / `type` / generics / annotations work as written, with the same 1.6 s kill switch
- [x] Static-analysis validator for Go/PHP (acceptance rules + expected output)
- [x] `npm run check:dojo` — 16 reference solutions executed, 14 graded through the real `staticCheck()`, starters verified not to pass on their own

## Phase 5 — Module 4: Backend Blueprint
- [x] Folder trees for Go (Standard Layout + Clean Architecture), Node (modular Prisma/Express), PHP (Laravel service/repo)
- [x] Interactive collapsible folder tree with step badges + "why this folder" explanations
- [x] 6-step pipeline: Migration → Model → Repository → Service → Controller → Router
- [x] Per-stack, per-step code viewer wired to the user's ERD schema
- [x] Mini-Postman tester: method/path/body, simulated latency, status codes, JSON response
- [x] Animated request trace across pipeline + folder tree
- [x] Step completion + "Fullstack Architect" badge
- [x] The Frontend TS track is scoped to the Dojo — Blueprint's six layers are server-shaped, so selecting UI there resolves to Node.js with an explicit note instead of silently rendering the PHP tree

## Phase 6 — Polish & Verification
- [x] Responsive audit at 375 / 768 / 1024 / 1440 (no horizontal scroll, no hidden-critical-feature) — 20/20 combos clean
- [x] Empty states, loading states, error states, keyboard focus rings, reduced-motion
- [x] `tsc --noEmit` clean + production build clean
- [x] Smoke test all four modules in the built app — 11/11 checks, 0 console errors

## Not built (cut for scope)
- [ ] Drag-to-reorder columns in the ERD inspector — column order follows insertion order
- [ ] Bug Hunter: nil-map-panic and N+1 challenge variants
- [ ] Live binding of the Dojo payload to the last SQL result set

## Fixes (found after the first release)
- [x] Junction tables emitted one inline `PRIMARY KEY` per member column, so any schema with
      an N:M relation failed to execute — `table "orders_products" has more than one primary key`.
      Composite keys are now emitted once as a table constraint, with explicit `NOT NULL` on members.
- [x] Seeder drew junction sides independently, so duplicate pairs collided with that key.
      It now enumerates the real combinations and samples distinct pairs.
- [x] `staticCheck` stripped comments from the submission but not from the starter before
      comparing lengths, so a heavily-commented starter made correct Go/PHP answers report
      "Nothing changed yet". Both sides are now normalised the same way.
- [x] `go-pointer-receiver`'s reference solution was shorter than its starter, which tripped
      that same guard — it now ships the struct so the reference is self-contained.
- [x] `fe-validate`'s payload was wrapped in `{ values }` while its signature took the values
      object directly, so the reference threw on load.
- [x] `go-error-wrap` and `php-match` had acceptance patterns their own reference solutions
      could not satisfy (`errors.Is` / the enum lived in the starter only).
- [x] `stackFiles()` fell through to the PHP tree for any unrecognised stack, which would have
      shown Laravel files under the Frontend TS track. Now an explicit switch.
- [x] The "Polyglot" badge claimed "at least two stacks" but only counted challenges; it now
      checks distinct stacks. Added "Deep End" for a hard clear in every stack.

## Deferred (explicitly skipped)
- [ ] E2E / Playwright suite — skipped for fast development
- [ ] Real Go/PHP runtime execution (browser-only app → static analysis instead)
- [ ] Backend server / real database (by design: everything runs client-side)
