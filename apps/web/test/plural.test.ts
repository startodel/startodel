import { expect, test } from "vite-plus/test";
import { russianPlural } from "../shared/locale";
import { createRequire } from "node:module";
import { blockOutlineTitle } from "../app/utils/lesson";
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
  expect(
    counts.map((count) => global.t("board.masteredOf", { count, n: String(count), total: 9 })),
  ).toEqual([
    "Темы: 1 из 9 освоена",
    "Темы: 2 из 9 освоены",
    "Темы: 5 из 9 освоено",
    "Темы: 0 из 9 освоено",
  ]);
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
  expect(global.t("count.ready", 1)).toBe("1 available");
  expect(global.t("count.blocked", 6)).toBe("6 locked");
});

test("Lesson headers and Quiz and Exercise outlines follow the interface locale", () => {
  const global = messages();
  const tags = () => ({
    tag: global.t("indexPrefix.lesson") + "03",
    topicTag: global.t("indexPrefix.topic") + "02",
    topicTitle: "Timers",
  });
  const quiz = (count: number) =>
    blockOutlineTitle(
      {
        type: "quiz",
        id: "q",
        questions: Array.from({ length: count }, () => ({ prompt: "?", options: ["A", "B"] })),
      },
      global.t,
    );
  const exercise = () =>
    blockOutlineTitle({ type: "exercise", id: "e", title: "Timers", prompt: "Try it" }, global.t);
  expect(global.t("lesson.kicker", tags())).toBe("Урок У03 · Т02 Timers");
  expect(global.t("lesson.minutes", { n: 3 })).toBe("3 мин");
  expect([1, 2, 5].map(quiz)).toEqual(["Тест · 1 вопрос", "Тест · 2 вопроса", "Тест · 5 вопросов"]);
  expect(exercise()).toBe("Задача: Timers");
  global.locale.value = "en";
  expect(global.t("lesson.kicker", tags())).toBe("Lesson L03 · T02 Timers");
  expect(global.t("lesson.minutes", { n: 3 })).toBe("3 min");
  expect([1, 2].map(quiz)).toEqual(["Quiz · 1 question", "Quiz · 2 questions"]);
  expect(exercise()).toBe("Exercise: Timers");
});

test("the outline uses authored titles, Markdown headings or compact opening text for legacy Blocks", () => {
  const global = messages();
  global.locale.value = "en";
  const t = global.t;
  const theory = {
    type: "theory" as const,
    id: "t",
    markdown: "Opening.\n\n## The [`timer`](https://example.org) **queue**",
  };
  expect(blockOutlineTitle(theory, t)).toBe("The timer queue");
  expect(blockOutlineTitle({ ...theory, markdown: "#\n\nStart here. Read more." }, t)).toBe(
    "Start here.",
  );
  expect(blockOutlineTitle({ ...theory, markdown: "# v1. What changed?" }, t)).toBe(
    "v1. What changed?",
  );
  expect(blockOutlineTitle({ ...theory, title: "Timers" }, t)).toBe("Timers");
  expect(blockOutlineTitle({ ...theory, markdown: "___" }, t)).toBe("Theory");
  expect(
    blockOutlineTitle(
      { type: "code", id: "c", title: "timers.cjs", language: "js", code: "setTimeout(fn)" },
      t,
    ),
  ).toBe("timers.cjs");
  expect(
    blockOutlineTitle({ type: "code", id: "c", language: "js", code: "setTimeout(fn)" }, t),
  ).toBe("setTimeout(fn)");
  expect(
    blockOutlineTitle(
      { type: "exercise", id: "e", prompt: "Measure the **lag**. Then compare." },
      t,
    ),
  ).toBe("Exercise: Measure the lag.");
  expect(
    blockOutlineTitle(
      { type: "callout", id: "c", variant: "tip", markdown: "Try a timer\nNext line" },
      t,
    ),
  ).toBe("Try a timer");
  const long = blockOutlineTitle({ ...theory, markdown: "Timer callbacks ".repeat(20) }, t);
  expect(long).toMatch(/^Timer callbacks .*…$/);
  expect(long.length).toBeLessThanOrEqual(52);
});
