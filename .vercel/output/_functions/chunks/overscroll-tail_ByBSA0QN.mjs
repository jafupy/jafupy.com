import { c as createComponent } from './astro-component_DWl-m8A3.mjs';
import 'piccolore';
import { O as attributes, D as clsx, P as ensure_array_like, Q as element, y as spread_props, C as attr_class, r as renderTemplate, x as renderComponent, w as renderSlot, v as renderHead, u as unescapeHTML, n as addAttribute, m as maybeRenderHead } from './entrypoint_1wx7snJx.mjs';
import { r as renderScript } from './script_BDXpcpMp.mjs';
/* empty css                 */
import 'clsx';

/**
 * @license @lucide/svelte v0.577.0 - ISC
 *
 * ISC License
 * 
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2026.
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 * ---
 * 
 * The MIT License (MIT) (for portions derived from Feather)
 * 
 * Copyright (c) 2013-2026 Cole Bemis
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */
const defaultAttributes = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
};

/**
 * @license @lucide/svelte v0.577.0 - ISC
 *
 * ISC License
 * 
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2026.
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 * ---
 * 
 * The MIT License (MIT) (for portions derived from Feather)
 * 
 * Copyright (c) 2013-2026 Cole Bemis
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */
/**
 * Check if a component has an accessibility prop
 *
 * @param {object} props
 * @returns {boolean} Whether the component has an accessibility prop
 */
const hasA11yProp = (props) => {
    for (const prop in props) {
        if (prop.startsWith('aria-') || prop === 'role' || prop === 'title') {
            return true;
        }
    }
    return false;
};

function Icon($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const {
			name,
			color = 'currentColor',
			size = 24,
			strokeWidth = 2,
			absoluteStrokeWidth = false,
			iconNode = [],
			children,
			$$slots,
			$$events,
			...props
		} = $$props;

		$$renderer.push(`<svg${attributes(
			{
				...defaultAttributes,
				...!children && !hasA11yProp(props) && { 'aria-hidden': 'true' },
				...props,
				width: size,
				height: size,
				stroke: color,
				'stroke-width': absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
				class: clsx(['lucide-icon lucide', name && `lucide-${name}`, props.class])
			},
			void 0,
			void 0,
			void 0,
			3
		)}><!--[-->`);

		const each_array = ensure_array_like(iconNode);

		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let [tag, attrs] = each_array[$$index];

			element($$renderer, tag, () => {
				$$renderer.push(`${attributes({ ...attrs }, void 0, void 0, void 0, 3)}`);
			});
		}

		$$renderer.push(`<!--]-->`);
		children?.($$renderer);
		$$renderer.push(`<!----></svg>`);
	});
}

function Command($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		 * @license @lucide/svelte v0.577.0 - ISC
		 *
		 * ISC License
		 *
		 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2026.
		 *
		 * Permission to use, copy, modify, and/or distribute this software for any
		 * purpose with or without fee is hereby granted, provided that the above
		 * copyright notice and this permission notice appear in all copies.
		 *
		 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
		 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
		 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
		 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
		 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
		 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
		 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
		 *
		 * ---
		 *
		 * The MIT License (MIT) (for portions derived from Feather)
		 *
		 * Copyright (c) 2013-2026 Cole Bemis
		 *
		 * Permission is hereby granted, free of charge, to any person obtaining a copy
		 * of this software and associated documentation files (the "Software"), to deal
		 * in the Software without restriction, including without limitation the rights
		 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		 * copies of the Software, and to permit persons to whom the Software is
		 * furnished to do so, subject to the following conditions:
		 *
		 * The above copyright notice and this permission notice shall be included in all
		 * copies or substantial portions of the Software.
		 *
		 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		 * SOFTWARE.
		 *
		 */
		let { $$slots, $$events, ...props } = $$props;

		const iconNode = [
			[
				"path",
				{
					"d": "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"
				}
			]
		];

		Icon($$renderer, spread_props([
			{ name: 'command' },
			/**
			 * @component @name Command
			 * @description Lucide SVG icon component, renders SVG Element with children.
			 *
			 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgNnYxMmEzIDMgMCAxIDAgMy0zSDZhMyAzIDAgMSAwIDMgM1Y2YTMgMyAwIDEgMC0zIDNoMTJhMyAzIDAgMSAwLTMtMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/command
			 * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			 *
			 * @param {Object} props - Lucide icons props and any valid SVG attribute
			 * @returns {FunctionalComponent} Svelte component
			 *
			 */
			props,

			{
				iconNode,
				children: ($$renderer) => {
					props.children?.($$renderer);
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			}
		]));
	});
}

function External_link($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		 * @license @lucide/svelte v0.577.0 - ISC
		 *
		 * ISC License
		 *
		 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2026.
		 *
		 * Permission to use, copy, modify, and/or distribute this software for any
		 * purpose with or without fee is hereby granted, provided that the above
		 * copyright notice and this permission notice appear in all copies.
		 *
		 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
		 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
		 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
		 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
		 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
		 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
		 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
		 *
		 * ---
		 *
		 * The MIT License (MIT) (for portions derived from Feather)
		 *
		 * Copyright (c) 2013-2026 Cole Bemis
		 *
		 * Permission is hereby granted, free of charge, to any person obtaining a copy
		 * of this software and associated documentation files (the "Software"), to deal
		 * in the Software without restriction, including without limitation the rights
		 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		 * copies of the Software, and to permit persons to whom the Software is
		 * furnished to do so, subject to the following conditions:
		 *
		 * The above copyright notice and this permission notice shall be included in all
		 * copies or substantial portions of the Software.
		 *
		 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		 * SOFTWARE.
		 *
		 */
		let { $$slots, $$events, ...props } = $$props;

		const iconNode = [
			["path", { "d": "M15 3h6v6" }],
			["path", { "d": "M10 14 21 3" }],
			[
				"path",
				{
					"d": "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
				}
			]
		];

		Icon($$renderer, spread_props([
			{ name: 'external-link' },
			/**
			 * @component @name ExternalLink
			 * @description Lucide SVG icon component, renders SVG Element with children.
			 *
			 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgM2g2djYiIC8+CiAgPHBhdGggZD0iTTEwIDE0IDIxIDMiIC8+CiAgPHBhdGggZD0iTTE4IDEzdjZhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJWOGEyIDIgMCAwIDEgMi0yaDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/external-link
			 * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
			 *
			 * @param {Object} props - Lucide icons props and any valid SVG attribute
			 * @returns {FunctionalComponent} Svelte component
			 *
			 */
			props,

			{
				iconNode,
				children: ($$renderer) => {
					props.children?.($$renderer);
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			}
		]));
	});
}

function Divider($$renderer, $$props) {
	const { class: className = "" } = $$props;

	$$renderer.push(`<span${attr_class(`size-1 shrink-0 rounded-full bg-mauve-300 ${className}`)} aria-hidden="true"></span>`);
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Minimal = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Minimal;
  const {
    title,
    description,
    ogType,
    publishedTime,
    modifiedTime,
    socialImage: socialImageProp
  } = {
    title: "Jafu.py",
    description: "Personal site of Jacob: writing, software projects, experiments, and notes from southern England.",
    ogType: "website",
    ...Astro2.props
  };
  const site = Astro2.site ?? new URL("https://jafupy.com");
  const canonical = new URL(Astro2.url.pathname, site);
  const socialImage = socialImageProp ? new URL(socialImageProp, site) : new URL("/ogp.png", site);
  const pageTitle = title === "Jafu.py" ? title : `${title} | Jafu.py`;
  const jsonLd = ogType === "article" ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: canonical.toString(),
    image: socialImage.toString(),
    datePublished: publishedTime,
    dateModified: modifiedTime ?? publishedTime,
    author: {
      "@type": "Person",
      name: "Jacob",
      url: site.toString()
    },
    publisher: {
      "@type": "Person",
      name: "Jacob",
      url: site.toString()
    }
  } : {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Jafu.py",
    url: site.toString(),
    description,
    author: {
      "@type": "Person",
      name: "Jacob",
      url: site.toString()
    }
  };
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><title>', '</title><meta name="description"', '><meta name="robots" content="index,follow"><meta name="author" content="Jacob"><meta name="theme-color" content="#14121a"><link rel="canonical"', '><link rel="icon" href="/favicon.png"><meta property="og:site_name" content="Jafu.py"><meta property="og:type"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:url"', '><meta property="og:image"', '><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><meta name="twitter:creator" content="@jafupy">', "", '<script type="application/ld+json">', "<\/script>", '</head> <body class="bg-mauve-900 text-mauve-200 p-8 pb-0 relative min-h-screen"> <header class="fixed top-6 left-1/2 -translate-x-1/2 z-50000 flex"> <nav class="flex w-fit gap-4 px-4 pr-2 py-2 rounded-xl border border-mauve-100/20 backdrop-blur-md transition-colors bg-mauve-800/20 text-sm items-center justify-center"> <div id="nav_default" class="nav-default flex items-center gap-4"> <a href="/" class="group flex items-center justify-center gap-1.5 hover:text-old-rose transition-colors">\nJafu.py\n<span class="sr-only">Home</span> </a> ', ' <a href="/writing" class="hover:text-old-rose transition-colors">Writing</a> <a href="/projects" class="hover:text-old-rose transition-colors">Projects</a> <a href="mailto:hello@jafupy.com" class="group relative hover:text-old-rose transition-colors flex items-center justify-center gap-2">Contact\n', ` <span id="contact_tooltip" class="invisible select-text pointer-events-auto not-group-hover:delay-200 overflow-visible group-hover:visible absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-mauve-900 text-sm px-4 py-1.5 rounded-lg border border-mauve-100/10 whitespace-nowrap before:content-[''] before:absolute before:bottom-full before:translate-y-1/2 before:-z-2 before:left-1/2 before:-translate-x-1/2 before:border-l before:border-t before:border-mauve-100/10 before:bg-mauve-900 before:rounded-tl-xs before:size-2 before:rotate-45">
hello@jafupy.com
</span> </a> `, ' <button id="cmdk_trigger" type="button" class="flex items-center gap-1 text-xs p-1 px-3 rounded-md border border-mauve-100/20 bg-mauve-800 transition-colors hover:bg-mauve-900 hover:border-mauve-100/20"> ', ' <span class="transition-colors">K</span> </button> </div> </nav> </header> <h1 id="wordmark" class="font-serif text-mauve-50 fixed left-1/2 -translate-x-1/2 -translate-y-3/5 leading-none -z-1 font-semibold max-w-[max(calc(100vw-16rem),80vw)] w-full text-center"> ', ' </h1> <div id="fade" class="fixed inset-0 -z-1 bg-[radial-gradient(transparent_25%,var(--color-mauve-900)_25%)] bg-size-[4px_4px]"></div> <div id="content" class="max-w-ch-md mx-auto p-0"> ', " </div> ", " ", " ", " ", "</body></html>"])), pageTitle, addAttribute(description, "content"), addAttribute(canonical.toString(), "href"), addAttribute(ogType, "content"), addAttribute(pageTitle, "content"), addAttribute(description, "content"), addAttribute(canonical.toString(), "content"), addAttribute(socialImage.toString(), "content"), addAttribute(pageTitle, "content"), addAttribute(description, "content"), addAttribute(socialImage.toString(), "content"), publishedTime && renderTemplate`<meta property="article:published_time"${addAttribute(publishedTime, "content")}>`, modifiedTime && renderTemplate`<meta property="article:modified_time"${addAttribute(modifiedTime, "content")}>`, unescapeHTML(JSON.stringify(jsonLd)), renderHead(), renderComponent($$result, "Divider", Divider, { "class": "not-sm:hidden" }), renderComponent($$result, "ExternalLinkIcon", External_link, { "class": "size-3.75 not-sm:hidden" }), renderComponent($$result, "Divider", Divider, { "class": "not-sm:hidden" }), renderComponent($$result, "CommandIcon", Command, { "class": "size-3 transition-colors" }), title, renderSlot($$result, $$slots["default"]), renderComponent($$result, "dither-shader", "dither-shader", { "halftone": "100", "color": "#cb8b8c68", "brightness": "-0.5", "mode": "noise", "dot-size": "3", "rotation": "32", "jitter": "0.8", "warp": "50", "blue-noise": "0.45", "animate": "false", "class": "fixed! opacity-70" }), renderComponent($$result, "Cmdk", null, { "client:only": "svelte", "client:component-hydration": "only", "client:component-path": "$/lib/cmdk/component.svelte", "client:component-export": "default" }), renderComponent($$result, "Hud", null, { "client:only": "svelte", "client:component-hydration": "only", "client:component-path": "$/lib/hud/hud.svelte", "client:component-export": "default" }), renderScript($$result, "/Users/jafu/Documents/Code/jafupy.com/src/layouts/minimal.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/jafu/Documents/Code/jafupy.com/src/layouts/minimal.astro", void 0);

const $$OverscrollTail = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="content-bg h-8 rounded-none border-t-0" aria-hidden="true"></div>`;
}, "/Users/jafu/Documents/Code/jafupy.com/src/lib/overscroll-tail.astro", void 0);

export { $$Minimal as $, Divider as D, Icon as I, $$OverscrollTail as a };
