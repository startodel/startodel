export type UiLocale = "ru" | "en";
export const languageCookie = "startodel_language";
export function pageLocale(path: string): UiLocale {
  return /^\/en(?:\/|$)/.test(path) ? "en" : "ru";
}
export function basePath(path: string) {
  return path.replace(/^\/en(?=\/|$)/, "") || "/";
}
export function localizedPath(path: string, locale: UiLocale) {
  return locale === "ru" ? path : path === "/" ? "/en" : "/en" + path;
}

const rules = new Intl.PluralRules("ru");
export function russianPlural(count: number) {
  const form = rules.select(count);
  return form === "one" ? 0 : form === "few" ? 1 : 2;
}
