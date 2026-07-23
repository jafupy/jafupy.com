import type { APIRoute } from "astro";

const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function normaliseRepository(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();

  if (REPOSITORY_PATTERN.test(trimmed)) {
    return trimmed.replace(/\.git$/, "");
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      return null;
    }

    const [owner, rawRepository] = parsed.pathname.split("/").filter(Boolean);
    const repository = rawRepository?.replace(/\.git$/, "");
    const result = owner && repository ? `${owner}/${repository}` : null;
    return result && REPOSITORY_PATTERN.test(result) ? result : null;
  } catch {
    return null;
  }
}

async function readLimited(response: Response, maximum: number) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximum) {
    throw new Error("Repository archive exceeds the 64 MB download limit.");
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
      throw new Error("Repository archive exceeds the 64 MB download limit.");
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

export const GET: APIRoute = async ({ url }) => {
  const repository = normaliseRepository(url.searchParams.get("repo"));
  if (!repository) {
    return new Response("Enter a valid public GitHub repository.", { status: 400 });
  }

  const upstream = await fetch(`https://codeload.github.com/${repository}/tar.gz/HEAD`, {
    headers: {
      Accept: "application/gzip",
      "User-Agent": "jafupy-tally-browser",
    },
    redirect: "follow",
  });

  if (!upstream.ok) {
    const status = upstream.status === 404 ? 404 : 502;
    return new Response(
      upstream.status === 404
        ? "GitHub could not find that public repository."
        : `GitHub returned ${upstream.status} while downloading the repository.`,
      { status },
    );
  }

  try {
    const archive = await readLimited(upstream, MAX_ARCHIVE_BYTES);
    return new Response(archive, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Length": String(archive.byteLength),
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Tally-Repository": repository,
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : String(error), {
      status: 413,
    });
  }
};
