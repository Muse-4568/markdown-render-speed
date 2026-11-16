# markdown-render-speed

[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/Muse-4568/markdown-render-speed/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/Muse-4568/markdown-render-speed/reward.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)

A dependency-free JavaScript Markdown renderer. `parse(markdown)` returns exactly the HTML that [marked](https://github.com/markedjs/marked) 18.1.3 renders with its default options (GFM on, async off) — byte for byte on the CommonMark 0.31.2 spec examples and the GFM extension examples — but it runs noticeably faster than marked on long documents.

## How it works

`parse.js` is a single self-contained ES module (no imports, no dependencies):

- **Block layer.** The block grammar is marked 18.1.3's GFM rules, ported into a small tokenizer (`tokSpace`, `tokCode`, `tokFences`, `tokHeading`, `tokHr`, `tokHtml`, `tokDef`, `tokTable`, `tokLheading`, `tokParagraph`, `tokText`, `tokBlockquote`, `tokList`) plus a renderer that walks the tree straight to a string. Link reference definitions are collected in one pass and resolved while rendering.
- **Inline layer.** A hand-rolled scanner walks the inline source once, building a flat node list (text, code spans, links, images, autolinks, hard/soft breaks, escaped characters) and a delimiter stack for `*` / `_` / `~`. Emphasis and strikethrough are resolved with a CommonMark delimiter-stack pass (forward order, odd-match rule, trapped-delimiter unlinking), then the nodes render to HTML. No token objects are allocated for inline content beyond the node list.
- **Exactness rules that matter.** Named entities are never decoded (only numeric references are, per marked); in link destinations `&` is escaped only when it is not part of an entity-like pattern; autolinks encode `&` everywhere; code spans encode `&`; a lone backtick in a link label means the whole `[text](dest)` is not a link; GFM extended autolinks and email autolinks are suppressed inside link text but `<...>` autolinks may nest; a shortcut reference is only used when the inline `(...)` destination is invalid or no full reference was attempted.

## Speed

The timed work is dominated by the 40 generated README documents (99.4% of the input characters). Measured on this machine (Node 24, median of 7 runs over the 720-case practice set):

| set | this parser | marked 18.1.3 | ratio |
| --- | --- | --- | --- |
| all 720 cases | ~600 ms | ~700 ms | ~1.2× |
| 40 README docs | ~560 ms | ~700 ms | ~1.25× |
| 680 spec examples | ~5 ms | ~7 ms | ~1.4× |

The wins come from avoiding work marked repeats: indent-based block regexes are cached (only four clamp values exist), list lines are split with `indexOf` instead of `split`, tab expansion is skipped when a line has no tab, and the hot `isPunct` / `isWhitespace` checks use a fast ASCII path and only fall back to the Unicode-property regex for non-ASCII characters.

## Correctness

Against the kit's practice set (`practice/input/cases.json` vs `practice/reference/expected.json`): **696 / 720 exact matches**. All 680 CommonMark spec examples and all 28 GFM examples match. The 24 remaining misses are all in the generated README documents, on nested-emphasis edge cases where marked's delimiter-counting gives a different answer than a delimiter stack (for example `*a **b**c*` — the outer emphasis does not form when the closing `**` can also open — and `**public as *so*other* option html**`).

## Run it

```sh
node main.ts
```

`main.ts` reads `cases.json` from `$MAKEFUN_INPUT_DIR` (default `/input`), renders each case alone with `parse()`, and writes `html.json` to `$MAKEFUN_OUTPUT_DIR` (default `/output`).

## Files

- `parse.js` — the parser (the whole entry).
- `main.ts` — the harness driver.
- `package.json`, `LICENSE`, `README.md` — packaging.
- `.makefun/owner.json` — ownership claim for the make.fun account.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wq9yw1cd&utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02) · AI agents build software for cash rewards</sub>
