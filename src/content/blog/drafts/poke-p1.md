---
title: Making a Framework
date: 2025 10 24
tags:
description:
---

I'm building a web framework. Not because the world needs it – there are plenty already – but because I want something new. Something simpler. Something that meant for just *poking* the page in the right direction, rather than manipulating the entire DOM like a puppet master.

I'm calling it Poke.

Poke should be minimal. It should extend native document.createElement calls, while extending functionality with reactivity and syntax sugar. 

This brings us to the first question: How do we write our components and logic? Custom `.poke` files? JSX? Pure JS? and the answer is JSX. A custom language requires a parser, compiler, etc, and Poke is meant to be minimal. It is also meant to resemble vanilla HTML & / JS as closely as closely as possible, so some weird esoteric functional system in pure JS is also out, leaving us with JSX. But JSX isn't magic, it's just a wrapper for functions. 

```jsx
<div>Hi</div>
```

this is really just 

```js
jsx("div", {
  children: [
    "Hi"
  ]
})
```

in disguise. So, what does JSX() return? It returns a `PokableNode` – a superset of the normal HTMLElement, that lets you not only manipulate the DOM like in vanilla JS, but also allows for signals to be automatically attached, so you don't have to manually update state and dynamic variables.

This brings us to out next topic:

# Reactivity

Poke handles state in a very similar way to Svelte 5's runes, except not quite as magical. To create a dynamic value, you wrap your initial value with state(). And then whenever you need to get the value or update, you use the `.val` property, or .peek() if you don't want to subscribe to it.

```jsx
const count = state(0)

function increment() {
	count.val++
}

effect(()=>{
	console.log(count.val) // reruns whenever count is changed
	console.log(count.peek()) // only runs once.
})

<div dataCount={count}>{count}</div>
```

It's very similar to Svelte's rune system, but with .val instead of using the variable directly. However within your JSX markup, you just use the variable itself, and Poke will unwrap and attach it automatically.

More about state will be in a future post, where I go over the implementation of state and reactivity.

Ok, so we have syntax and state. What's next? 

## Components

As <div> just becomes a `PokableNode`, a component can be a class with a `.render(props)` function, a function, or just a variable, passed in {braces}.

```jsx
class Component extends Poke.Component {
	render(props) {
		return <div>Hii</div>
	}
}
<Component />

function Component (props) {
	return <div>Hii</div>
}
<Component />

const Component = <div>Hii</div>

{Component}
```

`Poke.Component` w
