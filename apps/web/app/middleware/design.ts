export default defineNuxtRouteMiddleware(() => {
  if (!designShowcaseEnabled(import.meta.dev, useRuntimeConfig().public.designShowcase))
    return abortNavigation(createError({ statusCode: 404, statusMessage: "Page not found" }));
});
