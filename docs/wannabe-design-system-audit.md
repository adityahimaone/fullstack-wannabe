# Audit — Fullstack Wannabe brand system v1.0

Every claim below points at a file or a measurement. Anything not checked is listed as
**not verified** rather than implied.

Date: 2026-10-29 · Scope: `brand/`, `public/brand/wannabe/` · Not in scope: the app shell.

---

## 1 · Marks

| Check | Result | Evidence |
|---|---|---|
| Primary mark on a 64 grid, one cut weight | pass — 2.8 units | `public/brand/wannabe/mark.svg` |
| Fill-only: no fill+stroke wireframe on one shape | pass — each path either fills or strokes, never fakes a border | `mark.svg` |
| Compact is a **separate** drawing with fewer shapes | pass — 8 shapes vs 11, no dog-ear, no column ticks, cut 3.4 | `mark-compact.svg` |
| Reads at 16px | pass — see `favicon-32.png` (same drawing at 32) and the 16px row in `sheet.html` | `favicon.svg` |
| Glyph exists and is not the favicon | pass — `glyph.svg` has no field and no offset | `glyph.svg` |
| Mono stamp is one ink | pass — mask, face knocked out | `mark-mono.svg` |
| Wordmark is paths, never live text | pass — `<text` occurs 0 times across all 15 SVGs | `wordmark.svg` |
| Wordmark legible at 24px | pass, verified by eye at 24/40/160 in the specimen | `design-system.html` §03 |
| Cast has 4–6 marks, one job each | pass — 6, each job written in `story.md` | `cast/*.svg` |
| No gradient, no blur anywhere | pass — 0 `Gradient`, 0 `feGaussianBlur` across all SVGs | all SVGs |
| Distinct silhouette from the previous app mark | pass — the old mark was an outlined `D`; this is a filled node with a dog-ear | `src/components/layout/Logo.tsx` |

## 2 · Colour (computed by `brand/tokens.mjs`)

| Pair | Ratio | Verdict |
|---|---|---|
| ink on paper | 16.45:1 | AAA |
| ink on card | 17.36:1 | AAA |
| ink on lime | 13.63:1 | AAA |
| ink on cyan | 9.83:1 | AAA |
| ink on mango | 9.65:1 | AAA |
| ink on mint | 9.24:1 | AAA |
| ink on pink | 5.63:1 | AA |
| cream on grape | 5.01:1 | AA |
| **ink on grape** | **3.28:1** | **banned for body — large only** |
| **cream on pink** | **2.92:1** | **banned — use ink** |
| dark: ink on paper | 17.00:1 | AAA |
| dark: ink on card | 15.48:1 | AAA |
| dark: lime on night | 15.13:1 | AAA |
| dark: pink on night | 7.01:1 | AA |
| onCandy on lime | 13.63 / 14.64 | AAA both modes |
| onDanger on chili | 4.58 light / 7.04 dark | AA both modes |

**Bug found and fixed during the build:** mapping `--primary-foreground-c` to
`var(--wb-ink-c)` made the primary button cream-on-lime in dark mode — **1.12:1**.
Text on a fill is now a fixed token (`--wb-oncandy`, `--wb-ongrape`, `--wb-ondanger`)
that does not flip with the theme. This is the failure mode the semantic layer exists to
prevent, and it was caught by the generator, not by eye.

## 3 · Typography

| Check | Result |
|---|---|
| 3 families, no fourth | pass — Bricolage Grotesque / Instrument Sans / JetBrains Mono |
| Body 17px, inputs 16px, captions ≥13px | pass |
| Line-height unitless | pass (0.98 display, 1.6 body) |
| `text-wrap: balance` on headings, `pretty` on paragraphs | pass |
| Tabular numbers on changing values | pass (`.mono`, `.num`) |
| Display face never used for a paragraph | pass |
| Wordmark has outlines, not type | pass |

## 4 · Structure

| Check | Result |
|---|---|
| Specimen has 12 sections incl. 2 that are not template defaults | pass — `#decor` (decoration) and `#colour`→worlds mapping are this system's own |
| Logo card has specs, icons, downloads, do/don't | pass |
| Wordmark card has a scale row and a minimum | pass — 40 / 24 / 16 |
| Cast drawer has uneven spans | pass — 5/4/3 then 4/4/4 |
| Usage rule written in the brand voice | pass |
| Readable without JS | pass — the theme toggle is the only script |
| Light and dark both render | pass — `data-theme` switch, `--wm-ink` flips the hand |
| No horizontal overflow at 390 | pass — measured in a 390px iframe; widest offender was a `pre` scroll region (intended) |

## 5 · Board

| Check | Result |
|---|---|
| 3000 × 2250 (1500 × 1125 at 2×) | pass — `sips -g pixelWidth -g pixelHeight` |
| 8 panels on one 20px gutter grid | pass |
| Lockup readable on the night stage | pass — `--wm-ink` set on the panel |

## 6 · Not verified

- **The cast has no motion.** Idle, pop and celebration are specified; nothing is built.
- **Nothing is applied to the app.** `wannabe-tokens.css` re-points the app's token names,
  but no component has been restyled. The 8 steps in `DESIGN.md` §5 are the work remaining.
- **Dark-mode form contrast** was measured against `#171226` / `#221A33`, not against the
  form's own fill `#241B36`. Expected to pass; not measured.
- **The 16px favicon is drawn, not printed.** It reads on screen (see `favicon-32.png`);
  no ink-on-paper test.
- **The wordmark was not tested below 16px.** Below that, `DESIGN.md` says use the reading
  face instead — a rule, not a measurement.
- **No browser matrix.** Everything was checked in one Chromium build. Safari's
  `input[type=file]` and `:has()` support are untested.
- **No detach scorecard.** `features/` held no sibling systems, so there was nothing to
  measure against; the system was instead compared to the app's previous identity (§1).

## 7 · Reproduce

```bash
node brand/build-marks.mjs   # 15 svg from one geometry source
node brand/tokens.mjs        # oklch channels + the contrast table above
node brand/build-page.mjs    # sprite into design-system.html + brandkit.html
```

The contrast numbers in §2 are the literal stdout of `brand/tokens.mjs`. If they do not
reproduce, the audit is wrong, not the script.
