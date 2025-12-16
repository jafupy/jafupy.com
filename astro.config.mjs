// @ts-check
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "poimandres",
    },
  },
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        $: "src/",
      },
    },
  },

  integrations: [svelte()],
});
