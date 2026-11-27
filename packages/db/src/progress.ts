import { nextStudyTopic } from "./catalog.ts";
import { reviewsThrough } from "./practice.ts";
import { topicActivity } from "./activity.ts";
import { and, count, desc, eq, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import type { MasteryLevel } from "@startodel/core";
import type { Transaction } from "./owned.ts";
import type { Connection } from "./index.ts";
import {
  profiles,
  mcpTokens,
  tracks,
  trackTopics,
  topicMastery,
  topics,
  quizAttempts,
  grillSessions,
  grillQuestions,
  reviewItems,
} from "./schema.ts";

export function progressForUser(db: Connection, userId: string) {
  function openGrillCounts(tx: Transaction, trackId?: string) {
    return tx
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
        and(eq(grillQuestions.userId, userId), eq(grillQuestions.sessionId, grillSessions.id)),
      )
      .where(
        and(
          eq(grillSessions.userId, userId),
          eq(grillSessions.status, "open"),
          trackId ? eq(grillSessions.trackId, trackId) : undefined,
        ),
      )
      .groupBy(grillSessions.id)
      .orderBy(desc(grillSessions.createdAt), grillSessions.id);
  }
  async function dashboardNextStep(
    tx: Transaction,
    trackCount: number,
    dueCount: number,
    now: Date,
  ) {
    const [profile] = await tx
      .select({ onboardedAt: profiles.onboardedAt })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    if (!profile?.onboardedAt) return { kind: "onboarding" } as const;
    if (!trackCount) return { kind: "first-track" } as const;
    const grill = (await openGrillCounts(tx)).find(
      (g) => !g.questionCount || g.judged < g.questionCount,
    );
    if (grill)
      return {
        kind: "grill",
        id: grill.id,
        title: grill.title,
        unanswered: grill.questionCount - grill.answered,
        waiting: grill.answered - grill.judged,
      } as const;
    const topic = await nextStudyTopic(tx, userId, dueCount ? now : undefined);
    if (topic) return { kind: "study", topic } as const;
    if (dueCount) {
      const [review] = await reviewsThrough(tx, userId, now).limit(1);
      if (review)
        return {
          kind: "review",
          topicId: review.topicId,
          title: review.title,
          href: review.hasQuiz ? "/reviews/" + review.topicId + "/practice" : "/reviews",
        } as const;
    }
    return { kind: "plan" } as const;
  }
  async function dashboard(tx: Transaction, now = new Date()) {
    const perTrack = await tx
      .select({
        trackId: tracks.id,
        trackSlug: tracks.slug,
        language: tracks.language,
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
      and(eq(reviewItems.userId, userId), lte(reviewItems.dueAt, now)),
    );
    return { perTrack, dueReviewsCount };
  }
  return {
    getNextStepState(trackId?: string) {
      return db.transaction(
        async (tx) => {
          const membership = and(
            eq(trackTopics.userId, userId),
            trackId ? eq(trackTopics.trackId, trackId) : undefined,
          );
          const trackCount = await tx.$count(
            tracks,
            and(eq(tracks.userId, userId), trackId ? eq(tracks.id, trackId) : undefined),
          );
          const topicCount = trackId
            ? await tx.$count(trackTopics, membership)
            : await tx.$count(topics, eq(topics.userId, userId));
          const [due] = await tx
            .select({
              topicId: reviewItems.topicId,
              total: sql<number>`count(*) over ()`.mapWith(Number),
            })
            .from(reviewItems)
            .where(
              and(
                eq(reviewItems.userId, userId),
                lte(reviewItems.dueAt, new Date()),
                trackId
                  ? inArray(
                      reviewItems.topicId,
                      tx.select({ id: trackTopics.topicId }).from(trackTopics).where(membership),
                    )
                  : undefined,
              ),
            )
            .orderBy(reviewItems.dueAt, reviewItems.topicId)
            .limit(1);
          return { trackCount, topicCount, due, openGrills: await openGrillCounts(tx, trackId) };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
    getDashboard() {
      return db.transaction(
        async (tx) => {
          const now = new Date();
          const { perTrack, dueReviewsCount } = await dashboard(tx, now);
          const usedTokens = await tx
            .select({ id: mcpTokens.id })
            .from(mcpTokens)
            .where(
              and(
                eq(mcpTokens.userId, userId),
                isNull(mcpTokens.revokedAt),
                isNotNull(mcpTokens.lastUsedAt),
              ),
            )
            .limit(1);
          return {
            nextStep: await dashboardNextStep(tx, perTrack.length, dueReviewsCount, now),
            hasConnectedAgent: usedTokens.length > 0,
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
    getProgressOverview() {
      return db.transaction(
        async (tx) => {
          const { perTrack } = await dashboard(tx);
          const { perTopic, activity } = await topicActivity(tx, userId);
          const masteryDistribution = [0, 0, 0, 0, 0];
          for (const topic of perTopic)
            masteryDistribution[topic.level] = masteryDistribution[topic.level]! + 1;
          return { perTrack, perTopic, masteryDistribution, activity };
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
          const openGrills = await openGrillCounts(tx);
          return { masteryDistribution, perTrack, dueReviewsCount, recentQuizAttempts, openGrills };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
  };
}
