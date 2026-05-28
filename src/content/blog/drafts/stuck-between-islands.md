---
title: Stuck Between Islands
date: 2026 03 22
description: "Why a half-static, half-island Astro redesign fell apart when I tried to make the nav and command palette work together."
---

My website is built with Astro and Svelte. It's a (mostly) static site. I can count on my fingers how many lines of code of JS I have, and there's even less Svelte. 

A couple months ago I was working on a (now abandoned) redesign of my website and I ran into a problem: The svelte islands are isolated. My top nav was a svelte component that opened a drawer. All well and good. But then I wanted my CMD-K to live as a sub drawer, inspired by iOS. There was no way for me to pass markup and components across islands. The CMDK would have to live in the nav and be nested within the drawer for the sub drawer concept to work. But for accessibility, the CMD-k should be in the root of the body. 

In hindsight this could've been probably solved with portals, but I didn't think of that at the time. 

When not on mobile, I didn't want to ship my nav as a svelte component, as it could've just been a static div with a couple \<a> tags. That means I had to have my nav duplicated — one static version and one svelte. Then that meant my CMDK would be in two places, and with two separate designs. While the design is expected, the two places felt really icky at the time. As a result I gave up and lost the will to finish the redesign. 

So to recap 
