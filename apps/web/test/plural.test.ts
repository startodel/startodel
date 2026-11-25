import { expect, test } from "vite-plus/test";
import { russianPlural } from "../shared/locale";
import { createRequire } from "node:module";
import en from "../i18n/locales/en.json";
import ru from "../i18n/locales/ru.json";
test("Russian count messages use one, few and many, including teens", () => {
  expect([1, 2, 5, 11, 21, 22, 25].map(russianPlural)).toEqual([0, 1, 2, 2, 0, 1, 2]);
});

// Exercise the same message engine and catalogs used by the Nuxt module.
const web = createRequire(new URL("../package.json", import.meta.url));
const { createI18n } = createRequire(web.resolve("@nuxtjs/i18n/package.json"))("vue-i18n");
test("Lesson counts render in the selected language", () => {
  const { global } = createI18n({
    legacy: false,
    locale: "ru",
    messages: { ru, en },
    pluralRules: { ru: russianPlural },
  });
  const counts = [1, 2, 5, 11, 21, 22, 25];
  expect(counts.map((n) => global.t("count.lessons", n))).toEqual([
    "1 урок",
    "2 урока",
    "5 уроков",
    "11 уроков",
    "21 урок",
    "22 урока",
    "25 уроков",
  ]);
  global.locale.value = "en";
  expect([0, 1, 2].map((n) => global.t("count.lessons", n))).toEqual([
    "0 Lessons",
    "1 Lesson",
    "2 Lessons",
  ]);
});
