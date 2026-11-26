import { defineHandler, useRuntimeConfig } from "nuxt/server";
import { localizedPath } from "../../shared/locale";
import { publicData } from "../lib/public-reader";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
export default defineHandler(async (event) => {
  const origin = new URL(useRuntimeConfig().oauth.github.redirectURL || event.req.url).origin;
  const paths = new Map<string, string | undefined>([
    ["/login", undefined],
    ["/rules", undefined],
    ["/terms", undefined],
  ]);
  for (const row of await publicData().sitemap()) {
    const profile = "/u/" + encodeURIComponent(row.login);
    if (!paths.has(profile)) paths.set(profile, undefined);
    if (!row.slug || !row.updatedAt) continue;
    const track = profile + "/" + encodeURIComponent(row.slug);
    const date = row.updatedAt.toISOString();
    if ((paths.get(profile) ?? "") < date) paths.set(profile, date);
    paths.set(track, date);
    if (row.lessonId)
      paths.set(
        track + "/lessons/" + encodeURIComponent(row.lessonId),
        row.lessonUpdatedAt?.toISOString(),
      );
  }
  const urls = Array.from(paths, ([path, lastmod]) => {
    const ru = escapeXml(origin + path);
    const en = escapeXml(origin + localizedPath(path, "en"));
    const links = Object.entries({ ru, en, "x-default": ru })
      .map(([lang, url]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}"/>`)
      .join("");
    return [ru, en]
      .map(
        (loc) =>
          `<url><loc>${loc}</loc>${lastmod ? "<lastmod>" + lastmod + "</lastmod>" : ""}${links}</url>`,
      )
      .join("");
  });
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
      urls.join("") +
      "</urlset>",
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
});
