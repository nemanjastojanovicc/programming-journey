import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { astroImageTools } from "astro-imagetools";

import { defineConfig } from "astro/config";
import config from "./src/config/config.json";

// https://astro.build/config
export default defineConfig({
  site: config.site.base_url ? config.site.base_url : "http://examplesite.com",
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: config.site.trailing_slash ? "always" : "never",
  integrations: [
    sitemap(),
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    mdx(),
    astroImageTools,
  ],
  markdown: {
    remarkPlugins: [],
    shikiConfig: {
      theme: "dark-plus",
      wrap: true,
    },
    extendDefaultPlugins: true,
  },
  prefetch: {
    prefetchAll: true,
  },
  experimental: {
    clientPrerender: true,
  },
});
