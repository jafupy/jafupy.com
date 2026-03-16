import { actions } from "astro:actions";
import Fuse from "fuse.js";

export type FilterType = "year" | "type";

export type Filter = {
  type: FilterType;
  value: string;
};

export type SearchResult = {
  type: "post" | "page" | "action" | "social";
  title: string;
  description?: string;
  href?: string;
  slug?: string;
  date?: string;
};

class SearchEngine {
  query = $state("");
  activeFilters = $state<Filter[]>([]);
  #results = $state<SearchResult[]>([]);
  #availableFilters = $state<Filter[]>([]);
  #filterFuse: Fuse<Filter> | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  #initialized = false;

  get areWeTagging() {
    return this.query.startsWith(":");
  }

  get results() {
    return this.#results;
  }

  async init() {
    if (this.#initialized) return;
    this.#initialized = true;

    const CACHE_KEY = "search:filters";
    const cached = sessionStorage.getItem(CACHE_KEY);

    let filters: Filter[];

    if (cached) {
      filters = JSON.parse(cached);
    } else {
      const { data, error } = await actions.getFilters();
      if (error) {
        this.#initialized = false;
        return;
      }
      filters = data;
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(filters));
    }

    this.#availableFilters = filters;
    this.#filterFuse = new Fuse(filters, {
      keys: ["value"],
      threshold: 0.4,
    });
  }

  setQuery(raw: string) {
    this.query = raw;
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => this.#run(), 120);
  }

  async #run() {
    if (this.areWeTagging) {
      const term = this.query.slice(1);
      const matches =
        term.length === 0
          ? this.#availableFilters
          : (this.#filterFuse?.search(term).map((r) => r.item) ?? []);

      this.#results = matches.map((f) => ({
        type: "action" as const,
        title: f.value,
        description: f.type,
      }));
    } else {
      const { data, error } = await actions.search({
        query: this.query,
        filters: this.activeFilters,
      });
      if (!error) this.#results = data;
    }
  }

  confirmFilter(value: string) {
    const filter = this.#availableFilters.find((f) => f.value === value);
    if (!filter || this.activeFilters.find((f) => f.value === value)) return;
    this.activeFilters = [...this.activeFilters, filter];
    this.query = "";
    this.#run();
  }

  removeFilter(value: string) {
    this.activeFilters = this.activeFilters.filter((f) => f.value !== value);
    this.#run();
  }

  reset() {
    this.query = "";
    this.activeFilters = [];
    this.#results = [];
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
  }
}

export const engine = new SearchEngine();
