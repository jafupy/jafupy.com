// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "poimandres",
    },
  },
  adapter: vercel(),

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
