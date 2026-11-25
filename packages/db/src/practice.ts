import { createHash, randomInt } from "node:crypto";
import { practiceVerdict, type MasteryLevel } from "@startodel/core";
import { and, eq, lte, sql } from "drizzle-orm";
import type { Connection } from "./index.ts";
import { ownedId, type Transaction } from "./owned.ts";
import { raiseMastery, recordQuizAttempt } from "./lessons.ts";
import { recordReview } from "./mastery.ts";
import { lessons, reviewItems, topicMastery, topics } from "./schema.ts";

type Submission = { lessonId: string; blockId: string; answers: number[] };

async function practiceContent(tx: Transaction, userId: string, topicId: string, lock: boolean) {
  if (lock) {
    const [topic] = await tx
      .select({ id: topics.id })
      .from(topics)
      .where(ownedId(topics, userId, topicId))
      .for("update");
    if (!topic) return;
  }
  const [item] = await tx
    .select({ title: topics.title, version: sql<string>`${reviewItems}.xmin::text` })
    .from(topics)
    .innerJoin(reviewItems, and(eq(reviewItems.userId, userId), eq(reviewItems.topicId, topics.id)))
    .where(ownedId(topics, userId, topicId));
  if (!item) return;
  const lessonQuery = tx
    .select({ id: lessons.id, blocks: lessons.blocks, version: sql<string>`${lessons}.xmin::text` })
    .from(lessons)
    .where(and(eq(lessons.userId, userId), eq(lessons.topicId, topicId)))
    .orderBy(lessons.id);
  const rows = await (lock ? lessonQuery.for("share") : lessonQuery);
  const quizzes = rows.flatMap((lesson) =>
    lesson.blocks.flatMap((block) =>
      block.type === "quiz" ? [{ lessonId: lesson.id, quiz: block }] : [],
    ),
  );
  if (!quizzes.length) return;
  const revision = createHash("sha256")
    .update(JSON.stringify([item.version, rows.map((row) => [row.id, row.version])]))
    .digest("hex");
  return { title: item.title, revision, quizzes };
}

export function practiceForUser(db: Connection, userId: string) {
  return {
    async listReviews(now = new Date()) {
      const rows = await db
        .select({
          topicId: topics.id,
          title: topics.title,
          level: sql<MasteryLevel>`coalesce(${topicMastery.level},0)`,
          box: reviewItems.box,
          dueAt: reviewItems.dueAt,
          lastResult: reviewItems.lastResult,
          reason: reviewItems.reason,
          practiceCorrect: reviewItems.practiceCorrect,
          practiceTotal: reviewItems.practiceTotal,
          hasQuiz: sql<boolean>`exists(select 1 from ${lessons} where ${lessons.userId}=${userId} and ${lessons.topicId}=${topics.id} and ${lessons.blocks} @> '[{"type":"quiz"}]'::jsonb)`,
        })
        .from(reviewItems)
        .innerJoin(topics, and(eq(topics.userId, userId), eq(topics.id, reviewItems.topicId)))
        .leftJoin(
          topicMastery,
          and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
        )
        .where(
          and(
            eq(reviewItems.userId, userId),
            lte(reviewItems.dueAt, new Date(now.getTime() + 7 * 86400000)),
          ),
        )
        .orderBy(reviewItems.dueAt, topics.id);
      return {
        due: rows.filter((r) => r.dueAt <= now),
        upcoming: rows.filter((r) => r.dueAt > now),
      };
    },
    getPractice(topicId: string) {
      return db.transaction(
        async (tx) => {
          const content = await practiceContent(tx, userId, topicId, false);
          if (!content) return;
          const questions = content.quizzes.flatMap(({ lessonId, quiz }) =>
            quiz.questions.map(({ prompt, options }, index) => ({
              lessonId,
              blockId: quiz.id,
              index,
              prompt,
              options,
            })),
          );
          for (let i = questions.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [questions[i], questions[j]] = [questions[j]!, questions[i]!];
          }
          return { title: content.title, revision: content.revision, questions };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
    submitPractice(topicId: string, revision: string, answers: Submission[]) {
      return db.transaction(async (tx) => {
        const content = await practiceContent(tx, userId, topicId, true);
        if (!content) return;
        if (content.revision !== revision) return "stale" as const;
        const submitted = new Map(answers.map((a) => [a.lessonId + "/" + a.blockId, a.answers]));
        const expected = new Set(
          content.quizzes.map(({ lessonId, quiz }) => lessonId + "/" + quiz.id),
        );
        if ([...submitted.keys()].some((key) => !expected.has(key))) return undefined;
        if (answers.length !== content.quizzes.length || submitted.size !== answers.length)
          throw new RangeError("Expected one submission per Quiz");
        const results = [];
        let correct = 0,
          total = 0;
        for (const { lessonId, quiz } of content.quizzes) {
          const choices = submitted.get(lessonId + "/" + quiz.id)!;
          const attempt = await recordQuizAttempt(tx, userId, lessonId, quiz, choices, "ui");
          correct += attempt.correct;
          total += attempt.total;
          results.push({ lessonId, blockId: quiz.id, perQuestion: attempt.perQuestion });
        }
        const mastery = await raiseMastery(tx, userId, topicId);
        const verdict = practiceVerdict(correct, total);
        const review = await recordReview(tx, userId, topicId, verdict, { correct, total });
        return {
          results,
          correct,
          total,
          verdict,
          box: review!.box,
          dueAt: review!.dueAt,
          mastery,
        };
      });
    },
  };
}
