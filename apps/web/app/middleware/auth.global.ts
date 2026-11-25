import type { Track } from "@startodel/core";
import { isPublicPage } from "../utils/public-pages";
export default defineNuxtRouteMiddleware(async (to) => {
  if (/^\/api(?:\/|$)/i.test(to.path)) return;
  if (isPublicPage(to.path)) {
    // Keep the sealed Session's contents out of public hydration payloads.
    if (import.meta.server) useUserSession().session.value = null;
    return;
  }
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
  ) {
    // A learner can start with a Fork before completing the questionnaire.
    if (to.name === "tracks-id") {
      const owned = await useRequestFetch()<Pick<Track, "forkedFromLogin">>(
        `/api/tracks/${encodeURIComponent(String(to.params.id))}`,
      ).catch(() => undefined);
      if (owned?.forkedFromLogin) return;
    }
    return navigateTo("/onboarding");
  }
  if (to.path === "/login") return navigateTo("/");
});
