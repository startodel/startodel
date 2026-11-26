import { defineHandler, useRuntimeConfig } from "nuxt/server";
import { localizedPath } from "../../shared/locale";

export default defineHandler((event) => {
  const origin = new URL(useRuntimeConfig().oauth.github.redirectURL || event.req.url).origin;
  const privatePaths = [
    "/api/",
    "/dashboard",
    "/settings",
    "/onboarding",
    "/grills",
    "/reviews",
    "/progress",
    "/tracks/",
    "/lessons/",
    "/topics/",
  ];
  return new Response(
    [
      "User-agent: *",
      ...(["en", "ru"] as const).flatMap((locale) => [
        ...["/u/", "/terms", "/rules"].map((path) => "Allow: " + localizedPath(path, locale)),
        ...privatePaths.map((path) => "Disallow: " + localizedPath(path, locale)),
      ]),
      "Sitemap: " + origin + "/sitemap.xml",
      "",
    ].join("\n"),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
});
