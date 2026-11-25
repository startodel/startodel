import { AnswerSource, DEFAULT_GRILL_SIZE, type MasteryLevel, Verdict } from "@startodel/core";
import { and, desc, eq, inArray, isNotNull, lte, max, sql } from "drizzle-orm";
import type { Database } from "./index.ts";
import { recordReview } from "./mastery.ts";
import { ownedId, referencedRow } from "./owned.ts";
import {
  grillQuestions,
  grillSessions,
  reviewItems,
  topicMastery,
  topics,
  tracks,
  trackTopics,
} from "./schema.ts";

export function grillsForUser(db: Database, userId: string) {
  const ownSessions = eq(grillSessions.userId, userId);
  const ownQuestions = eq(grillQuestions.userId, userId);
  const openSession = (id: string) =>
    and(ownedId(grillSessions, userId, id), eq(grillSessions.status, "open"));
  return {
    startGrill({
      trackId,
      title,
      targetSize = DEFAULT_GRILL_SIZE,
    }: {
      trackId?: string | null;
      title: string;
      targetSize?: number;
    }) {
      return referencedRow(
        db.insert(grillSessions).values({ userId, trackId, title, targetSize }).returning(),
      );
    },
    addGrillQuestion(
      sessionId: string,
      { prompt, topicId }: { prompt: string; topicId?: string | null },
    ) {
      return referencedRow(
        db.transaction(async (tx) => {
          const [open] = await tx
            .select({ id: grillSessions.id })
            .from(grillSessions)
            .where(openSession(sessionId))
            .for("no key update");
          if (!open) return [];
          const [last] = await tx
            .select({ position: max(grillQuestions.position) })
            .from(grillQuestions)
            .where(and(ownQuestions, eq(grillQuestions.sessionId, sessionId)));
          return tx
            .insert(grillQuestions)
            .values({ userId, sessionId, prompt, topicId, position: (last?.position ?? -1) + 1 })
            .returning();
        }),
      );
    },
    answerGrillQuestion(id: string, answer: string, source: AnswerSource) {
      return db.transaction(async (tx) => {
        const [open] = await tx
          .select({ id: grillSessions.id })
          .from(grillSessions)
          .innerJoin(
            grillQuestions,
            and(
              ownedId(grillQuestions, userId, id),
              eq(grillSessions.id, grillQuestions.sessionId),
            ),
          )
          .where(and(ownSessions, eq(grillSessions.status, "open")))
          .for("share", { of: grillSessions });
        if (!open) return undefined;
        const now = new Date();
        return (
          await tx
            .update(grillQuestions)
            .set({
              answer,
              answerSource: AnswerSource.parse(source),
              answeredAt: now,
              updatedAt: now,
              verdict: null,
              judgedAt: null,
              feedback: null,
            })
            .where(ownedId(grillQuestions, userId, id))
            .returning()
        )[0];
      });
    },
    judgeGrillQuestion(id: string, verdict: Verdict, feedback?: string) {
      return db.transaction(async (tx) => {
        const answered = and(
          ownedId(grillQuestions, userId, id),
          isNotNull(grillQuestions.answeredAt),
        );
        const [previous] = await tx.select().from(grillQuestions).where(answered).for("update");
        if (!previous || (previous.verdict === verdict && previous.feedback === (feedback ?? null)))
          return previous;
        const now = new Date();
        const [question] = await tx
          .update(grillQuestions)
          .set({
            verdict: Verdict.parse(verdict),
            feedback: feedback ?? null,
            judgedAt: now,
            updatedAt: now,
          })
          .where(answered)
          .returning();
        if (question?.topicId && verdict !== "strong")
          await recordReview(tx, userId, question.topicId, verdict, feedback);
        return question;
      });
    },
    async finishGrill(id: string) {
      return (
        await db
          .update(grillSessions)
          .set({
            status: "finished",
            finishedAt: sql`coalesce(${grillSessions.finishedAt},now())`,
            updatedAt: new Date(),
          })
          .where(ownedId(grillSessions, userId, id))
          .returning()
      )[0];
    },
    getGrill(id: string) {
      return db.transaction(
        async (tx) => {
          const [session] = await tx
            .select()
            .from(grillSessions)
            .where(ownedId(grillSessions, userId, id));
          if (!session) return undefined;
          const questions = await tx
            .select()
            .from(grillQuestions)
            .where(and(ownQuestions, eq(grillQuestions.sessionId, id)))
            .orderBy(grillQuestions.position);
          return { ...session, questions };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
    listGrills() {
      return db
        .select()
        .from(grillSessions)
        .where(ownSessions)
        .orderBy(desc(grillSessions.createdAt), grillSessions.id);
    },
    grillCandidates({
      trackId,
      limit = DEFAULT_GRILL_SIZE,
    }: { trackId?: string; limit?: number } = {}) {
      return db.transaction(
        async (tx) => {
          if (trackId !== undefined) {
            const [track] = await tx
              .select({ id: tracks.id })
              .from(tracks)
              .where(ownedId(tracks, userId, trackId));
            if (!track) return undefined;
          }
          const members = trackId
            ? inArray(
                topics.id,
                tx
                  .select({ id: trackTopics.topicId })
                  .from(trackTopics)
                  .where(and(eq(trackTopics.userId, userId), eq(trackTopics.trackId, trackId))),
              )
            : undefined;
          const level = sql<MasteryLevel>`coalesce(${topicMastery.level},0)`;
          return tx
            .select({
              topicId: topics.id,
              slug: topics.slug,
              title: topics.title,
              level,
              reviewItem: reviewItems,
            })
            .from(topics)
            .leftJoin(
              reviewItems,
              and(
                eq(reviewItems.userId, userId),
                eq(reviewItems.topicId, topics.id),
                lte(reviewItems.dueAt, new Date()),
              ),
            )
            .leftJoin(
              topicMastery,
              and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
            )
            .where(and(eq(topics.userId, userId), members))
            .orderBy(sql`${reviewItems.dueAt} asc nulls last`, level, topics.slug)
            .limit(limit);
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
  };
}
