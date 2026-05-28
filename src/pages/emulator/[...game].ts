import type { APIRoute } from "astro";

export const GET: APIRoute = ({ params, redirect }) => {
  const query = params.game ? `?${encodeURIComponent(params.game)}` : "";

  return redirect(`/emulator${query}`, 301);
};
