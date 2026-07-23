import type { APIRoute } from "astro";

const CLOC_URL =
  "https://raw.githubusercontent.com/AlDanial/cloc/v2.08/cloc";
const MAX_CLOC_BYTES = 2 * 1024 * 1024;

const COMPATIBILITY_PATCHES = new Map([
  [
    "use Encode qw( encode );",
    [
      "# ZeroPerl omits Encode's XS dependency chain. cloc only needs encode()",
      "# for explicitly requested output encodings, so preserve the default path.",
      "sub encode { return $_[1]; }",
    ].join("\n"),
  ],
  [
    "use POSIX qw { strftime ceil};",
    [
      "# ZeroPerl omits POSIX. These functions are not used by cloc's default report path.",
      "sub ceil { my $x = shift; my $i = int($x); return $x == $i ? $i : $i + ($x > 0 ? 1 : 0); }",
      "sub strftime { return ''; }",
    ].join("\n"),
  ],
  [
    "use Encode;",
    "# Encode unavailable under ZeroPerl; the PAR::Packer workaround is irrelevant here.",
  ],
  [
    "tempdir( CLEANUP => 1 )",
    "do { my $d = '/repo/.cloc-tmp'; File::Path::mkpath($d) unless -d $d; $d }",
  ],
]);

function patchForZeroPerl(source: string) {
  let patched = source;
  for (const [needle, replacement] of COMPATIBILITY_PATCHES) {
    if (!patched.includes(needle)) {
      throw new Error(`Pinned cloc script no longer contains: ${needle}`);
    }
    patched = patched.replaceAll(needle, replacement);
  }
  return patched;
}

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

  let script: string;
  try {
    script = patchForZeroPerl(source);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : String(error), {
      status: 502,
    });
  }

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
