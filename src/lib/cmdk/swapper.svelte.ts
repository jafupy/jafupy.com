// swapper.svelte.js
export class Swapper {
  #open = $state(false);
  #fragments = new Map();

  get open() {
    return this.#open;
  }

  toggle(force: boolean | "AUTO" = "AUTO") {
    if (force === "AUTO") {
      this.#open ? this.#close() : this.#open_();
      return;
    }
    if (force) {
      if (this.#open) return;
      this.#open_();
    } else {
      if (!this.#open) return; // already closed
      this.#close();
    }
  }

  #open_() {
    for (const [selector] of this.#targets()) {
      const el = document.querySelector(selector)!;
      const frag = document.createDocumentFragment();
      while (el.firstChild) frag.appendChild(el.firstChild);
      this.#fragments.set(selector, frag);
      el.classList.add("searching");
    }
    this.#open = true;
  }

  #close() {
    for (const [selector, frag] of this.#fragments) {
      document.querySelector(selector).appendChild(frag);
      document.querySelector(selector).classList.remove("searching");
    }
    this.#fragments.clear();
    this.#open = false;
  }

  #targets() {
    return [["nav"], ["#content"]];
  }
}

export const swapper = new Swapper();
