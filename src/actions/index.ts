import { writing, pages } from "$/lib/search";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
  search: defineAction({
    input: z.string(),

    handler: async (query) => {
      return {
        writing: writing.search(query),
        pages: pages.search(query),
      };
    },
  }),
};
