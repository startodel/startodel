export default defineNuxtRouteMiddleware(async (to) => {
  if (/^\/api(?:\/|$)/i.test(to.path)) return;
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
