import { defineHandler, parseCookies, getRequestURL, useRuntimeConfig } from "nuxt/server";
import { basePath } from "../../shared/locale";
import { isPublicPage } from "../../shared/public-pages";

export default defineHandler((event) => {
  const { pathname } = getRequestURL(event);
  const path = basePath(pathname);
  const headers = event.res.headers;
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt" || pathname.startsWith("/og/")) {
    headers.set("cache-control", "public, max-age=300, stale-while-revalidate=3600");
  } else if (isPublicPage(pathname) || /^\/login\/?$/.test(path)) {
    headers.append("vary", "Cookie, Accept-Encoding");
    const cookies = parseCookies(event);
    const hasSession =
      Object.hasOwn(cookies, USER_SESSION_COOKIE_NAME) ||
      Object.hasOwn(cookies, useRuntimeConfig().session.name);
    headers.set(
      "cache-control",
      hasSession
        ? "private, no-store"
        : "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    );
  } else if (
    pathname.startsWith("/en/") ||
    path === "/" ||
    /^\/(settings|onboarding|tracks|lessons|topics|grills|reviews|progress|mcp|api)(\/|$)/i.test(
      path,
    )
  ) {
    headers.set("cache-control", "private, no-store");
  }
});
