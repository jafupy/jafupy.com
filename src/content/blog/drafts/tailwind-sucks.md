---
title: Tailwind Kinda Sucks, Actually...
date: 2025 08 19
tags:
  - Coding
  - CSS
description: hi
---

# Part 1, Whats Tailwind?

Tailwind is a CSS solution that uses atomic classes, that typically only define one property. So instead of having one large class, you would have a bunch of small classes.

## So, for Example

### Not Tailwind

```html
<div class="card">...</div>
```

```css
.card {
	padding: 1rem;
	margin-top: 0.5rem;
	background: #f3f3fa;
	...
}
```

### Tailwind

```html
<div class="my-2 rounded-md bg-slate-200 p-4 shadow">...</div>
```

```css
.my-2 {
  margin-block: calc(var(--spacing) * 2);
}
.rounded-md {
  border-radius: var(--radius-md);
}
.bg-slate-200 {
  background-color: var(--color-slate-200);
}
.p-4 {
  padding: calc(var(--spacing) * 4);
}
.shadow {
  --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}

```

# Part 2, The Good

Before I complain, I want to give Tailwind a couple compliments.

## #1, Convenient

When writing my content, its really easy to build my markup. I don't have to think about class names, or change contexts. 

## #2, Predefined Styles

Tailwind comes with predefined units, preventing accidental style inconsistencies.

For example, when defining, padding, tailwind makes me use 4px increments, creating one unified style guide. Tailwind also has a pretty colour palette, although I made my own blue and grey. 

But tailwind doesn't force me to paint within the lines, I can choose to leave, using \[brackets.]

## #3, Popular

Tailwind is very popular, and used by many styled component libraries such as ShadCN/UI. Tailwind is also used by vibe coders, such as Vercel's V0.

# Part 3, the not so Good

## #1, Bloat

### \#1a, So Many Classes

Take a class such as `grid`. 

```css
.grid {
display: grid;
}
```

As you can see, what would've just been `display: grid` in vanilla CSS, Tailwind doubles the size, writing `.grid {display:grid;}`. Not only is the class name doubled, but you also have to account for the {braces}.
