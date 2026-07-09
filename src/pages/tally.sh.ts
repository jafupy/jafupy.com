import type { APIRoute } from "astro";

const installScript = "https://raw.githubusercontent.com/jafupy/tally/master/site/install.sh";

export const prerender = true;

export const GET: APIRoute = async () => {
  const response = await fetch(installScript);
  if (!response.ok) {
    return new Response("failed to retrieve Tally installer\n", { status: 502 });
  }

  return new Response(await response.text(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=31536000",
    },
  });
};
