import type { TrackLanguage } from "@startodel/core";

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

export function privateTrackPath(slug: string, locale: UiLocale = "en") {
  return localizedPath("/tracks/" + encodeURIComponent(slug), locale);
}

export function alternateUrls(origin: string, path: string) {
  const en = origin + localizedPath(path, "en");
  return { en, ru: origin + localizedPath(path, "ru"), "x-default": en };
}

/** Open Graph uses language_TERRITORY. Prefer an explicit region, then CLDR's likely region
 * (en → en_US, ru → ru_RU). Keep the language alone if CLDR has no region for it. */
export function openGraphLocale(tag: TrackLanguage) {
  const locale = new Intl.Locale(tag);
  const region = locale.region ?? locale.maximize().region;
  return region ? locale.language + "_" + region : locale.language;
}

const rules = new Intl.PluralRules("ru");
export function russianPlural(count: number) {
  const form = rules.select(count);
  return form === "one" ? 0 : form === "few" ? 1 : 2;
}
