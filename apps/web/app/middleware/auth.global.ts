import type { Track } from "@startodel/core";
import { isPublicPage } from "../../shared/public-pages";
import { basePath, localizedPath, pageLocale, languageCookie } from "../../shared/locale";
export default defineNuxtRouteMiddleware(async (to) => {
  const path = basePath(to.path);
  const target = (value: string) => localizedPath(value, pageLocale(to.path));
  const { session, loggedIn } = useUserSession();
  const redirectEntry = (value: string) =>
    navigateTo({ path: target(value), query: to.query, hash: to.hash });
  if (path === "/" && loggedIn.value) return redirectEntry("/dashboard");
  if (to.path === "/" && useCookie(languageCookie).value === "en")
    return navigateTo({ path: "/en", query: to.query, hash: to.hash });
  if (/^\/api(?:\/|$)/i.test(path)) return;
  if (isPublicPage(to.path)) {
    // Keep the sealed Session's contents out of public hydration payloads.
    if (import.meta.server) session.value = null;
    return;
  }
  // The design showcase holds no learner data. It is served only in development or behind a flag.
  if (
    isDesignShowcasePath(to.path) &&
    designShowcaseEnabled(import.meta.dev, useRuntimeConfig().public.designShowcase)
  ) {
    if (import.meta.server) session.value = null;
    return;
  }
  const me = useMe();
  if (!loggedIn.value) {
    me.value = undefined;
    if (/^\/login\/?$/.test(path)) return redirectEntry("/");
    return navigateTo(target("/"));
  }
  const account = await fetchMe();
  me.value = account;
  if (
    !account.onboarded &&
    !["/onboarding", "/onboarding/connect"].includes(path.replace(/\/$/, ""))
  ) {
    // A learner can start with a Fork before completing the questionnaire.
    if (/^\/tracks\/[^/]+\/?$/.test(path)) {
      const owned = await useRequestFetch()<Pick<Track, "forkedFromLogin">>(
        `/api/tracks/${encodeURIComponent(String(to.params.id))}`,
      ).catch(() => undefined);
      if (owned?.forkedFromLogin) return;
    }
    return navigateTo(target("/onboarding"));
  }
  if (/^\/login\/?$/.test(path)) return redirectEntry("/dashboard");
});
