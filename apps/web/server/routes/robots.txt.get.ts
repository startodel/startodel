import { defineHandler, useRuntimeConfig } from "nuxt/server";
export default defineHandler((event) => {
  const origin = new URL(useRuntimeConfig().oauth.github.redirectURL || event.req.url).origin;
  const privatePaths = [
    "/api/",
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
      "Allow: /u/",
      "Allow: /terms",
      "Allow: /rules",
      ...privatePaths.map((path) => "Disallow: " + path),
      "Sitemap: " + origin + "/sitemap.xml",
      "",
    ].join("\n"),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
});
