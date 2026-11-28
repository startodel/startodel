import { MasteryLevel, scheduleReview, Verdict } from "@startodel/core";
import { and, eq, lte } from "drizzle-orm";
import type { Connection } from "./index.ts";
import { ownedId, referencedRow, type Transaction } from "./owned.ts";
import { topics, topicMastery, reviewItems, reviewResults } from "./schema.ts";

// ReviewItem fields returned by the agent-facing operations.
export const reviewItemFields = {
  id: reviewItems.id,
  userId: reviewItems.userId,
  createdAt: reviewItems.createdAt,
  updatedAt: reviewItems.updatedAt,
  topicId: reviewItems.topicId,
  box: reviewItems.box,
  dueAt: reviewItems.dueAt,
  lastResult: reviewItems.lastResult,
  reason: reviewItems.reason,
  lastReviewedAt: reviewItems.lastReviewedAt,
};

export async function recordReview(
  tx: Transaction,
  userId: string,
  topicId: string,
  verdict: Verdict,
  note?: string | { correct: number; total: number },
  origin: "review" | "grill" = "review",
) {
  // Serialize even the first two reviews, when there is no ReviewItem to lock yet.
  const [topic] = await tx
    .select({ id: topics.id })
    .from(topics)
    .where(ownedId(topics, userId, topicId))
    .for("no key update");
  if (!topic) return undefined;
  const [previous] = await tx
    .select({ box: reviewItems.box, dueAt: reviewItems.dueAt })
    .from(reviewItems)
    .where(and(eq(reviewItems.userId, userId), eq(reviewItems.topicId, topicId)));
  const now = new Date();
  const result = Verdict.parse(verdict);
  const values = {
    ...scheduleReview(previous ?? null, result, now),
    lastResult: result,
    reason:
      typeof note === "object"
        ? `Practice Quiz: ${note.correct} of ${note.total} correct`
        : (note ?? null),
    practiceCorrect: typeof note === "object" ? note.correct : null,
    practiceTotal: typeof note === "object" ? note.total : null,
    lastReviewedAt: now,
  };
  if (origin === "review")
    await tx
      .insert(reviewResults)
      .values({ userId, topicId, createdAt: now, scheduledFor: previous?.dueAt, verdict: result });
  return (
    await tx
      .insert(reviewItems)
      .values({ userId, topicId, ...values })
      .onConflictDoUpdate({
        target: [reviewItems.userId, reviewItems.topicId],
        set: { ...values, updatedAt: now },
      })
      .returning(reviewItemFields)
  )[0];
}

export function masteryForUser(db: Connection, userId: string) {
  return {
    setMastery(topicId: string, level: MasteryLevel, evidence?: string) {
      const values = { level: MasteryLevel.parse(level), evidence: evidence ?? null };
      return referencedRow(
        db
          .insert(topicMastery)
          .values({ userId, topicId, ...values })
          .onConflictDoUpdate({
            target: [topicMastery.userId, topicMastery.topicId],
            set: { ...values, updatedAt: new Date() },
          })
          .returning(),
      );
    },
    async getMastery(topicId: string) {
      return (
        await db
          .select()
          .from(topicMastery)
          .where(and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topicId)))
      )[0];
    },
    recordReviewResult(topicId: string, verdict: Verdict, reason?: string) {
      return db.transaction((tx) => recordReview(tx, userId, topicId, verdict, reason));
    },
    listDueReviews(now: Date, limit: number) {
      return db
        .select(reviewItemFields)
        .from(reviewItems)
        .where(and(eq(reviewItems.userId, userId), lte(reviewItems.dueAt, now)))
        .orderBy(reviewItems.dueAt, reviewItems.topicId)
        .limit(limit);
    },
  };
}
