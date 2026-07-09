import type { APIRoute } from "astro";

const installScript = "https://raw.githubusercontent.com/jafupy/tally/master/site/install.sh";

export const GET: APIRoute = () =>
  fetch(installScript).then((response) => {
    if (!response.ok) {
      return new Response("failed to retrieve Tally installer\n", { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  });
