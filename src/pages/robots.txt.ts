import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site, url }) => {
  const origin = (site ?? new URL(url.origin)).toString().replace(/\/$/, "");

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${origin}/sitemap-index.xml`,
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
};
