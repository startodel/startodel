export type UiLocale = "ru" | "en";
export const languageCookie = "startodel_language";
export function pageLocale(path: string): UiLocale {
  return /^\/ru(?:\/|$)/.test(path) ? "ru" : "en";
}
export function basePath(path: string) {
  return path.replace(/^\/(?:ru|en)(?:\/+|$)/, "/");
}
export function localizedPath(path: string, locale: UiLocale) {
  const base = basePath(path);
  if (locale === "en") return base;
  return base === "/" ? "/ru" : "/ru" + base;
}

export function alternateUrls(origin: string, path: string) {
  const en = origin + localizedPath(path, "en");
  return { en, ru: origin + localizedPath(path, "ru"), "x-default": en };
}

const rules = new Intl.PluralRules("ru");
export function russianPlural(count: number) {
  const form = rules.select(count);
  return form === "one" ? 0 : form === "few" ? 1 : 2;
}
