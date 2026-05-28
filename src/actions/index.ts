import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { getCollection } from "astro:content";
import Fuse from "fuse.js";
import type {
  Filter,
  PageResult,
  ProjectResult,
  WritingResult,
  SearchResult,
  SocialResult,
  ActionResult,
} from "$/lib/cmdk/search.svelte";
import { projects } from "$/projects";

type SearchableResult = SearchResult & {
  body?: string;
  year?: string;
};

type SearchableWritingResult = WritingResult & {
  body?: string;
  year: string;
};

type SearchableProjectResult = ProjectResult & {
  body?: string;
};

function toFilterId(type: Filter["type"], value: string) {
  return `${type}:${value}`;
}

const STATIC_ITEMS: (PageResult | ActionResult | SocialResult)[] = [
  { type: "page", title: "Home", href: "/" },
  { type: "page", title: "Writing", href: "/writing" },
  { type: "page", title: "Projects", href: "/projects" },
  {
    type: "action",
    title: "Copy email",
    description: "hello@jafupy.com",
    actionId: "copy-email",
  },
  { type: "social", title: "GitHub", href: "https://github.com/jafupy" },
  { type: "social", title: "Twitter", href: "https://x.com/jafupy" },
];

function compareAlphabetically(
  a: Pick<SearchResult, "title">,
  b: Pick<SearchResult, "title">,
) {
  return a.title.localeCompare(b.title, undefined, {
    sensitivity: "base",
  });
}

async function getPosts(): Promise<SearchableWritingResult[]> {
  const posts = await getCollection("blog");
  return posts.map((p) => ({
    type: "writing",
    title: p.data.title,
    description: p.data.description,
    slug: p.id,
    date: p.data.date.toISOString(),
    body: p.body,
    year: p.data.date.getFullYear().toString(),
  }));
}

async function getProjects(): Promise<SearchableProjectResult[]> {
  return projects.map((project) => ({
    type: "project",
    title: project.title,
    description: project.description,
    href: project.href,
  }));
}

async function getTagFilters(): Promise<Filter[]> {
  const tags = await getCollection("cmdkTags");

  return tags
    .map((tag) => ({
      id: toFilterId(tag.data.type, tag.data.value),
      type: tag.data.type,
      value: tag.data.value,
      label: tag.data.label,
      aliases: tag.data.aliases,
      order: tag.data.order,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ order: _, ...filter }) => filter);
}

export const server = {
  getFilters: defineAction({
    async handler() {
      const posts = await getCollection("blog");
      const tags = await getTagFilters();
      const years = [
        ...new Set(posts.map((p) => p.data.date.getFullYear().toString())),
      ]
        .sort()
        .reverse();

      const filters: Filter[] = [
        ...tags,
        ...years.map((year) => ({
          id: toFilterId("year", year),
          type: "year" as const,
          value: year,
          label: year,
        })),
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
      const projects = await getProjects();
      const all: SearchableResult[] = [...posts, ...projects, ...STATIC_ITEMS];
      const filterGroups = filters.reduce((groups, filter) => {
        const values = groups.get(filter.type) ?? new Set<string>();
        values.add(filter.value);
        groups.set(filter.type, values);
        return groups;
      }, new Map<Filter["type"], Set<string>>());

      const filtered = all.filter((item) => {
        for (const [filterType, values] of filterGroups) {
          if (filterType === "type" && !values.has(item.type)) {
            return false;
          }

          if (filterType === "year") {
            if (item.type !== "writing") return false;
            if (!item.year || !values.has(item.year)) return false;
          }
        }

        return true;
      });

      // if no query, return the filtered list alphabetically
      if (!query.trim()) {
        return filtered
          .slice()
          .sort(compareAlphabetically)
          .map(({ body: _, year: __, ...rest }) => rest);
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
        .sort((a, b) => {
          const scoreDiff = (a.score ?? 1) - (b.score ?? 1);
          return scoreDiff || compareAlphabetically(a.item, b.item);
        })
        .map((r) => r.item)
        .map(({ body: _, year: __, ...rest }) => rest);
    },
  }),
};

export const prerender = false;
