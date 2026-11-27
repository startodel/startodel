import type { PublicBlock } from "@startodel/core";
import { expect, test } from "vite-plus/test";
import { lessonMinutes } from "../app/utils/lesson";

const words = (n: number) => "слово ".repeat(n);
test("Lesson time rounds 200 prose words per minute upwards with a one-minute minimum", () => {
  expect(lessonMinutes([])).toBe(1);
  const prose = (n: number): PublicBlock => ({ type: "theory", id: "intro", markdown: words(n) });
  expect(lessonMinutes([prose(1)])).toBe(1);
  expect(lessonMinutes([prose(400)])).toBe(2);
  expect(lessonMinutes([prose(401)])).toBe(3);
});

test("Lesson time includes reading and working through code, resources, Quizzes and Exercises", () => {
  const question = { prompt: "Which?", options: ["A", "B"] };
  expect(
    lessonMinutes([
      { type: "code", id: "code", code: "true", language: "js", explanation: words(200) },
    ]),
  ).toBe(2);
  expect(lessonMinutes([{ type: "quiz", id: "quiz", questions: [question, question] }])).toBe(3);
  expect(
    lessonMinutes([{ type: "exercise", id: "try", prompt: words(180), hints: [words(21)] }]),
  ).toBe(5);
  expect(
    lessonMinutes([
      { type: "link", id: "link", title: "docs", url: "https://example.org", note: words(100) },
      { type: "video", id: "video", title: "talk", url: "", note: words(50) },
      { type: "callout", id: "tip", variant: "tip", markdown: words(51) },
    ]),
  ).toBe(2);
});
