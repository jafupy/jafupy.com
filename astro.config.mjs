// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

/** @param {{ plugin?: string; message?: string }} log */
const isBuildToolNodeWarning = (log) =>
  log?.plugin === "vite:resolve" &&
  log?.message?.includes("has been externalized for browser compatibility") &&
  log?.message?.includes("/node_modules/");

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
    build: {
      rollupOptions: {
        onLog(level, log, handler) {
          if (level === "warn" && isBuildToolNodeWarning(log)) return;
          handler(level, log);
        },
      },
    },

    resolve: {
      alias: {
        $: "/src",
      },

      noExternal: ["@lucide/svelte"],
    },

    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ["**/.vercel/**", "**/dist/**"],
      },
    },
  },

  integrations: [sitemap(), svelte()],
});
