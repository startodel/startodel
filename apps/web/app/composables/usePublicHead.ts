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
  const url = new URL(path, usePublicOrigin().value).href;
  useHead({ title, link: [{ rel: "canonical", href: url }] });
  useSeoMeta({
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogType: type,
  });
}
