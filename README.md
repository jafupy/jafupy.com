# jafupy.com

Personal site built with Astro and Svelte.

## Stack

- Astro 6
- Svelte 5 islands
- Tailwind CSS 4
- Astro content collections for writing
- Astro Actions + Fuse.js for search
- Vercel adapter for deployment

## Site Structure

- `src/pages/index.astro`: homepage
- `src/pages/about.astro`: about page
- `src/pages/writing/index.astro`: writing index
- `src/pages/writing/[year]/[slug].astro`: individual posts
- `src/layouts/minimal.astro`: shared layout, nav, wordmark, command palette host
- `src/actions/index.ts`: search/filter actions
- `src/content/blog`: published writing
- `src/content/cmdk-tags`: command palette filter metadata

## Development

Install dependencies:

```sh
bun install
```

Start the dev server:

```sh
bun run dev
```

Build for production:

```sh
bun run build
```

Preview the production build locally:

```sh
bun run preview
```

## Content

Published posts live in `src/content/blog` and use frontmatter with:

```md
---
title: Post title
date: 2026-03-26
description: Short summary
---
```

Routes are generated as `/writing/<year>/<slug>/`.

## Search

The command palette is mounted from the root layout and powered by:

- static page/social/action entries
- writing content from the blog collection
- filters from `src/content/cmdk-tags`

Server-side search lives in `src/actions/index.ts`.

## Deployment

The project is configured for Vercel via `@astrojs/vercel`.
