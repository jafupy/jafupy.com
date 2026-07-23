import type { APIRoute } from "astro";

const CLOC_URL =
  "https://raw.githubusercontent.com/AlDanial/cloc/v2.08/cloc";
const MAX_CLOC_BYTES = 2 * 1024 * 1024;

export const GET: APIRoute = async () => {
  const upstream = await fetch(CLOC_URL, {
    headers: { "User-Agent": "jafupy-tally-browser" },
  });

  if (!upstream.ok) {
    return new Response(`Could not download cloc v2.08 (${upstream.status}).`, {
      status: 502,
    });
  }

  const declared = Number(upstream.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_CLOC_BYTES) {
    return new Response("The cloc script exceeds the expected size limit.", {
      status: 502,
    });
  }

  const script = new Uint8Array(await upstream.arrayBuffer());
  if (script.byteLength > MAX_CLOC_BYTES) {
    return new Response("The cloc script exceeds the expected size limit.", {
      status: 502,
    });
  }

  return new Response(script, {
    headers: {
      "Content-Type": "text/x-perl; charset=utf-8",
      "Content-Length": String(script.byteLength),
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
};
