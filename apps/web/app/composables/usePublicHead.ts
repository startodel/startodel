import type { TrackLanguage } from "@startodel/core";
import { alternateUrls, localizedPath, openGraphLocale } from "../../shared/locale";
export function usePublicOrigin() {
  return useState("public-origin", () => {
    const callback = import.meta.server ? useRuntimeConfig().oauth.github.redirectURL : "";
    return new URL(callback || useRequestURL().href).origin;
  });
}
export function usePublicHead(
  title: string,
  description: string,
  path: string,
  type: "website" | "article" | "profile" = "website",
  structuredData?: (pageUrl: (path: string) => string) => Record<string, unknown>,
  contentLanguage?: TrackLanguage,
) {
  const origin = usePublicOrigin().value;
  const { locale, t } = useI18n();
  const alternates = contentLanguage ? [] : Object.entries(alternateUrls(origin, path));
  const pageUrl = (path: string) =>
    origin + (contentLanguage ? path : localizedPath(path, locale.value));
  const url = pageUrl(path);
  const image =
    origin + "/og" + (path.startsWith("/u/") ? path : "/site") + ".png?lang=" + locale.value;
  const schema = structuredData?.(pageUrl);
  useHead({
    title,
    htmlAttrs: contentLanguage ? { lang: contentLanguage } : undefined,
    script: schema
      ? [
          {
            type: "application/ld+json",
            key: "public-resource",
            innerHTML: JSON.stringify({
              "@context": "https://schema.org",
              url,
              inLanguage: contentLanguage,
              ...schema,
            }).replaceAll("<", "\\u003c"),
          },
        ]
      : [],
    link: [
      { rel: "canonical", href: url },
      ...alternates.map(([hreflang, href]) => ({
        rel: "alternate" as const,
        type: "text/html",
        hreflang,
        href,
      })),
    ],
  });
  useSeoMeta({
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogLocale: openGraphLocale(contentLanguage ?? locale.value),
    ogType: type,
    ogSiteName: () => t("brand"),
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: "summary_large_image",
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  });
}
