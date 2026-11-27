import { isUuid, TrackSlug, type Track } from "@startodel/core";
import { isPublicPage } from "../../shared/public-pages";
import {
  basePath,
  localizedPath,
  pageLocale,
  languageCookie,
  privateTrackPath,
} from "../../shared/locale";
export default defineNuxtRouteMiddleware(async (to) => {
  const path = basePath(to.path);
  if (/^\/api(?:\/|$)/i.test(path)) return;
  if (!to.matched.length) {
    // Let Nuxt raise its route 404 and serve the same document to browsers and crawlers.
    if (import.meta.server) useRequestEvent()!.context.unmatchedPage = true;
    return;
  }
  const locale =
    to.path === "/" && useCookie(languageCookie).value === "ru" ? "ru" : pageLocale(to.path);
  const target = (value: string) => localizedPath(value, locale);
  const { session, loggedIn } = useUserSession();
  const redirectEntry = (value: string) =>
    navigateTo({ path: target(value), query: to.query, hash: to.hash });
  if (path === "/" && loggedIn.value) return redirectEntry("/dashboard");
  if (to.path === "/" && locale === "ru") return redirectEntry("/");
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
    return navigateTo(target("/"), { external: true, redirectCode: 302 });
  }
  const account = await fetchMe();
  me.value = account;
  const ref = to.params.slug;
  if (
    /^\/tracks\/[^/]+\/?$/.test(path) &&
    typeof ref === "string" &&
    (isUuid(ref) || (!account.onboarded && TrackSlug.safeParse(ref).success))
  ) {
    const owned = await useRequestFetch()<Pick<Track, "id" | "slug" | "forkedFromLogin">>(
      `/api/tracks/${encodeURIComponent(ref)}`,
    ).catch((error) => {
      if (error.statusCode !== 404) throw error;
    });
    // A learner can start with a Fork before completing the questionnaire.
    if (owned && (account.onboarded || owned.forkedFromLogin)) {
      if (owned.id === ref.toLowerCase() && owned.slug !== ref) {
        // A document redirect preserves the bookmark's original query encoding and repeated keys.
        const tail = import.meta.server
          ? useRequestURL().search
          : to.fullPath.slice(to.path.length);
        return navigateTo(privateTrackPath(owned.slug, locale) + tail, {
          external: true,
          redirectCode: 301,
          replace: true,
        });
      }
      return;
    }
  }
  if (
    !account.onboarded &&
    !["/onboarding", "/onboarding/connect"].includes(path.replace(/\/$/, ""))
  )
    return navigateTo(target("/onboarding"));
  if (/^\/login\/?$/.test(path)) return redirectEntry("/dashboard");
});
