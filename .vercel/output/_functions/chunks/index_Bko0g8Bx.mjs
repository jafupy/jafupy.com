import { c as createComponent } from './astro-component_DWl-m8A3.mjs';
import 'piccolore';
import { x as renderComponent, r as renderTemplate, m as maybeRenderHead, n as addAttribute } from './entrypoint_1wx7snJx.mjs';
import { $ as $$Minimal, a as $$OverscrollTail } from './overscroll-tail_ByBSA0QN.mjs';
import { p as projects } from './index_BogjlJOm.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Root", $$Minimal, { "title": "Projects", "description": "Projects, experiments, and playable things by Jacob." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div data-page-content class="content-bg"> <div> <div class="flex items-center px-7 h-9 border-b border-mauve-100/20"> <span class="font-mono text-xs tracking-widest uppercase text-mauve-400 shrink-0">Projects</span> </div> <div class="grid grid-cols-2"> ${projects.map((project, i) => renderTemplate`<a${addAttribute(project.href, "href")}${addAttribute([
    "grid grid-rows-subgrid row-span-3 px-6 hover:bg-white/2 transition-colors",
    i % 2 === 0 ? "border-r border-mauve-100/20" : ""
  ], "class:list")}> <h3 class="font-serif text-2xl leading-snug pt-5 text-mauve-50">${project.title}</h3> <time class="font-mono text-xs text-mauve-400 mt-1">
Emulator
</time> <p class="text-sm text-mauve-200 leading-relaxed mt-2 pb-5">${project.description}</p> </a>`)} </div> </div> </div> ${renderComponent($$result2, "OverscrollTail", $$OverscrollTail, {})} ` })}`;
}, "/Users/jafu/Documents/Code/jafupy.com/src/pages/projects/index.astro", void 0);

const $$file = "/Users/jafu/Documents/Code/jafupy.com/src/pages/projects/index.astro";
const $$url = "/projects";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
