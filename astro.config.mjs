// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

export default defineConfig({
  site: "https://jafupy.com",
  markdown: {
    shikiConfig: {
      theme: "poimandres",
    },
  },
  adapter: vercel(),
  output: "server",

  vite: {
    resolve: {
      alias: {
        $: "/src",
      },

      noExternal: ["@lucide/svelte"],
    },

    plugins: [tailwindcss()],
  },

  integrations: [svelte()],
});
