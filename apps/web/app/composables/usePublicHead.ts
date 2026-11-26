import { localizedPath } from "../../shared/locale";
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
) {
  const origin = usePublicOrigin().value;
  const { locale, t } = useI18n();
  const ru = origin + path;
  const en = origin + localizedPath(path, "en");
  const url = locale.value === "en" ? en : ru;
  const image =
    origin + "/og" + (path.startsWith("/u/") ? path : "/site") + ".png?lang=" + locale.value;
  const schema = structuredData?.((path) => origin + localizedPath(path, locale.value));
  useHead({
    title,
    script: schema
      ? [
          {
            type: "application/ld+json",
            key: "public-resource",
            innerHTML: JSON.stringify({
              "@context": "https://schema.org",
              url,
              ...schema,
            }).replaceAll("<", "\\u003c"),
          },
        ]
      : [],
    link: [
      { rel: "canonical", href: url },
      ...Object.entries({ ru, en, "x-default": ru }).map(([hreflang, href]) => ({
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
    ogLocale: locale.value === "ru" ? "ru_RU" : "en_US",
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
