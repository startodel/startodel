import { defineHandler, useRuntimeConfig } from "nuxt/server";
import { publicData } from "../lib/public-reader";
export default defineHandler(async (event) => {
  const origin = new URL(useRuntimeConfig().oauth.github.redirectURL || event.req.url).origin;
  const paths = new Map<string, string | undefined>([
    ["/rules", undefined],
    ["/terms", undefined],
  ]);
  for (const { login, slug, updatedAt } of await publicData().sitemap()) {
    const profile = "/u/" + encodeURIComponent(login);
    const date = updatedAt.toISOString();
    if ((paths.get(profile) ?? "") < date) paths.set(profile, date);
    paths.set(profile + "/" + encodeURIComponent(slug), date);
  }
  const urls = Array.from(paths, ([path, lastmod]) => {
    const loc = (origin + path)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
    return `<url><loc>${loc}</loc>${lastmod ? "<lastmod>" + lastmod + "</lastmod>" : ""}</url>`;
  });
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      urls.join("") +
      "</urlset>",
    { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" } },
  );
});
