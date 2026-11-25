export default defineNuxtConfig({
  compatibilityDate: "2026-11-25",
  typescript: { strict: true },
  modules: ["nuxt-auth-utils"],
  // Resolve the deployment's secret when the server starts, including after a build.
  runtimeConfig: { appSecret: "{{NUXT_SESSION_PASSWORD}}" },
  nitro: { experimental: { envExpansion: true } },
  routeRules: {
    "/": { headers: { "cache-control": "private, no-store" } },
    "/mcp": { headers: { "cache-control": "private, no-store" } },
    "/api/**": { headers: { "cache-control": "private, no-store" } },
  },
});
