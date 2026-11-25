import { MasteryLevel, scheduleReview, Verdict } from "@startodel/core";
import { and, eq, lte } from "drizzle-orm";
import type { Connection } from "./index.ts";
import { ownedId, referencedRow, type Transaction } from "./owned.ts";
import { topics, topicMastery, reviewItems } from "./schema.ts";

export async function recordReview(
  tx: Transaction,
  userId: string,
  topicId: string,
  verdict: Verdict,
  reason?: string,
) {
  // Serialize even the first two reviews, when there is no ReviewItem to lock yet.
  const [topic] = await tx
    .select({ id: topics.id })
    .from(topics)
    .where(ownedId(topics, userId, topicId))
    .for("no key update");
  if (!topic) return undefined;
  const [previous] = await tx
    .select({ box: reviewItems.box })
    .from(reviewItems)
    .where(and(eq(reviewItems.userId, userId), eq(reviewItems.topicId, topicId)));
  const now = new Date();
  const result = Verdict.parse(verdict);
  const values = {
    ...scheduleReview(previous ?? null, result, now),
    lastResult: result,
    reason: reason ?? null,
    lastReviewedAt: now,
  };
  return (
    await tx
      .insert(reviewItems)
      .values({ userId, topicId, ...values })
      .onConflictDoUpdate({
        target: [reviewItems.userId, reviewItems.topicId],
        set: { ...values, updatedAt: now },
      })
      .returning()
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
        .select()
        .from(reviewItems)
        .where(and(eq(reviewItems.userId, userId), lte(reviewItems.dueAt, now)))
        .orderBy(reviewItems.dueAt, reviewItems.topicId)
        .limit(limit);
    },
  };
}
