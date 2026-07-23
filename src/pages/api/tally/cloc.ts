import type { APIRoute } from "astro";

const CLOC_URL =
  "https://raw.githubusercontent.com/AlDanial/cloc/v2.08/cloc";
const MAX_CLOC_BYTES = 2 * 1024 * 1024;
const ENCODE_IMPORT = "use Encode qw( encode );";
const ENCODE_SHIM = [
  "# ZeroPerl omits Encode's XS dependency chain. cloc only needs encode()",
  "# for explicitly requested output encodings, so preserve the default path.",
  "sub encode { return $_[1]; }",
].join("\n");

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

  const source = await upstream.text();
  if (new TextEncoder().encode(source).byteLength > MAX_CLOC_BYTES) {
    return new Response("The cloc script exceeds the expected size limit.", {
      status: 502,
    });
  }
  if (!source.includes(ENCODE_IMPORT)) {
    return new Response("The pinned cloc script no longer matches the WASM compatibility patch.", {
      status: 502,
    });
  }

  const script = source.replace(ENCODE_IMPORT, ENCODE_SHIM);
  return new Response(script, {
    headers: {
      "Content-Type": "text/x-perl; charset=utf-8",
      "Content-Length": String(new TextEncoder().encode(script).byteLength),
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Cloc-Version": "2.08-wasm",
    },
  });
};
