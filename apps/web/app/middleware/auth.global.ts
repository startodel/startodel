import type { Track } from "@startodel/core";
import { isPublicPage } from "../utils/public-pages";
import { basePath, localizedPath, pageLocale, languageCookie } from "../../shared/locale";
export default defineNuxtRouteMiddleware(async (to) => {
  const path = basePath(to.path);
  const target = (value: string) => localizedPath(value, pageLocale(to.path));
  if (to.path === "/" && useCookie(languageCookie).value === "en")
    return navigateTo({ path: "/en", query: to.query, hash: to.hash });
  if (/^\/api(?:\/|$)/i.test(path)) return;
  if (isPublicPage(to.path)) {
    // Keep the sealed Session's contents out of public hydration payloads.
    if (import.meta.server) useUserSession().session.value = null;
    return;
  }
  // The design showcase holds no learner data. It is served only in development or behind a flag.
  if (
    isDesignShowcasePath(to.path) &&
    designShowcaseEnabled(import.meta.dev, useRuntimeConfig().public.designShowcase)
  ) {
    if (import.meta.server) useUserSession().session.value = null;
    return;
  }
  const me = useMe();
  if (!useUserSession().loggedIn.value) {
    me.value = undefined;
    if (path !== "/login") return navigateTo(target("/login"));
    return;
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
  if (path === "/login") return navigateTo(target("/"));
});
