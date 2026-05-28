import { actions } from "astro:actions";
import Fuse from "fuse.js";

export type FilterType = "year" | "type";

export type Filter = {
  id: string;
  type: FilterType;
  value: string;
  label: string;
  aliases?: string[];
};

type BaseResult = {
  title: string;
  description?: string;
};

function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export type WritingResult = BaseResult & {
  type: "writing";
  slug: string;
  date: string;
};

export type ProjectResult = BaseResult & {
  type: "project";
  href: string;
};

export type PageResult = BaseResult & {
  type: "page";
  href: string;
};

export type ActionResult = BaseResult & {
  type: "action";
  actionId: "copy-email";
  description: string;
};

export type SocialResult = BaseResult & {
  type: "social";
  href: string;
};

export type FilterResult = BaseResult & {
  type: "filter";
  filterId: string;
  filterType: FilterType;
  description: FilterType;
};

export type SearchResult =
  | WritingResult
  | ProjectResult
  | PageResult
  | ActionResult
  | SocialResult
  | FilterResult;

const SEARCH_CACHE_LIMIT = 50;
const WRITING_FILTER_ID = "type:writing";

class SearchEngine {
  query = $state("");
  activeFilters = $state<Filter[]>([]);
  #results = $state<SearchResult[]>([]);
  #availableFilters = $state<Filter[]>([]);
  #filterFuse: Fuse<Filter> | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  #initialized = false;
  #requestId = 0;
  #searchCache = new Map<string, SearchResult[]>();
  #explicitFilterIds = new Set<string>();
  #implicitFilterSources = new Map<string, Set<string>>();

  get areWeTagging() {
    return this.query.startsWith(":");
  }

  get results() {
    return this.#results;
  }

  async init() {
    if (this.#initialized) return;
    this.#initialized = true;
    const filters = await this.#fetchFilters();

    this.#availableFilters = filters;
    this.#filterFuse = new Fuse(filters, {
      keys: ["label", "aliases"],
      threshold: 0.4,
    });
  }

  async #fetchFilters() {
    const { data, error } = await actions.getFilters();
    if (error) {
      this.#initialized = false;
      return [];
    }
    return data;
  }

  setQuery(raw: string) {
    this.query = raw;
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);

    if (this.areWeTagging) {
      this.#run();
      return;
    }

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
        type: "filter" as const,
        title: capitalise(f.label),
        filterId: f.id,
        filterType: f.type,
        description: f.type,
      }));
    } else {
      const requestId = ++this.#requestId;
      const cacheKey = this.#cacheKey();
      const cached = this.#searchCache.get(cacheKey);

      if (cached) {
        this.#results = cached;
        return;
      }

      const { data, error } = await actions.search({
        query: this.query,
        filters: this.activeFilters,
      });
      if (error || requestId !== this.#requestId) return;

      this.#rememberSearch(cacheKey, data);
      this.#results = data;
    }
  }

  confirmFilter(filterId: string) {
    const nextFilters = new Map(
      this.activeFilters.map((filter) => [filter.id, filter]),
    );
    const explicitFilter = this.#availableFilters.find(
      (candidate) => candidate.id === filterId,
    );
    if (explicitFilter) {
      nextFilters.set(explicitFilter.id, explicitFilter);
      this.#explicitFilterIds.add(explicitFilter.id);
    }

    for (const filter of this.#resolveImplicitFilters(filterId)) {
      nextFilters.set(filter.id, filter);
      this.#addImplicitFilterSource(filter.id, filterId);
    }

    this.activeFilters = Array.from(nextFilters.values());
    this.query = "";
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#run();
  }

  removeFilter(filterId: string) {
    this.#explicitFilterIds.delete(filterId);
    this.#implicitFilterSources.delete(filterId);

    for (const sources of this.#implicitFilterSources.values()) {
      sources.delete(filterId);
    }

    this.activeFilters = this.activeFilters.filter((filter) =>
      this.#shouldKeepFilter(filter.id),
    );
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#run();
  }

  reset() {
    this.query = "";
    this.activeFilters = [];
    this.#results = [];
    this.#requestId += 1;
    this.#explicitFilterIds.clear();
    this.#implicitFilterSources.clear();
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
  }

  resultKey(result: SearchResult, index: number) {
    return [
      result.type,
      this.#resultId(result),
      result.description ?? "",
      result.type === "writing" ? result.date : "",
      index,
    ].join(":");
  }

  #cacheKey() {
    return JSON.stringify({
      query: this.query,
      filters: [...this.activeFilters].map((filter) => filter.id).sort(),
    });
  }

  #rememberSearch(cacheKey: string, results: SearchResult[]) {
    if (this.#searchCache.has(cacheKey)) {
      this.#searchCache.delete(cacheKey);
    }

    this.#searchCache.set(cacheKey, results);

    if (this.#searchCache.size <= SEARCH_CACHE_LIMIT) return;

    const oldestKey = this.#searchCache.keys().next().value;
    if (oldestKey) this.#searchCache.delete(oldestKey);
  }

  #resultId(result: SearchResult) {
    switch (result.type) {
      case "writing":
        return result.slug;
      case "page":
      case "social":
        return result.href;
      case "project":
        return result.href;
      case "action":
        return result.actionId;
      case "filter":
        return result.filterId;
    }
  }

  #resolveImplicitFilters(filterId: string) {
    const filter = this.#availableFilters.find(
      (candidate) => candidate.id === filterId,
    );
    if (!filter) return [];

    if (filter.type === "year") {
      const writingFilter = this.#availableFilters.find(
        (candidate) => candidate.id === WRITING_FILTER_ID,
      );
      return writingFilter ? [writingFilter] : [];
    }

    return [];
  }

  #addImplicitFilterSource(filterId: string, sourceFilterId: string) {
    const sources =
      this.#implicitFilterSources.get(filterId) ?? new Set<string>();
    sources.add(sourceFilterId);
    this.#implicitFilterSources.set(filterId, sources);
  }

  #shouldKeepFilter(filterId: string) {
    if (this.#explicitFilterIds.has(filterId)) return true;

    const sources = this.#implicitFilterSources.get(filterId);
    if (!sources) return false;

    for (const source of sources) {
      if (this.#explicitFilterIds.has(source)) return true;
    }

    this.#implicitFilterSources.delete(filterId);
    return false;
  }
}

export const engine = new SearchEngine();
