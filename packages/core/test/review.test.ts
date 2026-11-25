import { expect, test } from "vite-plus/test";
import { lessonMastery, scheduleReview } from "@startodel/core";

test("a first weak result schedules tomorrow at the same instant", () => {
  expect(scheduleReview(null, "weak", new Date("2026-03-28T12:00:00Z"))).toEqual({
    box: 0,
    dueAt: new Date("2026-03-29T12:00:00Z"),
  });
});

test.each([
  [null, 1, 0],
  [0, 1, 0],
  [1, 2, 1],
  [2, 3, 2],
  [3, 4, 3],
  [4, 4, 4],
] as const)(
  "transitions from box %s use the interval of the resulting box",
  (start, strong, partial) => {
    const previous = start === null ? null : { box: start };
    const now = new Date("2026-01-01T13:30:00Z");
    const dates = ["01-02", "01-04", "01-08", "01-17", "02-05"];
    for (const [result, box] of [
      ["strong", strong],
      ["partial", partial],
      ["weak", 0],
    ] as const) {
      expect(scheduleReview(previous, result, now)).toEqual({
        box,
        dueAt: new Date(`2026-${dates[box]}T13:30:00Z`),
      });
    }
  },
);

test.each([
  [0, 0, 0, 0, 0],
  [2, 1, 0, 0, 0],
  [2, 2, 0, 0, 1],
  [2, 2, 2, 1, 1],
  [2, 0, 2, 2, 2],
])(
  "reading %s Lessons (%s read) and %s Quizzes (%s passed) supports level %s",
  (lessons, read, quizzes, passed, level) => {
    expect(lessonMastery(lessons!, read!, quizzes!, passed!)).toBe(level);
  },
);
