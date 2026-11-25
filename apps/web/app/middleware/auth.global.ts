export default defineNuxtRouteMiddleware(async (to) => {
  if (/^\/api(?:\/|$)/i.test(to.path)) return;
  // The design showcase holds no learner data. It is served only in development or behind a flag.
  if (
    isDesignShowcasePath(to.path) &&
    designShowcaseEnabled(import.meta.dev, useRuntimeConfig().public.designShowcase)
  )
    return;
  const me = useMe();
  if (!useUserSession().loggedIn.value) {
    me.value = undefined;
    if (to.path !== "/login") return navigateTo("/login");
    return;
  }
  const account = await fetchMe();
  me.value = account;
  if (
    !account.onboarded &&
    !["/onboarding", "/onboarding/connect"].includes(to.path.replace(/\/$/, ""))
  )
    return navigateTo("/onboarding");
  if (to.path === "/login") return navigateTo("/");
});
