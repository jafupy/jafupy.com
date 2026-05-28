import { c as createComponent } from './astro-component_DWl-m8A3.mjs';
import 'piccolore';
import { v as renderHead, r as renderTemplate } from './entrypoint_1wx7snJx.mjs';
import 'clsx';
import { r as renderScript } from './script_BDXpcpMp.mjs';

const $$Words = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en" data-astro-cid-s2acqxyq> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Syllabary</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">${renderHead()}</head> <body data-astro-cid-s2acqxyq> <header data-astro-cid-s2acqxyq> <h1 class="wordmark" data-astro-cid-s2acqxyq>Syl<span data-astro-cid-s2acqxyq>·</span>la<span data-astro-cid-s2acqxyq>·</span>ba<span data-astro-cid-s2acqxyq>·</span>ry</h1> <p class="tagline" data-astro-cid-s2acqxyq>phoneme word generator</p> <span class="version" data-astro-cid-s2acqxyq>v2.0</span> </header> <main data-astro-cid-s2acqxyq> <!-- ── Left panel ── --> <aside class="panel" data-astro-cid-s2acqxyq> <div data-astro-cid-s2acqxyq> <div class="section-label" data-astro-cid-s2acqxyq>Subpatterns</div> <div class="subpatterns" id="subpatternsContainer" data-astro-cid-s2acqxyq> <!-- rows injected by JS --> </div> <button class="add-sp" id="addSpBtn" style="margin-top:0.6rem" data-astro-cid-s2acqxyq>+ add subpattern</button> </div> <div data-astro-cid-s2acqxyq> <div class="section-label" data-astro-cid-s2acqxyq>Pattern</div> <div class="pattern-wrap" data-astro-cid-s2acqxyq> <input type="text" class="pattern-input" id="patternInput" value="CV(CV)(N)" spellcheck="false" autocomplete="off" data-astro-cid-s2acqxyq> </div> <p class="pattern-hint" data-astro-cid-s2acqxyq>
Uppercase letters reference subpatterns. <code data-astro-cid-s2acqxyq>(X)</code> = optional (50%). Lowercase = literal.<br data-astro-cid-s2acqxyq>
e.g. <code data-astro-cid-s2acqxyq>CV(CV)</code> → consonant-vowel syllable, optional second syllable.
</p> <div class="error-msg" id="errorMsg" data-astro-cid-s2acqxyq></div> </div> <div data-astro-cid-s2acqxyq> <div class="section-label" data-astro-cid-s2acqxyq>Options</div> <div class="options" data-astro-cid-s2acqxyq> <div class="option-row word-count-wrap" data-astro-cid-s2acqxyq> <label class="opt-label" for="wordCount" data-astro-cid-s2acqxyq>words to generate</label> <input type="number" class="word-count-input" id="wordCount" value="100" min="1" max="9999" data-astro-cid-s2acqxyq> </div> <label class="checkbox-wrap" data-astro-cid-s2acqxyq> <input type="checkbox" id="filterDuplicates" checked data-astro-cid-s2acqxyq> <span class="opt-label" data-astro-cid-s2acqxyq>filter duplicates</span> </label> <label class="checkbox-wrap" data-astro-cid-s2acqxyq> <input type="checkbox" id="newlineEach" data-astro-cid-s2acqxyq> <span class="opt-label" data-astro-cid-s2acqxyq>one word per line</span> </label> </div> </div> <button class="generate-btn" id="generateBtn" data-astro-cid-s2acqxyq> <span class="btn-text" data-astro-cid-s2acqxyq>Generate</span> </button> </aside> <!-- ── Output ── --> <section class="output" data-astro-cid-s2acqxyq> <div class="output-header" data-astro-cid-s2acqxyq> <span class="output-title" data-astro-cid-s2acqxyq>Output</span> <span class="output-meta" id="outputMeta" data-astro-cid-s2acqxyq></span> <div class="output-actions" data-astro-cid-s2acqxyq> <button class="action-btn" id="copyBtn" data-astro-cid-s2acqxyq>Copy</button> <button class="action-btn" id="saveBtn" data-astro-cid-s2acqxyq>Save .txt</button> </div> </div> <div class="word-grid" id="wordGrid" data-astro-cid-s2acqxyq> <div class="empty-state" data-astro-cid-s2acqxyq> <div class="glyph" data-astro-cid-s2acqxyq>ꝏ</div> <p data-astro-cid-s2acqxyq>configure subpatterns and generate</p> </div> </div> </section> </main> <footer data-astro-cid-s2acqxyq> <span class="footer-note" data-astro-cid-s2acqxyq>
Press <span class="kbd" data-astro-cid-s2acqxyq>⌘ Enter</span> or <span class="kbd" data-astro-cid-s2acqxyq>Ctrl Enter</span> to generate
</span> </footer> ${renderScript($$result, "/Users/jafu/Documents/Code/jafupy.com/src/pages/misc/words.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/Users/jafu/Documents/Code/jafupy.com/src/pages/misc/words.astro", void 0);

const $$file = "/Users/jafu/Documents/Code/jafupy.com/src/pages/misc/words.astro";
const $$url = "/misc/words";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Words,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
