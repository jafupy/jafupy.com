import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async ({ url }, next) => {
  const response = await next();
  const needsIsolation =
    url.pathname === "/tally" ||
    url.pathname.startsWith("/tally/") ||
    url.pathname.startsWith("/api/tally/");

  if (!needsIsolation) return response;

  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
