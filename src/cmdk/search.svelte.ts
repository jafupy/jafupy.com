import { actions } from "astro:actions";
import type { FuseResult } from "fuse.js";
import { Link } from "lucide-svelte";
import { derived } from "svelte/store";

const types = {
  POST: Symbol("POST"),
  LINK: Symbol("LINK"),
  ACTION: Symbol("ACTION"),
} as const;

class Search {
  query = $state("");
  loading = $state(false);
  results = $derived.by(this.search);

  constructor(query: string) {
    this.query = query;
  }

  async search() {
    this.loading = true;
    const { data, error } = await actions.search(this.query);
    this.loading = false;
    if (error) {
      return [];
    }

    const pages = data.pages.map(formatPage);
    return [...data.pages, ...data.writing];
  }
}

function formatPage(
  page: FuseResult<{ name: string; path: string; icon: string }>,
) {
  const { name: title, path: aside } = page.item;
  return {
    title,
    aside,
    icon: Link,
    action: () => {
      const link = document.createElement("a");
      link.href = page.item.path;
      link.click();
    },
    type: types.LINK,
    score: page.score,
  };
}

export default Search;
