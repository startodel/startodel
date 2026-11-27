import { expect, test } from "vite-plus/test";
import {
  Block,
  LessonBlocks,
  TopicSlug,
  TrackSources,
  TrackLanguage,
  ProfileQuestionnaire,
} from "@startodel/core";

const question = { prompt: "Which?", options: ["first", "second"], correctIndex: 1 };
test("a Quiz accepts one to ten questions with zero-based indices into their own options", () => {
  const accepts = (length: number, correctIndex: number) =>
    Block.safeParse({
      type: "quiz",
      id: "practice",
      questions: Array.from({ length }, () => ({ ...question, correctIndex })),
    }).success;
  for (let length = 1; length <= 10; length++) expect(accepts(length, 1)).toBe(true);
  expect(accepts(1, 0)).toBe(true);
  expect(accepts(0, 0)).toBe(false);
  expect(accepts(11, 0)).toBe(false);
  expect(accepts(1, -1)).toBe(false);
  expect(accepts(1, 2)).toBe(false);
});

test.each([
  ["theory", { markdown: "Text" }, { markdown: "" }],
  [
    "code",
    { language: "ts", code: "true", explanation: "A boolean" },
    { language: "", code: "true" },
  ],
  ["callout", { variant: "tip", markdown: "Try this" }, { variant: "warn", markdown: "Warning" }],
  ["link", { title: "Docs", url: "http://example.org" }, { title: "Docs", url: "file:///etc" }],
  [
    "video",
    { title: "Talk", url: "https://www.youtube.com/watch?v=abc" },
    { title: "Talk", url: "https://youtube.com.example/watch?v=abc" },
  ],
  ["quiz", { questions: [question] }, { questions: [{ ...question, correctIndex: 2 }] }],
  ["exercise", { prompt: "Try it", solution: "Done", hints: ["Hint"] }, { prompt: "Try it" }],
])("validates %s Blocks", (type, valid, invalid) => {
  expect(Block.safeParse({ id: "one", type, ...valid }).success).toBe(true);
  expect(Block.safeParse({ id: "one", type, ...invalid }).success).toBe(false);
});

test("recognizes only the supported YouTube video URLs", () => {
  const valid = [
    "https://youtu.be/abc",
    "https://youtube.com/shorts/abc",
    "https://youtube.com/watch?v=abc",
  ];
  const invalid = [
    "https://example.org/watch?v=abc",
    "https://youtube.com/watch?v=",
    "https://youtu.be/",
    "https://youtube.com/channel/abc",
    "invalid",
  ];
  const accepts = (url: string) =>
    Block.safeParse({ type: "video", id: "v", title: "Video", url }).success;
  expect(valid.every(accepts)).toBe(true);
  expect(invalid.some(accepts)).toBe(false);
});

test("bounds the ordered Lesson Blocks and requires unique stable ids", () => {
  const block = { type: "theory", id: "A_1-b", markdown: "Text" };
  expect(LessonBlocks.safeParse([block, block]).success).toBe(false);
  expect(LessonBlocks.safeParse([{ ...block, id: "x/y" }]).success).toBe(false);
  expect(
    LessonBlocks.safeParse(Array.from({ length: 201 }, (_, i) => ({ ...block, id: String(i) })))
      .success,
  ).toBe(false);
});

test("validates catalog slugs, repository and documentation links, and experience", () => {
  expect(TopicSlug.parse("react/use-transition")).toBe("react/use-transition");
  for (const slug of ["React", "x//y", "x-", "x".repeat(121)])
    expect(TopicSlug.safeParse(slug).success).toBe(false);
  expect(
    TrackSources.parse({ repo: "https://github.com/startodel/startodel", docs: [] }),
  ).toBeDefined();
  for (const repo of [
    "http://github.com/o/r",
    "https://github.com/o/r/issues",
    "https://github.com.example/o/r",
  ])
    expect(TrackSources.safeParse({ repo }).success).toBe(false);
  expect(TrackSources.safeParse({ docs: Array(21).fill("https://example.org") }).success).toBe(
    false,
  );
  expect(ProfileQuestionnaire.shape.yearsOfExperience.safeParse(61).success).toBe(false);
});

test("Track language accepts lowercase language tags and rejects malformed or freeform input", () => {
  for (const tag of ["en", "ru", "pt-br", "zh-hant-tw", "fil"])
    expect(TrackLanguage.parse(tag)).toBe(tag);
  for (const tag of [
    "EN",
    "",
    "English",
    "english",
    "pt-BR",
    " en",
    "en_US",
    "en--us",
    "en/ru",
    "en-u",
    "en\n",
  ])
    expect(TrackLanguage.safeParse(tag).success, tag).toBe(false);
});
