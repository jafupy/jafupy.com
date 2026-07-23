import type { APIRoute } from "astro";

const MAX_RUNTIME_BYTES = 32 * 1024 * 1024;
const RUNTIME_URL =
  import.meta.env.TALLY_RUNTIME_URL ??
  "https://assets.jafupy.com/tally/tally.wasm";

export const prerender = true;

async function readLimited(response: Response, maximum: number) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximum) {
    throw new Error("The Tally WASIX binary exceeds the runtime size limit.");
  }

  if (!response.body) return new Uint8Array(await response.arrayBuffer());

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > maximum) {
      await reader.cancel();
      throw new Error("The Tally WASIX binary exceeds the runtime size limit.");
    }
    chunks.push(value);
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export const GET: APIRoute = async () => {
  const upstream = await fetch(RUNTIME_URL, {
    headers: { "User-Agent": "jafupy-tally-browser" },
    redirect: "follow",
  });

  if (!upstream.ok) {
    throw new Error(
      `Could not fetch the Tally browser runtime: ${upstream.status} ${upstream.statusText}`,
    );
  }

  const binary = await readLimited(upstream, MAX_RUNTIME_BYTES);
  return new Response(binary, {
    headers: {
      "Content-Type": "application/wasm",
      "Content-Length": String(binary.byteLength),
      "Cache-Control": "public, max-age=300, s-maxage=31536000",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
};
