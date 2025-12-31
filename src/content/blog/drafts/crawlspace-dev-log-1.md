---
title: "Crawlspace Dev log #1: Plans"
date: 2025 08 10
tags:
  - Coding
  - web
  - Crawlspace
description: Todo
---

Crawlspace is (going to be) an integration for the web framework [Astro](https://astro.build) that provides an editor layer for managing content collections. Think of it as a lightweight CMS built specifically to fit Astro projects.

# So, how Will It Work?

Crawlspace will inject a React-based single-page app into a configurable route (defaulting to /admin/\*). This SPA creates an interface for editing markdown and JSON content, with support for more formats planned down the line.

It’s designed to work both in development and production environments:

- In development, content changes are saved directly to the local file system.
- In production, changes are committed to the GitHub repository.

Authentication is handled through GitHub OAuth, with a configurable whitelist to control who can access the editor.

When editing content, changes are automatically saved into commits, but those commits aren’t pushed immediately. Instead, multiple commits can remain open—similar to forking and merging branches—and you manually push changes through the UI when ready. 

## Tech Stack

**Front End**
- TipTap for markdown
- ShadCN for UI
- React for general front end

**Back End**
- Content Collections as DB
