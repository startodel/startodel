import { AnswerSource, LessonBlocks } from "@startodel/core";
import { and, eq } from "drizzle-orm";
import type { Database } from "./index.ts";
import { ownedId, referencedRow } from "./owned.ts";
import { lessons, lessonProgress, quizAttempts, topics } from "./schema.ts";

type LessonInput = {
  title: string;
  summary?: string | null;
  position: number;
  blocks?: LessonBlocks;
};
function lessonFields({ title, summary, position, blocks }: Partial<LessonInput>) {
  return {
    title,
    summary,
    position,
    blocks: blocks === undefined ? undefined : LessonBlocks.parse(blocks),
  };
}
export function lessonsForUser(db: Database, userId: string) {
  return {
    async createLesson(input: LessonInput & { topicId: string }) {
      const { title, position, topicId } = input;
      return referencedRow(
        db
          .insert(lessons)
          .values({ ...lessonFields(input), title, position, userId, topicId })
          .returning(),
      );
    },
    async updateLesson(id: string, patch: Partial<LessonInput>) {
      return (
        await db
          .update(lessons)
          .set({ ...lessonFields(patch), updatedAt: new Date() })
          .where(ownedId(lessons, userId, id))
          .returning()
      )[0];
    },
    async getLesson(id: string) {
      return (
        await db
          .select()
          .from(lessons)
          .where(ownedId(lessons, userId, id))
      )[0];
    },
    async listLessonsForTopic(topicId: string) {
      const rows = await db
        .select({ lesson: lessons })
        .from(topics)
        .leftJoin(lessons, and(eq(lessons.topicId, topics.id), eq(lessons.userId, userId)))
        .where(ownedId(topics, userId, topicId))
        .orderBy(lessons.position, lessons.id);
      if (!rows.length) return undefined;
      return rows.flatMap(({ lesson }) => (lesson ? [lesson] : []));
    },
    markLessonRead(lessonId: string) {
      const now = new Date();
      return referencedRow(
        db
          .insert(lessonProgress)
          .values({ userId, lessonId, readAt: now })
          .onConflictDoUpdate({
            target: [lessonProgress.userId, lessonProgress.lessonId],
            set: { readAt: now, updatedAt: now },
          })
          .returning(),
      );
    },
    recordQuizAttempt(lessonId: string, blockId: string, answers: number[], source: AnswerSource) {
      return db.transaction(async (tx) => {
        const [lesson] = await tx
          .select({ blocks: lessons.blocks })
          .from(lessons)
          .where(ownedId(lessons, userId, lessonId))
          .for("share");
        const quiz = lesson?.blocks.find((b) => b.id === blockId);
        if (quiz?.type !== "quiz") return undefined;
        const total = quiz.questions.length;
        if (
          answers.length !== total ||
          !quiz.questions.every((q, i) => {
            const index = answers[i];
            return (
              index !== undefined &&
              Number.isInteger(index) &&
              index >= 0 &&
              index < q.options.length
            );
          })
        )
          throw new RangeError("Expected one valid option index per Quiz question");
        const correct = quiz.questions.filter((q, i) => q.correctIndex === answers[i]).length;
        return (
          await tx
            .insert(quizAttempts)
            .values({
              userId,
              lessonId,
              blockId,
              answers,
              source: AnswerSource.parse(source),
              correct,
              total,
            })
            .returning()
        )[0];
      });
    },
  };
}
