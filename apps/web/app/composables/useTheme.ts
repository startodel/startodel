export type ThemeChoice = "auto" | "light" | "dark";

/** The learner's theme choice. "auto" follows the operating system. */
export function useTheme() {
  // A shared HTML response can read the theme without setting a default cookie.
  if (import.meta.server && useRoute().meta.layout === "site") {
    return ref(useCookie<ThemeChoice>("startodel-theme", { readonly: true }).value ?? "auto");
  }
  return useCookie<ThemeChoice>("startodel-theme", {
    default: () => "auto",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
}
