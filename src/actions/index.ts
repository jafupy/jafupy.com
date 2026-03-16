import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { getCollection } from "astro:content";
import Fuse from "fuse.js";
import type { Filter, SearchResult } from "$/lib/cmdk/search.svelte";

const STATIC_ITEMS: SearchResult[] = [
  { type: "page", title: "Home", href: "/" },
  { type: "page", title: "Writing", href: "/writing" },
  { type: "page", title: "About", href: "/about" },
  { type: "action", title: "Copy email", description: "jacob@jafupy.com" },
  { type: "social", title: "GitHub", href: "https://github.com/jafupy" },
  { type: "social", title: "Twitter", href: "https://twitter.com/jafupy" },
];

async function getPosts(): Promise<SearchResult[]> {
  const posts = await getCollection("blog");
  return posts.map((p) => ({
    type: "post" as const,
    title: p.data.title,
    description: p.data.description,
    slug: p.id,
    date: p.data.date.toISOString(),
    body: p.body,
    year: p.data.date.getFullYear().toString(),
  }));
}

export const server = {
  getFilters: defineAction({
    async handler() {
      const posts = await getCollection("blog");
      const years = [
        ...new Set(posts.map((p) => p.data.date.getFullYear().toString())),
      ]
        .sort()
        .reverse();

      const filters: Filter[] = [
        { type: "type", value: "post" },
        { type: "type", value: "page" },
        { type: "type", value: "action" },
        { type: "type", value: "social" },
        ...years.map((y) => ({ type: "year" as const, value: y })),
      ];

      return filters;
    },
  }),

  search: defineAction({
    input: z.object({
      query: z.string(),
      filters: z.array(
        z.object({
          type: z.enum(["year", "type"]),
          value: z.string(),
        }),
      ),
    }),
    async handler({ query, filters }) {
      const posts = await getPosts();
      const all: (SearchResult & { year?: string; body?: string })[] = [
        ...posts,
        ...STATIC_ITEMS,
      ];

      // apply active filters
      const yearFilters = filters
        .filter((f) => f.type === "year")
        .map((f) => f.value);
      const typeFilters = filters
        .filter((f) => f.type === "type")
        .map((f) => f.value);

      let filtered = all.filter((item) => {
        if (yearFilters.length > 0) {
          if (item.type !== "post") return false;
          if (!yearFilters.includes((item as any).year)) return false;
        }
        if (typeFilters.length > 0) {
          if (!typeFilters.includes(item.type)) return false;
        }
        return true;
      });

      // if no query, return filtered list sorted by date desc
      if (!query.trim()) {
        return filtered.map(({ body: _, year: __, ...rest }) => rest);
      }

      // fuse search over filtered set
      const fuse = new Fuse(filtered, {
        keys: [
          { name: "title", weight: 3 },
          { name: "description", weight: 2 },
          { name: "body", weight: 1 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      return fuse
        .search(query)
        .map((r) => r.item)
        .map(({ body: _, year: __, ...rest }) => rest);
    },
  }),
};

export const prerender = false;
