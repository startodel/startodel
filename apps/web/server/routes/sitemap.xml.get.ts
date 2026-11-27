import { defineHandler, useRuntimeConfig } from "nuxt/server";
import { alternateUrls } from "../../shared/locale";
import { publicData } from "../lib/public-reader";

import { escapeXml } from "../lib/xml";

export default defineHandler(async (event) => {
  const origin = new URL(useRuntimeConfig().oauth.github.redirectURL || event.req.url).origin;
  const translated = new Map<string, string | undefined>([
    ["/", undefined],
    ["/rules", undefined],
    ["/terms", undefined],
  ]);
  const content = new Map<string, string | undefined>();
  for (const row of await publicData().sitemap()) {
    const profile = "/u/" + encodeURIComponent(row.login);
    if (!translated.has(profile)) translated.set(profile, undefined);
    if (!row.slug || !row.updatedAt) continue;
    const track = profile + "/" + encodeURIComponent(row.slug);
    const date = row.updatedAt.toISOString();
    if ((translated.get(profile) ?? "") < date) translated.set(profile, date);
    content.set(track, date);
    if (row.lessonId)
      content.set(
        track + "/lessons/" + encodeURIComponent(row.lessonId),
        row.lessonUpdatedAt?.toISOString(),
      );
  }
  function entry(loc: string, lastmod?: string, links = "") {
    return `<url><loc>${escapeXml(loc)}</loc>${lastmod ? "<lastmod>" + lastmod + "</lastmod>" : ""}${links}</url>`;
  }
  const urls = Array.from(translated, ([path, lastmod]) => {
    const alternates = alternateUrls(origin, path);
    const links = Object.entries(alternates)
      .map(
        ([lang, url]) =>
          `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(url)}"/>`,
      )
      .join("");
    return [alternates.en, alternates.ru].map((url) => entry(url, lastmod, links)).join("");
  });
  for (const [path, lastmod] of content) urls.push(entry(origin + path, lastmod));
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
      urls.join("") +
      "</urlset>",
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
});
