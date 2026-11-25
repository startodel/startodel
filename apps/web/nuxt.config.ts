import { fileURLToPath } from "node:url";

const privatePage = { headers: { "cache-control": "private, no-store" } };

export default defineNuxtConfig({
  compatibilityDate: "2026-11-25",
  typescript: { strict: true },
  modules: ["nuxt-auth-utils"],
  // Resolve the deployment's secret when the server starts, including after a build.
  runtimeConfig: { appSecret: "{{NUXT_SESSION_PASSWORD}}" },
  nitro: {
    experimental: { envExpansion: true },
    externals: {
      traceInclude: [fileURLToPath(new URL("../../packages/db/migrate.mjs", import.meta.url))],
    },
  },
  routeRules: {
    "/": privatePage,
    "/settings": privatePage,
    "/login": privatePage,
    "/onboarding": privatePage,
    "/onboarding/**": privatePage,
    "/tracks/**": privatePage,
    "/lessons/**": privatePage,
    "/mcp": privatePage,
    "/api/**": privatePage,
  },
});
