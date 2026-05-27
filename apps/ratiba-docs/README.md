# Ratiba Docs

Public documentation site for Ratiba, built with [fumadocs](https://fumadocs.dev) on Next.js 16.

## Local dev

```bash
bun install
bun --filter ratiba-docs dev
```

Then open http://localhost:3010.

Content lives in `content/docs/**/*.mdx`. Each folder may contain a `meta.json` to control ordering and grouping.

## Adding a page

1. Create a new MDX file inside `content/docs/` (or a subfolder).
2. Add it to the parent folder's `meta.json` `pages` array if you want a specific position.
3. The dev server will hot-reload the page tree.

## Structure

- `src/app/(home)` — marketing/landing page for the docs site
- `src/app/docs/[[...slug]]` — the docs renderer
- `src/lib/source.ts` — fumadocs loader pointing at `content/docs`
- `content/docs/` — all MDX content
