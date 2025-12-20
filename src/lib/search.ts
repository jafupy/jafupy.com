import { getCollection } from "astro:content";
import Fuse from "fuse.js";

export const collection = (await getCollection("blog")).map((e) => ({
  ...e.data,
  body: e.body,
  path: e.filePath,
  id: e.id,
}));

export const writing = new Fuse(collection, {
  keys: [
    { name: "title", weight: 2 },
    "tags",
    "description",
    { name: "body", weight: 0.5 },
  ],
  threshold: 0.5,
  includeScore: true,
});

export const pages = new Fuse(
  [
    { name: "Home", path: "/", icon: "HomeIcon" },
    { name: "About", path: "/about", icon: "UserRoundIcon" },
    { name: "Writing", path: "/w", icon: "FileTextIcon" },
  ],
  {
    keys: ["name"],
    threshold: 0.5,
    includeScore: true,
  },
);
