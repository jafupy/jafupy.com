import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { getCollection } from "astro:content";
import Fuse from "fuse.js";
import type {
  ActionResult,
  Filter,
  PageResult,
  ProjectResult,
  SearchResult,
  SocialResult,
  WritingResult,
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

const STATIC_ITEMS: (PageResult | ActionResult | SocialResult)[] = [
  { type: "page", title: "Home", href: "/" },
  { type: "page", title: "Writing", href: "/writing" },
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

const toFilterId = (type: Filter["type"], value: string) => `${type}:${value}`;
const stripSearchFields = ({ body: _, year: __, ...result }: SearchableResult) =>
  result;

async function getPosts(): Promise<SearchableWritingResult[]> {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    type: "writing",
    title: post.data.title,
    description: post.data.description,
    slug: post.id,
    date: post.data.date.toISOString(),
    body: post.body,
    year: post.data.date.getFullYear().toString(),
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
    .map(({ data }) => ({
      id: toFilterId(data.type, data.value),
      type: data.type,
      value: data.value,
      label: data.label,
      aliases: data.aliases,
      order: data.order,
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
      const [posts, projects] = await Promise.all([getPosts(), getProjects()]);
      const all: SearchableResult[] = [...posts, ...projects, ...STATIC_ITEMS];
      const filterGroups = filters.reduce((groups, filter) => {
        const values = groups.get(filter.type) ?? new Set<string>();
        values.add(filter.value);
        groups.set(filter.type, values);
        return groups;
      }, new Map<Filter["type"], Set<string>>());

      const filtered = all.filter((item) => {
        for (const [type, values] of filterGroups) {
          if (type === "type" && !values.has(item.type)) return false;
          if (
            type === "year" &&
            (item.type !== "writing" || !item.year || !values.has(item.year))
          ) {
            return false;
          }
        }

        return true;
      });

      if (!query.trim()) {
        return filtered
          .slice()
          .sort(compareAlphabetically)
          .map(stripSearchFields);
      }

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
        .map(stripSearchFields);
    },
  }),
};

export const prerender = false;
