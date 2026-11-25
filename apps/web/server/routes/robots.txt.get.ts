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
      ...["", "/en"].flatMap((prefix) => [
        ...["/u/", "/terms", "/rules", "/login"].map((path) => "Allow: " + prefix + path),
        ...privatePaths.map((path) => "Disallow: " + prefix + path),
      ]),
      "Sitemap: " + origin + "/sitemap.xml",
      "",
    ].join("\n"),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
});
