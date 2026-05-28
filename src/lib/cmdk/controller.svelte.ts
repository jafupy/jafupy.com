import { tick } from "svelte";
import { type SearchResult, engine } from "./search.svelte.ts";
import { CmdkAnimator } from "./animator.svelte.ts";
import { swapper } from "./swapper.svelte.ts";
import { create } from "$/lib/hud/index.ts";

export class CmdkController {
  #scrollPosition = -1;
  #animator = new CmdkAnimator();

  attach() {
    window.addEventListener(
      "cmdk-toggle",
      this.#onToggleRequest as EventListener,
    );
  }

  destroy() {
    window.removeEventListener(
      "cmdk-toggle",
      this.#onToggleRequest as EventListener,
    );
    this.#animator.stopObservingResults();
  }

  setResultsElement(el: HTMLElement | null) {
    this.#animator.setResultsElement(el);
  }

  observeResults() {
    if (!swapper.open) {
      this.#animator.stopObservingResults();
      return () => {};
    }

    return this.#animator.startObservingResults();
  }

  handleGlobalKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      this.toggle();
    }
  };

  toggle = () => {
    if (swapper.open) this.close();
    else this.open();
  };

  async open() {
    const layoutState = this.#animator.captureLayout();
    this.#scrollPosition = window.scrollY;
    await engine.init();
    engine.setQuery("");
    swapper.toggle(true);
    window.dispatchEvent(new CustomEvent("cmdk-opened"));
    await tick();
    this.#animator.scheduleSyncOffset();
    await this.#animator.playOpen(layoutState);
    requestAnimationFrame(() => this.#animator.centerSelectedResult());
  }

  close = async () => {
    await this.#animator.playClose();
    this.#animator.stopObservingResults();
    engine.reset();

    if (this.#scrollPosition >= 0) {
      window.scrollTo({ top: this.#scrollPosition });
    }

    window.dispatchEvent(new CustomEvent("cmdk-closed"));

    if (this.#scrollPosition < 0) return;
    this.#scrollPosition = -1;
  };

  onConfirm = async (result: SearchResult) => {
    if (result.type === "filter") {
      const alreadyActive = engine.activeFilters.some(
        (filter) => filter.id === result.filterId,
      );

      if (alreadyActive) {
        engine.removeFilter(result.filterId);
      } else {
        engine.confirmFilter(result.filterId);
        create("Select an active tag again to remove it");
      }

      engine.setQuery("");
      return;
    }

    if (result.type === "action") {
      if (result.actionId === "copy-email") {
        await navigator.clipboard.writeText(result.description);
        create("Email copied");
      }
      await this.close();
      return;
    }

    if (result.type === "page" || result.type === "social") {
      window.location.href = result.href;
      return;
    }

    if (result.type === "project") {
      window.location.href = result.href;
      return;
    }

    const date = new Date(result.date);
    window.location.href = `/writing/${date.getFullYear()}/${result.slug}`;
    await this.close();
  };

  syncResultsLayout() {
    tick().then(() => this.#animator.scheduleSyncOffset());
  }

  #onToggleRequest = () => {
    this.toggle();
  };
}
