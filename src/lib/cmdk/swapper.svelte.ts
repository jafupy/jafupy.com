export class Swapper {
  #open = $state(false);

  get open() {
    return this.#open;
  }

  toggle(force: boolean | "AUTO" = "AUTO") {
    const next = force === "AUTO" ? !this.#open : force;

    if (next === this.#open) return;

    this.#open = next;

    for (const selector of ["nav", "#content"]) {
      const el = document.querySelector(selector);
      if (!el) continue;
      el.classList.toggle("searching", next);
    }
  }
}

export const swapper = new Swapper();
