import { tick } from "svelte";
import type { SearchResult } from "../search.svelte.ts";

export class CmdkState {
  selectedIndex = $state(-1);
  #items = new Map<number, HTMLElement>();
  #results: () => SearchResult[];
  #onConfirm: (result: SearchResult) => void;
  #onEscape: () => void;
  #pendingScrollFrame = 0;
  #scrollRequestId = 0;

  constructor(opts: {
    results: () => SearchResult[];
    onConfirm: (result: SearchResult) => void;
    onEscape: () => void;
  }) {
    this.#results = opts.results;
    this.#onConfirm = opts.onConfirm;
    this.#onEscape = opts.onEscape;

    $effect(() => {
      const len = this.#results().length;

      if (len === 0) {
        this.selectedIndex = -1;
        return;
      }

      if (this.selectedIndex < 0) {
        this.selectedIndex = 0;
        return;
      }

      if (this.selectedIndex >= len) {
        this.selectedIndex = len - 1;
      }
    });
  }

  register(index: number, el: HTMLElement) {
    this.#items.set(index, el);
  }

  unregister(index: number) {
    this.#items.delete(index);
    if (this.selectedIndex === index) {
      this.selectedIndex = Math.min(
        this.selectedIndex,
        this.#results().length - 1,
      );
    }
  }

  confirm(index: number) {
    const results = this.#results();
    const result = results[index];
    if (result) this.#onConfirm(result);
  }

  onkeydown = (e: KeyboardEvent) => {
    const len = this.#results().length;
    if (len === 0 && e.key !== "Escape") return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.#moveSelection(1, len);
        this.#scheduleScrollSelectedIntoView();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.#moveSelection(-1, len);
        this.#scheduleScrollSelectedIntoView();
        break;
      case "Enter":
        e.preventDefault();
        this.confirm(this.selectedIndex);
        break;
      case "Escape":
        e.preventDefault();
        this.#onEscape();
        break;
    }
  };

  #moveSelection(delta: number, len: number) {
    if (len === 0) {
      this.selectedIndex = -1;
      return;
    }

    const nextIndex = this.selectedIndex < 0 ? 0 : this.selectedIndex + delta;
    this.selectedIndex = Math.min(Math.max(nextIndex, 0), len - 1);
  }

  #scrollSelectedIntoView() {
    const el = this.#items.get(this.selectedIndex);
    if (!el) return;

    el.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }

  async #scheduleScrollSelectedIntoView() {
    const requestId = ++this.#scrollRequestId;

    if (this.#pendingScrollFrame) {
      cancelAnimationFrame(this.#pendingScrollFrame);
      this.#pendingScrollFrame = 0;
    }

    await tick();
    if (requestId !== this.#scrollRequestId) return;

    this.#pendingScrollFrame = requestAnimationFrame(() => {
      if (requestId !== this.#scrollRequestId) return;

      this.#pendingScrollFrame = 0;
      this.#scrollSelectedIntoView();
    });
  }
}
