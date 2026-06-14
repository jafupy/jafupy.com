---
title: I need a CMS
date: 2026 01 03
description: "I need a CMS, but I don't like the current options. So I'm creating my own: Crawlspace."
---

I need a CMS, but Ghost, Contentful, Strapi, etc. just don't do what I want. 

My website — this website — is built with Astro, a couple Svelte sprinkles and some vanilla JS. Like any sane person, I use Astro's content collections for my blog, with my `content/blog` folder symlinked to my Obsidian vault, where I write in a pretty GUI with pretty formatting. This works, obviously, but I want more. I need more. I need a CMS. But then I can't use my content collections. I want content collections. 

Content collections allow me to have type-safe markdown and other content, and I like that. But I also want to be able to edit from anywhere, and since I'm going through a rewrite of my site, it's annoying to have to manually commit via [github.com](https://github.com). 

So, I should just use a CMS, right? Yes, but no. While a CMS would solve the edit anywhere and the Github problem, I don't want to abandon my content collections. Could I write a custom wrapper for sanity that works with content collections? Maybe.. But I want to own my data. I want it in my project, and not in a database god knows where.

I also don't want to use some weird proprietary text format. I want markdown and JSON. Simple open standards and not some convoluted container to which I will have to reverse engineer the extraction method. 

So I'm building my own CMS. 


## Meet Crawlspace


Meet Crawlspace, a *different* kind of CMS. No more databases, no more random websites to visit, just a route you add to your website and just *works.* No setup, other than whitelisting your github account and running an npx command.

With Crawlspace, you have one source of truth — your schema. No more GUI configs, no more copying over settings, no more making sure they're perfect reflections in the mirror. When you change your config, Crawlspace adapts. That's the magic of what I'm building. 

Since it uses the content folder as the "database," in dev you don't want to have to dance with Github, having to fetch after every change. So Crawlspace uses the filesystem to edit your content directly. In production, it does the dance. After you push, assuming Vercel / GH pages / whatever is correctly set up and connected to the Github repo, the changes automatically trigger a rebuild, allowing you to write, edit, and forget. The changes automatically propagate and it's like magic.

So, for example, let's take the following schema:

```ts
const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
  }),
});
```

Crawlspace sees the `.md` pattern, and detects that this is markdown. This enables the rich text editor. Then it looks at the schema, to figure out the frontmatter. This auto-generated config then gets cached, and as long as the schema stays the same, it won't regenerate. Alternatively, you can manually recalculate within the GUI. 

When you're editing your content, any changes get auto-saved to local storage, and then when you hit publish, a commit will get generated and pushed to the Github repo, using your Github account. 

How does it get your Github account? Simple: you sign in via Github's OAuth. This allows for easy authentication & permission management. Anyone who has write access to repo can edit. In dev there is no auth, since if you're running it locally you obviously have read/write permissions.

## The Stack

I'm going to use Svelte. I love svelte. It's pretty. I could use react, but then I get re-render anxiety. Svelte also has the benefit of not having the overhead of the VDOM. I plan on using TipTap for the editor, and I'll in-house basically everything else, other than the Github SDK and FS. I'll be using Shadcn-svelte, but heavily modified. I really like the aesthetic of [Zed](https://zed.dev), with it's sharp corners and brutalist aesthetic. For the colours, I'm leaning towards a greenish grey and orange.  

I haven't started working on Crawlspace, so either @ me on twitter (@jafupy) or email me if you have ideas, want to help or just want to pester me. I'll *probably* reply. It's that big contact button if you move your eyes up a bit. 

## The Roadmap

I expect the first version to be out by the end of January, and V1 by summer. Why so long? I don't vibe code. I also have my GCSEs coming up in June, so I need to prioritise that over coding. As i'm writing Crawlspace, I'm going to prioritise figuring out the frontmatter & JSON first, using an interim plaintext editor. I will also have manual schemas for a while, since the detection will most likely be complicated and will take a while to reverse engineer. This is the full roadmap & plan of how I'm going to build it:

### V0.1

The MVP. The first beta.

- FS / dev mode only
- no auth
- plain text editor
- no schema detection

### V0.2

- Schema detection

### V0.3

- Rich text markdown editor with inline previews

### V0.4

- Auth

### V0.5

- Github integration

### V0.6

- CLI 

### 1.0

- Making it pretty
- Polish (no not the country)

### What I'm **NOT** Adding

- i18n. I'm not adding different language support. Why? I'm lazy and selfish. 
- Collaboration. I have no friends, so I don't need it.
- Undoing & rollback. If you're indecisive, you're going to have to dance with GIthub.

This isn't a solution for massive corporate websites. It's designed for small, indie blogs and digital gardens, and designed around what *I* need. Is this selfish? Maybe. But I don't care. Fork it or submit a pull request if you don't like it. Crawlspace is an abstraction over Github, FS and content collections, not a tool designed to be the engine of sites with PR teams larger than some small countries. 

Thank you.
