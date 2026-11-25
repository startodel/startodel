import { AnswerSource, DEFAULT_GRILL_SIZE, type MasteryLevel, Verdict } from "@startodel/core";
import { and, count, desc, eq, inArray, isNotNull, isNull, lte, max, sql } from "drizzle-orm";
import type { Database } from "./index.ts";
import { recordReview } from "./mastery.ts";
import { ownedId, referencedRow, referencedRows, type Transaction } from "./owned.ts";
import {
  grillQuestions,
  grillSessions,
  reviewItems,
  topicMastery,
  topics,
  tracks,
  trackTopics,
} from "./schema.ts";

type GrillInput = { trackId?: string | null; title: string; targetSize?: number };

export function grillsForUser(db: Database, userId: string) {
  const ownSessions = eq(grillSessions.userId, userId);
  const ownQuestions = eq(grillQuestions.userId, userId);
  const openSession = (id: string) =>
    and(ownedId(grillSessions, userId, id), eq(grillSessions.status, "open"));
  async function finishGrill(connection: Database | Transaction, id: string) {
    return (
      await connection
        .update(grillSessions)
        .set({
          status: "finished",
          finishedAt: sql`coalesce(${grillSessions.finishedAt},now())`,
          updatedAt: new Date(),
        })
        .where(ownedId(grillSessions, userId, id))
        .returning()
    )[0];
  }
  function insertGrill(
    connection: Database | Transaction,
    { trackId, title, targetSize = DEFAULT_GRILL_SIZE }: GrillInput,
  ) {
    return connection
      .insert(grillSessions)
      .values({ userId, trackId, title, targetSize })
      .returning();
  }
  function rankedCandidates(tx: Transaction, trackId: string | undefined, limit: number) {
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
  }
  async function addGrillQuestions(
    sessionId: string,
    questions: { prompt: string; topicId?: string | null }[],
  ) {
    return referencedRows(
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
          .values(
            questions.map(({ prompt, topicId }, i) => ({
              userId,
              sessionId,
              prompt,
              topicId,
              position: (last?.position ?? -1) + 1 + i,
            })),
          )
          .returning();
      }),
    );
  }
  async function submitAnswer(
    id: string,
    answer: string,
    source: AnswerSource,
    sessionId?: string,
  ) {
    return db.transaction(async (tx) => {
      const [session] = await tx
        .select({ status: grillSessions.status })
        .from(grillSessions)
        .innerJoin(
          grillQuestions,
          and(ownedId(grillQuestions, userId, id), eq(grillQuestions.sessionId, grillSessions.id)),
        )
        .where(and(ownSessions, sessionId ? eq(grillSessions.id, sessionId) : undefined))
        .for("share", { of: grillSessions });
      if (!session) return undefined;
      if (session.status === "finished") return "closed" as const;
      const now = new Date();
      const [saved] = await tx
        .update(grillQuestions)
        .set({ answer, answerSource: AnswerSource.parse(source), answeredAt: now, updatedAt: now })
        .where(
          and(
            ownedId(grillQuestions, userId, id),
            isNull(grillQuestions.judgedAt),
            source === "ui" ? isNull(grillQuestions.answeredAt) : undefined,
          ),
        )
        .returning();
      return saved ?? ("closed" as const);
    });
  }
  return {
    startGrill(input: GrillInput) {
      return referencedRow(insertGrill(db, input));
    },
    startGrillWithCandidates(input: GrillInput) {
      return referencedRow(
        db.transaction(async (tx) => {
          const [session] = await insertGrill(tx, input);
          if (!session) return [];
          const candidates = await rankedCandidates(
            tx,
            session.trackId ?? undefined,
            session.targetSize,
          );
          return [{ session, candidates }];
        }),
      );
    },
    addGrillQuestions,
    async addGrillQuestion(
      sessionId: string,
      question: { prompt: string; topicId?: string | null },
    ) {
      return (await addGrillQuestions(sessionId, [question]))?.[0];
    },
    async answerGrillQuestion(id: string, answer: string, source: AnswerSource) {
      const result = await submitAnswer(id, answer, source);
      return result === "closed" ? undefined : result;
    },
    submitSessionAnswer(sessionId: string, questionId: string, answer: string) {
      return submitAnswer(questionId, answer, "ui", sessionId);
    },
    listGrillSummaries() {
      return db
        .select({
          id: grillSessions.id,
          title: grillSessions.title,
          status: grillSessions.status,
          createdAt: grillSessions.createdAt,
          track: tracks.title,
          answered: count(grillQuestions.answeredAt),
          judged: count(grillQuestions.judgedAt),
          total: count(grillQuestions.id),
        })
        .from(grillSessions)
        .leftJoin(tracks, and(eq(tracks.userId, userId), eq(tracks.id, grillSessions.trackId)))
        .leftJoin(grillQuestions, and(ownQuestions, eq(grillQuestions.sessionId, grillSessions.id)))
        .where(ownSessions)
        .groupBy(grillSessions.id, tracks.id)
        .orderBy(
          desc(sql`${grillSessions.status} = 'open'`),
          desc(grillSessions.createdAt),
          grillSessions.id,
        );
    },
    reinforceTopics(sessionId: string) {
      return db
        .selectDistinct({ id: topics.id, title: topics.title, dueAt: reviewItems.dueAt })
        .from(grillQuestions)
        .innerJoin(topics, and(eq(topics.userId, userId), eq(topics.id, grillQuestions.topicId)))
        .leftJoin(
          reviewItems,
          and(eq(reviewItems.userId, userId), eq(reviewItems.topicId, topics.id)),
        )
        .where(
          and(
            ownQuestions,
            eq(grillQuestions.sessionId, sessionId),
            inArray(grillQuestions.verdict, ["weak", "partial"]),
          ),
        )
        .orderBy(topics.title, topics.id);
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
    finishGrill(id: string) {
      return finishGrill(db, id);
    },
    finishGrillWithSummary(id: string) {
      return db.transaction(async (tx) => {
        const session = await finishGrill(tx, id);
        if (!session) return undefined;
        const questions = await tx
          .select({ topicId: grillQuestions.topicId, verdict: grillQuestions.verdict })
          .from(grillQuestions)
          .where(and(ownQuestions, eq(grillQuestions.sessionId, id)))
          .orderBy(grillQuestions.position);
        const counts = { strong: 0, partial: 0, weak: 0, unjudged: 0 };
        const weakTopics = new Set<string>();
        for (const q of questions) {
          counts[q.verdict ?? "unjudged"]++;
          if (q.verdict === "weak" && q.topicId) weakTopics.add(q.topicId);
        }
        return { session, counts, weakTopics: [...weakTopics] };
      });
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
    listGrills(status?: "open" | "finished") {
      return db
        .select()
        .from(grillSessions)
        .where(and(ownSessions, status && eq(grillSessions.status, status)))
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
          return rankedCandidates(tx, trackId, limit);
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
  };
}
