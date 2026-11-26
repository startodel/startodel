export function useBoardMotion() {
  return useCookie<boolean>("startodel-board-motion", {
    default: () => true,
    maxAge: 31536000,
    sameSite: "lax",
    path: "/",
  });
}
