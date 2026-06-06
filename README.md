# jafupy.com

Source for [jafupy.com](https://jafupy.com), Jacob's personal site.

The site is a place for writing, projects, experiments, and small interactive
pieces. It is built with Astro for routing/content and Svelte for client-side
interactions.

## Quick Start

```sh
bun install
bun run dev
```

Other useful commands:

```sh
bun run check
bun run build
bun run preview
```

## Architecture

Astro handles the site shell, routes, content collections, server output, and
deployment adapter. Svelte is used for interactive components such as the
command palette, telescope text interactions, HUD UI, and emulator pages.

Search is served through Astro Actions in `src/actions/index.ts`. It combines
static navigation entries, project metadata, command palette tags, and writing
content, then ranks matches with Fuse.js.

## Repository Map

- `src/pages/`: route entry points
- `src/layouts/`: shared Astro layouts
- `src/content/blog/`: writing content
- `src/content/cmdk-tags/`: command palette filter metadata
- `src/actions/`: Astro server actions
- `src/lib/cmdk/`: command palette implementation
- `src/lib/telescope/`: expandable text interaction components
- `src/emulator/`: terminal, game, and emulator experiments
- `src/projects/`: project metadata
- `src/styles/`: global CSS and typography

## Writing

Published posts live as Markdown files in `src/content/blog/`.

```md
---
title: Post title
date: 2026-03-26
description: Short summary
---
```

Routes are generated as `/writing/<year>/<slug>/`.

## Deployment

The site is configured for Vercel using `@astrojs/vercel` with server output
and sitemap generation.

## Licensing

Source code is licensed under the MIT License. Written content under
`src/content/blog/**` and human-authored text displayed on pages is copyright
Jacob and all rights reserved. See `LICENSE.md` for details.
