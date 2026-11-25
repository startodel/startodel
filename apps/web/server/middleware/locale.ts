import { defineHandler, getRequestURL, sendRedirect } from "nuxt/server";
import { basePath, localizedPath } from "../../shared/locale";

export default defineHandler((event) => {
  const url = getRequestURL(event);
  const path = basePath(url.pathname).replace(/\/$/, "");
  const lang = url.searchParams.get("lang");
  if ((path === "/terms" || path === "/rules") && (lang === "ru" || lang === "en")) {
    url.searchParams.delete("lang");
    return sendRedirect(event, localizedPath(path, lang) + url.search, 301);
  }
});
