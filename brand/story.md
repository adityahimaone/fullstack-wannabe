# Story — why the table has a face

## The spine

| Beat | |
|---|---|
| **Belief** | A backend is a game. The score is just hidden. |
| **Enemy** | The developer-tool costume: slate grey, 1px borders, one electric accent, a mono label standing in for rigour. It reads as an audit, and nobody plays an audit twice. |
| **Mark** | A table node that grew a face — the exact object you draw first in Schema Studio, and the thing that wants to become a full stack. |
| **Material** | Sticker stock. 2.5px ink edge, 4px hard offset, one flat fill per object, no blur, no gradient. |
| **Voice** | Plain, specific, second person. Confident about the work, modest about itself. |
| **Proof** | 16.45:1 ink on paper · 13.63:1 ink on lime · a 16px compact that still reads · six cast marks with one written job each. |
| **Gap** | The cast has no animated idle. The kit is not applied to the app shell. Dark-mode field contrast is measured on paper, not on `#241B36`. |

## The one sentence

> Fullstack Wannabe is a browser-only backend playground for self-taught developers that turns schema design into levels you can clear, made of sticker stock, a 2.5px ink edge and six candy worlds.

## Six marks, and why five lost

All six were drawn on the same 64 grid, with the same 2.8 cut and the same palette,
then tested at 128 / 32 / 16. Evidence: `brand/explore/concepts.png` and `concepts-2.png`.

| # | Concept | Verdict |
|---|---|---|
| **A2** | **Level Table** — node, dog-ear, header strip, face | **Kept.** Reads at 16px. The header reads as a title bar, not a roof, once the node is wider than it is tall. The only one that is *cheerful* without a caption. |
| A3 | Node + spark (no face) | Sharper at 16, but it stops being a character. It says "data", not "play". Coldest of the four. |
| A4 | Face + level sticker | Two ideas, one of them small. The pink star collides with the right eye at 16px and turns into a smudge. |
| B | Stair rows | Reads as a bar chart — the most generic silhouette of the set, and growth charts are the category default. |
| C | Stack pinwheel | Four bars collide at the centre and the outer shape becomes a plus sign. Colour did not rescue an unclear geometry. |
| D | Key tab | The foreign-key pun is good and the drawing is not: at 16px it becomes a cartoon whistle. |
| E2 | Caret flag | The boldest silhouette of the six, and the wrong message: it says "finish", not "play". |

A2 also survived the practical test the others failed: it can be re-drawn *simpler* for 16px
(compact: no dog-ear, no ticks, heavier cut, bigger face) without becoming a different mark.

## Why the mark argues

A table is the least emotive object in the product. Giving it a face is the argument:
the schema is not paperwork you submit, it is a thing you build with and level up.
The dog-ear is the sticker peel — this object is stuck on the page, not printed in it.
The header strip is the "hat": the one part that changes per world, which is how the logo
participates in the game instead of watching it.

## Decision cards

```
Decision    A 2.5px ink edge on every object, and it is always the foreground colour.
Because     The whole identity is one sheet of sticker stock cut up; an edge that fades
            is a different material.
Not when    Inside a data table, where rules are 1px and the edge would become a cage.
Breaks next Dark mode: the edge flips to cream. Any hardcoded #1B1626 border disappears.
```

```
Decision    Depth is 4px of solid offset, never a blur.
Because     A blur turns paper into plastic and destroys the press physics.
Not when    A floating overlay above content — there, use a solid scrim.
Breaks next The offset must darken in dark mode (#0B0813), or the card floats on nothing.
```

```
Decision    Six candy colours, each with one job; none of them is body text.
Because     "Colourful" is only a system if the colours are countable and assigned.
Not when    A colour would have to carry meaning alone — pair it with a word or a shape.
Breaks next Adding a seventh world: the palette is full. Reuse a colour or merge a world.
```

```
Decision    The hat is the only variable in the mark.
Because     One character, four outfits. It ties the logo to the level map without
            redrawing the logo.
Not when    Print, favicons, or any single-colour reproduction — then the hat is lime.
Breaks next Tinting the body or the face "just this once" — that is a second mascot.
```

```
Decision    Progress is eight segments, never a smooth bar.
Because     Segments are countable, and countable progress is the point of a game.
Not when    A continuous quantity (file upload, request latency) — those are not scores.
Breaks next 8 segments at 390px: below 220px wide, drop to 5.
```

```
Decision    Focus presses the field into its own shadow.
Because     The field is a physical sticker; pressing is the only feedback that matches.
Not when    Inside a code editor, where the caret already shows focus.
Breaks next Safari's default focus ring on `input[type=file]` — needs the same treatment.
```

## Voice card

```
We are      plain, specific, warm, second person
We are not  hyped, vague, apologetic, jargon-first
Say         "Saved. It is in the arena now."
Don't say   "Awesome! Your query has been successfully saved!"
Say         "No spaces — try ada_w"
Don't say   "Oops! Something went wrong."
```

## The gap

- No animated idle for Wanni or the cast; motion is specified, not built.
- The specimen is a static page. Nothing is wired into the app shell yet.
- The cast has no 16px test, because it never appears that small — but that is a rule,
  not a measurement.
