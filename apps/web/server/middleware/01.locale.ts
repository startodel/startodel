import { defineHandler, getRequestURL, sendRedirect } from "nuxt/server";
import { basePath, localizedPath } from "../../shared/locale";

export default defineHandler((event) => {
  const url = getRequestURL(event);
  const base = basePath(url.pathname);
  if (url.pathname === "/en" || url.pathname.startsWith("/en/")) {
    const status = event.req.method === "GET" || event.req.method === "HEAD" ? 301 : 308;
    return sendRedirect(event, base + url.search, status);
  }
  const path = base.replace(/\/$/, "");
  const alias = /^\/@([a-zA-Z0-9-]+)$/.exec(path);
  if (alias)
    return sendRedirect(
      event,
      localizedPath("/u/" + alias[1], url.pathname.startsWith("/ru/") ? "ru" : "en") + url.search,
      301,
    );
  const lang = url.searchParams.get("lang");
  if ((path === "/terms" || path === "/rules") && (lang === "ru" || lang === "en")) {
    url.searchParams.delete("lang");
    return sendRedirect(event, localizedPath(path, lang) + url.search, 301);
  }
});
