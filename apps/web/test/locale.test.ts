import { expect, test } from "vite-plus/test";
import { basePath, localizedPath, openGraphLocale, pageLocale } from "../shared/locale";
import { createDisplayDate } from "../app/composables/useDisplayDate";

test("Grill list dates show the day and month in UTC, adding the year outside the current year", () => {
  const year = new Date().getUTCFullYear();
  for (const [locale, current, previous] of [
    ["en", "Nov 9", "Nov 9, " + (year - 1)],
    ["ru", "9 ноября", "9 ноября " + (year - 1) + " г."],
  ] as const) {
    const format = createDisplayDate(locale, "short");
    expect(format(year + "-11-10T01:00:00+02:00")).toBe(current);
    expect(format(year - 1 + "-11-09T12:00:00Z")).toBe(previous);
  }
});

test.each([
  ["/", "en", "/", "/", "/ru"],
  ["/ru", "ru", "/", "/", "/ru"],
  ["/dashboard", "en", "/dashboard", "/dashboard", "/ru/dashboard"],
  ["/ru/dashboard", "ru", "/dashboard", "/dashboard", "/ru/dashboard"],
  ["/en", "en", "/", "/", "/ru"],
  ["/en/dashboard", "en", "/dashboard", "/dashboard", "/ru/dashboard"],
  ["/rules", "en", "/rules", "/rules", "/ru/rules"],
])("%s resolves its locale, base path and both page URLs", (path, locale, base, en, ru) => {
  expect(pageLocale(path)).toBe(locale);
  expect(basePath(path)).toBe(base);
  expect(localizedPath(path, "en")).toBe(en);
  expect(localizedPath(path, "ru")).toBe(ru);
});

test.each([
  ["en", "en_US"],
  ["ru", "ru_RU"],
  ["pt-br", "pt_BR"],
  ["en-gb", "en_GB"],
  ["zh-hant", "zh_TW"],
  ["zxx", "zxx"],
])("%s has a content-language Open Graph locale", (tag, expected) => {
  expect(openGraphLocale(tag)).toBe(expected);
});
