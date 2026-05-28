---
title: Git Don't Git It Anymore.
date: 2026 05 13
tags:
description: '""'
---

About a week ago I was watching [a certain Theo video](https://www.youtube.com/watch?v=HuE7OvOckfE&t=1058s) about Git and Github. In that, he said: If SVN was gen 1 of source control and Git was gen 2, what would gen 3 look like? Then he started talking about the stuff going over at [Pierre](https://pierre.computer/), and I thought to myself "that's cool, I want to make my own". And that's how I ended up spiraling into making a version control system.

# What is Version Control Software, Really?

I've managed to distill Git into a tracker of 3 things: Who, What and Why. What does this mean though?

## Who

Who refers to the code authors and who should be fired over the bug that brought down the servers at 3AM in the morning. Basically the git authors.

## Why

Whether it's the Jira ticket, Github issue, scribbles on a napkin or whatever else, Why covers the intent. Whether that's "Add feature" or "fix auth", Why assigns purpose to each change.

## What

What did I change? What refers to the actual code changes, whether it's writing files, deleting half the repo or encrypting it as an april fools joke or something. 

Now what's the problem here? Why isn't git enough anymore? Git was released over two decades ago, when internet sucked and linux maintainers worked over email. 

Nowadays we have gigabit internet and wonderful services like github. So why are we still using a tool designed for the dark ages?

# The Problems with Git

Git has many problems. For example, you can scare any developer with two words: 

**Merge Conflict**

When trying to merge branches and you have incompatible code, git flips the table over and tells you good luck have fun. It gives broken files and leaves you to clean up the mess. This is because git tracks text, not code. Git has no idea what "function foo () {}" means. All it knows and cares about is that it's on line 1534 of a monolith index.js file and that there are 2 different version. But in reality, the two versions could've easily been merged together. 

Git doesn't store intent. Or at least not enough. All git stores is a single string called a commit message. That's fine when humans wrote maybe 500 lines of code a day, but now when AI is blasting out thousands of lines of code of questionable standard out, we need more than a sentence. We need to store the conversation between the human and the LLM. Every revision, every disagreement, every argument. Because LLMs are giant guessing machines. Nothing else. 

At 3am when you're debugging an obscure crash, you need all the help you need, which is why the whole LLM thread should be stored. 

Finally, Git doesn't track whodunit very well. When I start writing a function, an agent finishes it, then I change some bits and the agent does some things, git only stores the final result, and I get all the credit. But in reality, the whole exchange should be stored. Every step of the process recorded, and the commit isn't granular enough. We need authorship on a change by change level.

## The fix

Like I said, a good VCS has to handle 3 things: intent, changes, and authorship. 
### Intent
Whether it's a shower thought, a Github issue, some obscure error log or email, a good VCS should store not only a description of the change, eg. "Fix auth", but the entire chain from crash logs to the LLM thread that wrote three quarters of the patch. 