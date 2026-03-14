---
title: My Issues with Vibe Coding
date: 2025 06 09
tags:
  - AI
  - Coding
description: I built a search feature for my website using AI tools in under 30 minutes, but I’m not sure I understand how most of it works. Is the speed worth losing familiarity of your code base?
---

AI promises to let you turn a couple sentences written in natural language, and turn it into functioning code in minutes of not seconds. And while this is true, there is one caveat that I haven't seen mentioned anywhere: a phenomenon I call "The Black box effect."

# Part 1, A Big Black Box

When AI writes code, it often "just works." And modern [[agents]] line in Cursor or Zed, the LLM has access to a terminal and the language server. Agents can compile, lint, run tests, even fix small errors, all without you lifting a finger (other than typing the initial prompt). You describe what you want, the AI writes it, and things light up. It feels like magic.

But you didn’t write that code, the AI did. You probably trusted its output, clicked through the diffs, saw no errors, and merged. After all, the tests passed and your editor gave no red squiggles. This is the Black Box Effect in action. You end up with working code that you neither fully understand nor wrote yourself.

# Part 2, For Example, Not So Many Many Moons Ago

I've been putting off setting up search for my website, probably for too long. So I thought to myself, *why not get AI to write it for me?*

I opened up Zed, which I just switched to, find out more [here](bye-bye-vs-code.md) opened the agent panel, and prompted away.

> Create a CMD K menu for searching my blog posts using the cmdk library and fuzzy search.
>
>Write an indexer too, which I can run separately via command line.

And within seconds, it worked! You can use it right now. Just hit cmd or ctrl and k or press the magnifying glass up in the top right corner.

# Part 3, Mission Accomplished?

So, I have search, but it feels like black magic. I have no experience in Golang, and the JS search function feels impossible to decpher. So, what did I gain out of this? I wanted to learn Go, not make Claude write it for me.

> As of July, I have search fully working, and I wrote up about it [here](journey-to-search.md)

## But Wait, Doesn't This Problem also Exist when Working in a Team?

Yes. And for most professional devs, this won't be a problem. But this is **My** issues with Vibe coding.

Ok Bye bye!
