import { AnswerSource, lessonMastery, LessonBlocks } from "@startodel/core";
import { and, desc, eq, max, sql } from "drizzle-orm";
import type { Database } from "./index.ts";
import { ownedId, referencedRow, type Transaction } from "./owned.ts";
import { lessons, lessonProgress, quizAttempts, topicMastery, topics } from "./schema.ts";

type LessonInput = {
  title: string;
  summary?: string | null;
  position?: number;
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
// Serialize evidence for every Lesson of the Topic, including its first Mastery update.
async function lockLessonTopic(tx: Transaction, userId: string, lessonId: string) {
  const [row] = await tx
    .select({ topicId: topics.id })
    .from(lessons)
    .innerJoin(topics, and(eq(topics.userId, userId), eq(topics.id, lessons.topicId)))
    .where(ownedId(lessons, userId, lessonId))
    .for("no key update", { of: topics });
  return row?.topicId;
}

async function raiseMastery(tx: Transaction, userId: string, topicId: string) {
  const inTopic = and(eq(lessons.userId, userId), eq(lessons.topicId, topicId));
  const rows = await tx
    .select({
      id: lessons.id,
      readAt: lessonProgress.readAt,
      quizIds: sql<
        string[]
      >`array(select block->>'id' from jsonb_array_elements(${lessons.blocks}) block where block->>'type' = 'quiz')`,
    })
    .from(lessons)
    .leftJoin(
      lessonProgress,
      and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessons.id)),
    )
    .where(inTopic);
  const latest = await tx
    .selectDistinctOn([quizAttempts.lessonId, quizAttempts.blockId], {
      lessonId: quizAttempts.lessonId,
      blockId: quizAttempts.blockId,
      passed: sql<boolean>`${quizAttempts.correct} = ${quizAttempts.total}`,
    })
    .from(quizAttempts)
    .innerJoin(lessons, and(inTopic, eq(lessons.id, quizAttempts.lessonId)))
    .where(eq(quizAttempts.userId, userId))
    .orderBy(
      quizAttempts.lessonId,
      quizAttempts.blockId,
      desc(quizAttempts.createdAt),
      desc(quizAttempts.id),
    );
  const passed = new Set(latest.filter((a) => a.passed).map((a) => a.lessonId + "/" + a.blockId));
  const quizzes = rows.flatMap((row) => row.quizIds.map((id) => row.id + "/" + id));
  const level = lessonMastery(
    rows.length,
    rows.filter((r) => r.readAt).length,
    quizzes.length,
    quizzes.filter((id) => passed.has(id)).length,
  );
  if (level > 0) {
    await tx
      .insert(topicMastery)
      .values({ userId, topicId, level })
      .onConflictDoUpdate({
        target: [topicMastery.userId, topicMastery.topicId],
        set: { level, evidence: null, updatedAt: new Date() },
        setWhere: and(eq(topicMastery.userId, userId), sql`${topicMastery.level} < ${level}`),
      });
  }
  const [assessment] = await tx
    .select({ level: topicMastery.level })
    .from(topicMastery)
    .where(and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topicId)));
  return assessment?.level ?? 0;
}
export function lessonsForUser(db: Database, userId: string) {
  return {
    async createLesson(input: LessonInput & { topicId: string }) {
      const { title, position, topicId } = input;
      const fields = lessonFields(input);
      if (position !== undefined) {
        return referencedRow(
          db
            .insert(lessons)
            .values({ ...fields, title, userId, topicId, position })
            .returning(),
        );
      }
      return db.transaction(async (tx) => {
        const [topic] = await tx
          .select({ id: topics.id })
          .from(topics)
          .where(ownedId(topics, userId, topicId))
          .for("update");
        if (!topic) return undefined;
        const [last] = await tx
          .select({ position: max(lessons.position) })
          .from(lessons)
          .where(and(eq(lessons.userId, userId), eq(lessons.topicId, topicId)));
        return (
          await tx
            .insert(lessons)
            .values({ ...fields, title, userId, topicId, position: (last?.position ?? -1) + 1 })
            .returning()
        )[0];
      });
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
    async getLessonDetails(id: string) {
      const [row] = await db
        .select({
          lesson: lessons,
          topic: { id: topics.id, title: topics.title },
          readAt: lessonProgress.readAt,
          mastery: sql<number>`coalesce(${topicMastery.level},0)`,
        })
        .from(lessons)
        .innerJoin(topics, and(eq(topics.userId, userId), eq(topics.id, lessons.topicId)))
        .leftJoin(
          lessonProgress,
          and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessons.id)),
        )
        .leftJoin(
          topicMastery,
          and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
        )
        .where(ownedId(lessons, userId, id));
      return row;
    },
    listLessonSummaries(topicId: string) {
      return db
        .select({
          id: lessons.id,
          title: lessons.title,
          summary: lessons.summary,
          position: lessons.position,
          readAt: lessonProgress.readAt,
        })
        .from(lessons)
        .leftJoin(
          lessonProgress,
          and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessons.id)),
        )
        .where(and(eq(lessons.userId, userId), eq(lessons.topicId, topicId)))
        .orderBy(lessons.position, lessons.id);
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
      return db.transaction(async (tx) => {
        const topicId = await lockLessonTopic(tx, userId, lessonId);
        if (!topicId) return undefined;
        const now = new Date();
        const [progress] = await tx
          .insert(lessonProgress)
          .values({ userId, lessonId, readAt: now })
          .onConflictDoUpdate({
            target: [lessonProgress.userId, lessonProgress.lessonId],
            set: { readAt: now, updatedAt: now },
          })
          .returning();
        return { ...progress!, mastery: await raiseMastery(tx, userId, topicId) };
      });
    },
    recordQuizAttempt(lessonId: string, blockId: string, answers: number[], source: AnswerSource) {
      return db.transaction(async (tx) => {
        const topicId = await lockLessonTopic(tx, userId, lessonId);
        if (!topicId) return undefined;
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
        const perQuestion = quiz.questions.map((q, i) => q.correctIndex === answers[i]);
        const correct = perQuestion.filter(Boolean).length;
        const [attempt] = await tx
          .insert(quizAttempts)
          .values({
            userId,
            lessonId,
            blockId,
            answers,
            source: AnswerSource.parse(source),
            createdAt: sql`clock_timestamp()`,
            correct,
            total,
          })
          .returning();
        return { ...attempt!, perQuestion, mastery: await raiseMastery(tx, userId, topicId) };
      });
    },
  };
}
