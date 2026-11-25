import { and, count, desc, eq, lte, sql } from "drizzle-orm";
import type { MasteryLevel } from "@startodel/core";
import type { Transaction } from "./owned.ts";
import type { Database } from "./index.ts";
import {
  tracks,
  trackTopics,
  topicMastery,
  topics,
  quizAttempts,
  grillSessions,
  grillQuestions,
  reviewItems,
} from "./schema.ts";

export function progressForUser(db: Database, userId: string) {
  async function dashboard(tx: Transaction) {
    const perTrack = await tx
      .select({
        trackId: tracks.id,
        title: tracks.title,
        total: count(trackTopics.topicId),
        completed: sql<number>`count(*) filter (where ${topicMastery.level} >= 2)`.mapWith(Number),
      })
      .from(tracks)
      .leftJoin(
        trackTopics,
        and(eq(trackTopics.userId, userId), eq(trackTopics.trackId, tracks.id)),
      )
      .leftJoin(
        topicMastery,
        and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, trackTopics.topicId)),
      )
      .where(eq(tracks.userId, userId))
      .groupBy(tracks.id)
      .orderBy(tracks.createdAt, tracks.id);
    const dueReviewsCount = await tx.$count(
      reviewItems,
      and(eq(reviewItems.userId, userId), lte(reviewItems.dueAt, new Date())),
    );
    return { perTrack, dueReviewsCount };
  }
  return {
    getDashboard() {
      return db.transaction(
        async (tx) => {
          const { perTrack, dueReviewsCount } = await dashboard(tx);
          return {
            dueReviewsCount,
            tracks: perTrack.map((track) => ({
              ...track,
              percent: track.total ? Math.floor((100 * track.completed) / track.total) : 0,
            })),
          };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
    getProgress() {
      return db.transaction(
        async (tx) => {
          const level = sql<MasteryLevel>`coalesce(${topicMastery.level},0)`;
          const distribution = await tx
            .select({ level, total: count() })
            .from(topics)
            .leftJoin(
              topicMastery,
              and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
            )
            .where(eq(topics.userId, userId))
            .groupBy(level);
          const masteryDistribution = [0, 0, 0, 0, 0];
          for (const row of distribution) masteryDistribution[row.level] = row.total;
          const { perTrack, dueReviewsCount } = await dashboard(tx);
          const recentQuizAttempts = await tx
            .select()
            .from(quizAttempts)
            .where(eq(quizAttempts.userId, userId))
            .orderBy(desc(quizAttempts.createdAt), quizAttempts.id)
            .limit(10);
          const openGrills = await tx
            .select({
              id: grillSessions.id,
              title: grillSessions.title,
              questionCount: count(grillQuestions.id),
              answered: count(grillQuestions.answeredAt),
              judged: count(grillQuestions.judgedAt),
            })
            .from(grillSessions)
            .leftJoin(
              grillQuestions,
              and(
                eq(grillQuestions.userId, userId),
                eq(grillQuestions.sessionId, grillSessions.id),
              ),
            )
            .where(and(eq(grillSessions.userId, userId), eq(grillSessions.status, "open")))
            .groupBy(grillSessions.id)
            .orderBy(desc(grillSessions.createdAt), grillSessions.id);
          return { masteryDistribution, perTrack, dueReviewsCount, recentQuizAttempts, openGrills };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
  };
}
