import { z } from "zod";

export const DEFAULT_GRILL_SIZE = 15;
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 16, 35] as const;
export const MASTERY_LABELS = ["don't know", "read", "apply", "explain", "internals"] as const;

const scale = z.literal([0, 1, 2, 3, 4]);
export const MasteryLevel = scale;
export type MasteryLevel = z.infer<typeof MasteryLevel>;
export const Verdict = z.enum(["strong", "partial", "weak"]);
export type Verdict = z.infer<typeof Verdict>;
export const AnswerSource = z.enum(["ui", "mcp"]);
export type AnswerSource = z.infer<typeof AnswerSource>;
export const ReviewSchedule = z.object({ box: scale, dueAt: z.date() });
export type ReviewSchedule = z.infer<typeof ReviewSchedule>;

export function scheduleReview(
  previous: { box: number } | null,
  result: Verdict,
  now: Date,
): ReviewSchedule {
  const current = scale.parse(previous?.box ?? 0);
  let box = current;
  if (result === "strong") box = scale.parse(Math.min(current + 1, 4));
  if (result === "weak") box = 0;
  return { box, dueAt: new Date(now.getTime() + REVIEW_INTERVAL_DAYS[box] * 86_400_000) };
}

export const COMPLETE_LEVEL = 2;

export function isTopicComplete(level: number, hasUnreadLessons: boolean) {
  return level >= COMPLETE_LEVEL && !hasUnreadLessons;
}

/** The highest level supported by the Topic's current reading and Quiz evidence. */
export function lessonMastery(lessons: number, read: number, quizzes: number, passed: number) {
  if (quizzes > 0 && passed === quizzes) return 2;
  if (lessons > 0 && read === lessons) return 1;
  return 0;
}

export function practiceVerdict(correct: number, total: number): Verdict {
  if (
    !Number.isInteger(total) ||
    !Number.isInteger(correct) ||
    total < 1 ||
    correct < 0 ||
    correct > total
  )
    throw new RangeError("Expected a score for a nonempty Practice Quiz");
  if (correct === total) return "strong";
  return correct * 2 >= total ? "partial" : "weak";
}
