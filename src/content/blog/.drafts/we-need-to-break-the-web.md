---
title: We Need to Break the Web
date: 2026 06 01
tags:
description: '""'
---

Thirty years ago, JavaScript landed in the browser and the web stopped being a document viewer. Suddenly static pages could think, react, remember. A language built in 7 days is now doing work that used to require "real" native apps, often written in God's programming language, C.

But over the last 30 years, JS has gotten increasingly bloated. Its founding philosophy, never break old websites, means that new features, or even fixes to past mistakes, have to contort themselves around everything that came before, which leads to abominations such as `===`, and a thousand other footnotes every developer has to memorise just to avoid the landmines.

The result is a web that works remarkably well. But what we've really built is this:

<img class="max-h-80" src="https://imgs.xkcd.com/comics/dependency.png" alt="XKCD Dependencies Comic">

Modern JavaScript is millions of APIs that all flood the global scope. What's worse is that many of them are deprecated, yet still fully supported — which means they pollute every script for no good reason.

And the only way to "fix" this mess is to keep adding to the endless tower, which only makes the problem worse. JavaScript, and the web as a whole, is stuck in a perpetuating cycle of purgatory: add bloat, mark old bloat as deprecated, repeat. "Deprecated" is supposed to mean something, but really it's just an empty threat.

And the only way to break the cycle is to break the web.

# The Solution

We need to break the web. We need to free modern JS of the past. Unchain it so it can fly. 

So I propose a new standard: Web 2030. On the first of January, 2030, I propose that all old, "legacy" HTML, CSS and JS stop working by default. However, I think you should still be able to access the web through a versioning switch. How?

```html
<html web="legacy">
<html web="2030">
```

By adding a versioning system to our websites, we can sometimes purge the web. This shouldn't be too often, maybe only twice a decade, but it allows for a better, simpler world wide web. 

And by scheduling the break for 2030, we give frameworks and companies four years to transition, or simply add the legacy tag. 
