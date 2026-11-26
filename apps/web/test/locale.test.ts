import { expect, test } from "vite-plus/test";
import { basePath, localizedPath, pageLocale } from "../shared/locale";

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
