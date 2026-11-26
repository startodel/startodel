import { fileURLToPath } from "node:url";

const privatePage = { headers: { "cache-control": "private, no-store" } };

export default defineNuxtConfig({
  compatibilityDate: "2026-11-25",
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
    externals: {
      traceInclude: [fileURLToPath(new URL("../../packages/db/migrate.mjs", import.meta.url))],
    },
  },
  routeRules: {
    "/en": privatePage,
    "/en/**": privatePage,
    "/u/**": privatePage,
    "/sitemap.xml": privatePage,
    "/terms": privatePage,
    "/rules": privatePage,
    "/": privatePage,
    "/settings": privatePage,
    "/login": privatePage,
    "/onboarding": privatePage,
    "/onboarding/**": privatePage,
    "/tracks/**": privatePage,
    "/lessons/**": privatePage,
    "/topics/**": privatePage,
    "/grills": privatePage,
    "/grills/**": privatePage,
    "/reviews": privatePage,
    "/reviews/**": privatePage,
    "/progress": privatePage,
    "/mcp": privatePage,
    "/api/**": privatePage,
  },
});
