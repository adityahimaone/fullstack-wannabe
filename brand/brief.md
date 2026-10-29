# Brief — Fullstack Wannabe

**Status:** approved direction, v1.0 · 2026
**Mode:** brand kit + design system, fresh identity replacing the app's original shell
**Slug / namespace:** `wannabe` · `--wb-` primitives, semantic aliases on top

---

## One sentence

> Fullstack Wannabe is a browser-only backend playground for self-taught developers that turns schema design into levels you can clear, made of sticker stock, a 2.5px ink edge and six candy worlds.

A reviewer can reject this: point at a card with a blurred shadow, a seventh accent, or a
surface that is not cut from the same sheet, and the sentence fails.

## Category, audience, promise

| | |
|---|---|
| **Category** | Developer education — a gamified, offline learning app |
| **Audience** | Self-taught developers who can write a component but freeze at `JOIN`, migrations and routing. They have played games. They have not been taught backend as one. |
| **Promise** | Draw the schema, seed it, query it, then rebuild the backend around it — and get a score for it. |
| **Positioning** | The only backend curriculum that is a *level map*, not a chapter list. The identity has to look like a game you can win, not a course you can fail. |

## What the app already is

Four modules, chained: Schema Studio (ERD → DDL → seed) → Query Arena (27 SQL quests,
live SQLite) → Polyglot Dojo (30 challenges, Go / Node / TS / PHP) → API Blueprint
(six layers, request tracer). Ten levels, seven badges, XP, streaks. Dark by default.

That is a game. The previous identity — near-black, one lime accent, mono eyebrows,
1px borders, corner ticks — was an audit. It made the product look *rigorous* and
*unplayable*.

## Domain before defaults

**Five concepts from the product's world, not its features**

1. The **table node** — the first thing you draw, a rectangle with a header strip and rows.
2. The **level ladder** — Curious Intern → Wannabe No More, ten rungs.
3. The **quest map** — five worlds, a dotted route, a flag at the end of each.
4. The **dojo belt** — rank earned by repetition, not by reading.
5. The **foreign key** — the thing that unlocks the next table.

**Five colours from the physical version of that world**

1. Arcade cabinet marquee pink — the attract-mode glow.
2. Highlighter lime — the marker you revise with.
3. Gummy grape — the deepest sweet in the packet.
4. Pool-toy cyan — chlorine blue, holiday.
5. Mango sticky rice — the reward colour.

**The signature** — the *hat*. The mark's header strip is the only part of the logo that
changes colour, and it changes per world. One character, four outfits. No other learning
brand can copy it without copying the mark.

**Three obvious defaults in this category, and what we did instead**

| Default | Why it exists | What we did |
|---|---|---|
| Dark slate + one electric accent + mono labels | Signals "serious developer tool" | Cream paper ground, ink edges, six candy fills, hard offsets |
| A mascot as a sticker pack of 12 cute shapes | Cheap charm | A mascot that is the product's own object — a table node — plus a cast of six with written jobs |
| Gradient mesh / glass hero | Reads as "modern SaaS" | Zero gradients, zero blur. Depth is a second sticker underneath |

## Stack, sizes, accessibility

- Vite 6 · React 18 · TypeScript strict · Tailwind 3 · Radix primitives (already in the app).
- Fonts already loaded: **Bricolage Grotesque** (display), **Instrument Sans** (reading),
  **JetBrains Mono** (facts). No new dependency.
- Targets: 1440 and 390. Body 17px, inputs 16px, captions 13px minimum.
- Contrast measured, not eyeballed: ink on paper **16.45:1**, ink on lime **13.63:1**,
  cream on grape **5.01:1**. Body text never on grape (**3.28:1** — banned).
- Every state carries a shape or a word, never colour alone.

## Deliverables

| Path | What it is |
|---|---|
| `brand/design-system.html` | The specimen — 12 sections, light + dark, the argument |
| `brand/brandkit.html` + `brand/assets/wannabe-brandkit.png` | The 3000×2250 board |
| `public/brand/wannabe/` | mark, compact, glyph, mono, wordmark, lockups, favicons, cast, tokens, forms |
| `brand/brief.md` · `story.md` · `DESIGN.md` | The decisions |
| `docs/wannabe-design-system-audit.md` | What is proven, what is not |

## Assumptions (marked, not hidden)

- **ASSUMPTION** — the app keeps dark mode as a first-class theme. The brand's primary
  expression is light (cream paper); dark is the "arcade at night" mode, not the default.
- **ASSUMPTION** — the four world colours map to the four modules in the order
  schema → arena → dojo → blueprint. If the product renames a module, the mapping holds
  because the names are semantic (`--world-schema`), not literal.
- **ASSUMPTION** — the mascot is called **Wanni**. Nothing in the product forces a name;
  this one is short, matches the brand, and survives translation.
- **NOT DONE** — the identity is not yet applied to the app shell. This is the kit.
