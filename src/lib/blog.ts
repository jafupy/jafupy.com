import type { CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

export function getPostSlug(post: BlogPost) {
  return post.id.split("/").pop() ?? post.id;
}

export function getPostYear(post: BlogPost) {
  return post.data.date.getFullYear().toString();
}

export function getPostHref(post: BlogPost) {
  return `/writing/${getPostYear(post)}/${getPostSlug(post)}/`;
}

export function sortPostsByDate(posts: BlogPost[]) {
  return posts.toSorted(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}
