---
title: Simple CSS Masonry Grid
date: 2025 07 04
tags:
  - CSS
  - web
description: 'Quick and easy CSS "masonry" / "waterfall" grid'
---

Simple, CSS only Masonry grid. Just replace the amount of columns and you're done. Use however you want. One issue: The items go down vertically.

```css
/* Container */
div {
	columns: 2;
}
/* Items */
div > * {
	break-inside: avoid;
}

© 2025 Jacob. MIT License
```
