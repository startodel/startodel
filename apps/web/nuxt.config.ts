import { fileURLToPath } from "node:url";

import { ogAssets } from "./build-og-assets.mjs";

export default defineNuxtConfig({
  compatibilityDate: "2026-11-25",
  app: {
    head: {
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", type: "image/svg+xml", href: "/brand/favicon.svg" },
        { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
      ],
    },
  },
  typescript: { strict: true },
  // Render providers and their slots with the same Vue instance during SSR.
  build: { transpile: ["reka-ui"] },
  modules: ["nuxt-auth-utils", "@nuxtjs/i18n"],
  i18n: {
    strategy: "prefix_except_default",
    defaultLocale: "ru",
    detectBrowserLanguage: false,
    locales: [
      { code: "ru", language: "ru", file: "ru.json" },
      { code: "en", language: "en", file: "en.json" },
    ],
  },
  // Resolve the deployment's secret when the server starts, including after a build.
  runtimeConfig: {
    appSecret: "",
    // NUXT_PUBLIC_DESIGN_SHOWCASE=true serves /design outside development.
    public: { designShowcase: false },
  },
  hooks: {
    "nitro:config"(config) {
      const defaults = config.errorHandler ?? [];
      config.errorHandler = [
        fileURLToPath(new URL("./server/public-not-found.ts", import.meta.url)),
        ...[defaults].flat(),
      ];
    },
  },
  nitro: {
    rollupConfig: { plugins: [ogAssets] },
    externals: {
      external: ["@resvg/resvg-js"],
      traceInclude: [fileURLToPath(new URL("../../packages/db/migrate.mjs", import.meta.url))],
    },
  },
});
