import { c as createActionsProxy, p as pipelineSymbol, A as AstroError, a as ActionCalledFromServerError, d as defineAction } from './entrypoint_1wx7snJx.mjs';
import * as z from 'zod/v4';
import { g as getCollection } from './_astro_content_DZT6xUol.mjs';
import Fuse from 'fuse.js';
import { p as projects } from './index_BogjlJOm.mjs';

createActionsProxy({
  handleAction: async (param, path, context) => {
    const pipeline = context ? Reflect.get(context, pipelineSymbol) : void 0;
    if (!pipeline) {
      throw new AstroError(ActionCalledFromServerError);
    }
    const action = await pipeline.getAction(path);
    if (!action) throw new Error(`Action not found: ${path}`);
    return action.bind(context)(param);
  }
});

function toFilterId(type, value) {
  return `${type}:${value}`;
}
const STATIC_ITEMS = [
  { type: "page", title: "Home", href: "/" },
  { type: "page", title: "Writing", href: "/writing" },
  { type: "page", title: "Projects", href: "/projects" },
  {
    type: "action",
    title: "Copy email",
    description: "hello@jafupy.com",
    actionId: "copy-email"
  },
  { type: "social", title: "GitHub", href: "https://github.com/jafupy" },
  { type: "social", title: "Twitter", href: "https://x.com/jafupy" }
];
function compareAlphabetically(a, b) {
  return a.title.localeCompare(b.title, void 0, {
    sensitivity: "base"
  });
}
async function getPosts() {
  const posts = await getCollection("blog");
  return posts.map((p) => ({
    type: "writing",
    title: p.data.title,
    description: p.data.description,
    slug: p.id,
    date: p.data.date.toISOString(),
    body: p.body,
    year: p.data.date.getFullYear().toString()
  }));
}
async function getProjects() {
  return projects.map((project) => ({
    type: "project",
    title: project.title,
    description: project.description,
    href: project.href
  }));
}
async function getTagFilters() {
  const tags = await getCollection("cmdkTags");
  return tags.map((tag) => ({
    id: toFilterId(tag.data.type, tag.data.value),
    type: tag.data.type,
    value: tag.data.value,
    label: tag.data.label,
    aliases: tag.data.aliases,
    order: tag.data.order
  })).sort((a, b) => a.order - b.order).map(({ order: _, ...filter }) => filter);
}
const server = {
  getFilters: defineAction({
    async handler() {
      const posts = await getCollection("blog");
      const tags = await getTagFilters();
      const years = [
        ...new Set(posts.map((p) => p.data.date.getFullYear().toString()))
      ].sort().reverse();
      const filters = [
        ...tags,
        ...years.map((year) => ({
          id: toFilterId("year", year),
          type: "year",
          value: year,
          label: year
        }))
      ];
      return filters;
    }
  }),
  search: defineAction({
    input: z.object({
      query: z.string(),
      filters: z.array(
        z.object({
          type: z.enum(["year", "type"]),
          value: z.string()
        })
      )
    }),
    async handler({ query, filters }) {
      const posts = await getPosts();
      const projects2 = await getProjects();
      const all = [...posts, ...projects2, ...STATIC_ITEMS];
      const filterGroups = filters.reduce((groups, filter) => {
        const values = groups.get(filter.type) ?? /* @__PURE__ */ new Set();
        values.add(filter.value);
        groups.set(filter.type, values);
        return groups;
      }, /* @__PURE__ */ new Map());
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
      if (!query.trim()) {
        return filtered.slice().sort(compareAlphabetically).map(({ body: _, year: __, ...rest }) => rest);
      }
      const fuse = new Fuse(filtered, {
        keys: [
          { name: "title", weight: 3 },
          { name: "description", weight: 2 },
          { name: "body", weight: 1 }
        ],
        threshold: 0.4,
        includeScore: true
      });
      return fuse.search(query).sort((a, b) => {
        const scoreDiff = (a.score ?? 1) - (b.score ?? 1);
        return scoreDiff || compareAlphabetically(a.item, b.item);
      }).map((r) => r.item).map(({ body: _, year: __, ...rest }) => rest);
    }
  })
};

export { server };
