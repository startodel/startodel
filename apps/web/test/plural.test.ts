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
function messages() {
  return createI18n({
    legacy: false,
    locale: "ru",
    messages: { ru, en },
    pluralRules: { ru: russianPlural },
  }).global;
}

test("Lesson counts render in the selected language", () => {
  const global = messages();
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

test("Track mastery and ready and blocked counts render in the active locale", () => {
  const global = messages();
  const counts = [1, 2, 5, 0];
  const totals = { done: "0", total: "7" };
  expect(global.t("track.mastered", totals)).toBe("Освоено: 0 из 7");
  expect(counts.map((count) => global.t("count.ready", { count, n: String(count) }))).toEqual([
    "1 доступна",
    "2 доступны",
    "5 доступно",
    "0 доступно",
  ]);
  expect(counts.map((count) => global.t("count.blocked", { count, n: String(count) }))).toEqual([
    "1 закрыта",
    "2 закрыты",
    "5 закрыто",
    "0 закрыто",
  ]);
  global.locale.value = "en";
  expect(global.t("track.mastered", totals)).toBe("Mastered: 0 of 7");
  expect(global.t("count.ready", 1)).toBe("1 ready");
  expect(global.t("count.blocked", 6)).toBe("6 blocked");
});
