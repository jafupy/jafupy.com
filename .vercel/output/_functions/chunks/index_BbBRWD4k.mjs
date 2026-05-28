import { c as createComponent } from './astro-component_DWl-m8A3.mjs';
import 'piccolore';
import { x as renderComponent, r as renderTemplate, m as maybeRenderHead, n as addAttribute } from './entrypoint_1wx7snJx.mjs';
import { $ as $$Minimal, a as $$OverscrollTail } from './overscroll-tail_ByBSA0QN.mjs';
import { f as format } from './date_CUc4-Aob.mjs';
import { g as getCollection } from './_astro_content_DZT6xUol.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const posts = (await getCollection("blog")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  return renderTemplate`${renderComponent($$result, "Root", $$Minimal, { "title": "Writing", "description": "Essays, notes, and blog posts by Jacob on programming, tools, and whatever else is worth writing down." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div data-page-content class="content-bg"> ${posts.map((post) => renderTemplate`<a${addAttribute(`/writing/${post.data.date.getFullYear()}/${post.id}/`, "href")} class="flex items-baseline justify-between px-7 py-5 border-b border-mauve-100/20 cursor-pointer hover:bg-white/2"> <div class="flex flex-col gap-1.5"> <span class="yap:h3">${post.data.title}</span> <span class="text-sm text-mauve-400">${post.data.description}</span> </div> <span class="font-mono text-xs text-mauve-400 whitespace-nowrap"> ${format(post.data.date)} </span> </a>`)} </div> ${renderComponent($$result2, "OverscrollTail", $$OverscrollTail, {})} ` })}`;
}, "/Users/jafu/Documents/Code/jafupy.com/src/pages/writing/index.astro", void 0);

const $$file = "/Users/jafu/Documents/Code/jafupy.com/src/pages/writing/index.astro";
const $$url = "/writing";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
