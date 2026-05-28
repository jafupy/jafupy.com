import { c as createComponent } from './astro-component_DWl-m8A3.mjs';
import 'piccolore';
import { v as renderHead, w as renderSlot, r as renderTemplate, x as renderComponent } from './entrypoint_1wx7snJx.mjs';
import 'clsx';
/* empty css                 */

const $$Emulator = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Emulator;
  const { title } = Astro2.props;
  const pageTitle = `${title} | Jafu.py`;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${pageTitle}</title><meta name="theme-color" content="#14121a"><link rel="icon" href="/favicon.png">${renderHead()}</head> <body class="bg-mauve-900 text-mauve-200 m-0 overflow-hidden h-dvh w-dvw grid place-items-center"> <main class="fixed inset-0"> ${renderSlot($$result, $$slots["default"])} </main> </body></html>`;
}, "/Users/jafu/Documents/Code/jafupy.com/src/layouts/emulator.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Root", $$Emulator, { "title": "Emulator" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Emulator", null, { "client:only": "svelte", "client:component-hydration": "only", "client:component-path": "$/emulator/component.svelte", "client:component-export": "default" })} ` })}`;
}, "/Users/jafu/Documents/Code/jafupy.com/src/pages/emulator/index.astro", void 0);

const $$file = "/Users/jafu/Documents/Code/jafupy.com/src/pages/emulator/index.astro";
const $$url = "/emulator";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
