import type { APIRoute } from "astro";

const MAX_RUNTIME_BYTES = 32 * 1024 * 1024;
const RUNTIME_URL =
  "https://github.com/jafupy/tally/releases/latest/download/tally-wasix.wasm";

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
    return new Response(
      "The browser runtime has not been published yet. Release Tally with the tally-wasix.wasm asset first.",
      { status: 503 },
    );
  }

  try {
    const binary = await readLimited(upstream, MAX_RUNTIME_BYTES);
    return new Response(binary, {
      headers: {
        "Content-Type": "application/wasm",
        "Content-Length": String(binary.byteLength),
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : String(error), {
      status: 502,
    });
  }
};
