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
) {
  const origin = usePublicOrigin().value;
  const { locale } = useI18n();
  const ru = origin + path;
  const en = origin + localizedPath(path, "en");
  const url = locale.value === "en" ? en : ru;
  useHead({
    title,
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
  });
}
