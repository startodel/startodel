export type ThemeChoice = "auto" | "light" | "dark";

/** The learner's theme choice. "auto" follows the operating system. */
export function useTheme() {
  return useCookie<ThemeChoice>("startodel-theme", {
    default: () => "auto",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
}
