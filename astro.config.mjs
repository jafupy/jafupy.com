// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "poimandres",
    },
  },
  site: "https://example.com",
  integrations: [
    mdx(),
    sitemap(),
    react(),
    {
      name: "Crawlspace",
      hooks: {
        "astro:config:setup": (options) => {
          console.log("Crawlspace");
          console.log(options);
        },
      },
    },
  ],
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        $: "src/",
      },
    },
  },
});
