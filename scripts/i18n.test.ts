import { expect, test } from "vite-plus/test";
import { checkMessages } from "./i18n.mjs";

test("reports missing, extra, empty, unknown and unused messages", () => {
  expect(
    checkMessages(
      { ui: { label: "Тема", missing: "Трек", empty: "", unused: "Урок" } },
      { ui: { label: "Topic", extra: "Extra", empty: "Empty", unused: "Lesson" } },
      ["ui.label", "ui.missing", "ui.empty", "ui.extra", "ui.unknown"],
    ),
  ).toEqual(
    expect.arrayContaining([
      "en: missing ui.missing",
      "ru: missing ui.extra",
      "ru: empty ui.empty",
      "unknown key ui.unknown",
      "unused key ui.unused",
    ]),
  );
});
