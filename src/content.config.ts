import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
  }),
});

const cmdkTags = defineCollection({
  loader: glob({ base: "./src/content/cmdk-tags", pattern: "*.json" }),
  schema: z.object({
    label: z.string(),
    type: z.enum(["type"]),
    value: z.enum(["writing", "project", "page", "action", "social"]),
    aliases: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

export const collections = { blog, cmdkTags };
