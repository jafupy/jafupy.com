---
title: A journey to search
date: 2025 07 01
tags:
  - Coding
description: h
---

I wanted search for my website for a long while now. Pretty much since the start of the last redesign. 

# Part 1, Coming Soon <sup>TM</sup>

Since (at least) August 2024, I've had a search button in my nav bar that didn't do anything. All it did was open a toast in the bottom right corner saying coming soon or something. I cannot be bothered to dig it up. 

I always thought up an elaborate plan for a CMDK menu with fancy search and what not. Whenever I started, I often got overwhelmed and I gave up, procrastination even longer. 

# Part 2, All about the Vibes

Towards the end of May 2025, I realised I could just get an AI agent to do it for me. Around that time I decided to try out Zed again, because when I tried it a couple months ago it was a lot further in the alphas. 

Before that I was using Cursor, only because I thought the icon was cool, and I wasn' using any of the AI other than Supermaven for completions, which was completely seperate and VS Code fork agnostic. 

So when I opened Zed, I used my free tier allowance to build the initial overcomplicated version of the search, including a custom indexer written in Go, a custom search engine, and an overcomplicated CMD - K menu to house the search. But I had some issues with it not searchinig properly, so I tried fixing the code. Now because this was vibe coded, I had no idea what any of the code did, and I put it into a worse state than it already was. So I scrapped it and decided to write it all by hand.

## Part 2.5, All Serious and no Vibes at All

Around this time I realised I was over engineering this whole indexer / search thing so I rewrote the entire CMD-K from scratch, and I just used Fuse. But I realised I was in over my head.  Or rather I got overwhelmed by the project and just gave up. The thing that broke me here was the lack of any styles. I don't know why but the fact that I hadn't had the thing styled discouraged me from pushing on, despite there not being anything wrong with it.

# Part 3, Ok, Maybe a Little Bit of Vibe

So after being discouraged, I remembered that I didn't have to choose between 100% vibes and no vibes, so I made Zen's agent make a very basic draft, which was styled and had basic functionality, and then I gutted a large part of the search logic and I made my new "search engine," which is fuse classes which then get used by an [astro actions](https://docs.astro.build/en/guides/actions/)

So, this was a very simple solution, but it works great and I can't think of any improvement to make to it, other than a blank / default state for when there isn't a search query yet. 

# Part 4, Updates

It is now a bit over a month later (10 Aug 2025)
