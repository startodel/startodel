import { TopicSlug, type MasteryLevel } from "@startodel/core";
import { and, count, eq, inArray, or, sql } from "drizzle-orm";
import type { Database } from "./index.ts";
import { ownedId, referencedRow, type Transaction } from "./owned.ts";
import { lessons, topicEdges, topicMastery, topics, tracks, trackTopics } from "./schema.ts";

function edgesFor(db: Database | Transaction, userId: string, ids?: string[]) {
  return db
    .select()
    .from(topicEdges)
    .where(
      and(
        eq(topicEdges.userId, userId),
        ids && and(inArray(topicEdges.fromTopicId, ids), inArray(topicEdges.toTopicId, ids)),
      ),
    )
    .orderBy(topicEdges.fromTopicId, topicEdges.toTopicId);
}

export function catalogForUser(db: Database, userId: string) {
  const owned = eq(topics.userId, userId);
  async function resolveTopic(tx: Transaction, ref: string) {
    const slug = eq(topics.slug, ref);
    const isId = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(ref);
    const [match] = await tx
      .select({ id: topics.id })
      .from(topics)
      .where(and(owned, isId ? or(eq(topics.id, ref), slug) : slug))
      .orderBy(isId ? sql`(${topics.id} = ${ref}) desc` : topics.id)
      .limit(1);
    return match?.id;
  }
  return {
    async upsertTopic({
      slug,
      title,
      summary,
    }: {
      slug: string;
      title: string;
      summary?: string | null;
    }) {
      const values = { slug: TopicSlug.parse(slug), title, summary: summary ?? null };
      const [row] = await db
        .insert(topics)
        .values({ ...values, userId })
        .onConflictDoUpdate({
          target: [topics.userId, topics.slug],
          set: { title, summary: values.summary, updatedAt: new Date() },
        })
        .returning();
      if (!row) throw new Error("Topic upsert did not return a Topic");
      return row;
    },
    async getTopic(id: string) {
      return (
        await db
          .select()
          .from(topics)
          .where(ownedId(topics, userId, id))
      )[0];
    },
    async getTopicBySlug(slug: string) {
      return (
        await db
          .select()
          .from(topics)
          .where(and(owned, eq(topics.slug, slug)))
      )[0];
    },
    listTopics() {
      return db.select().from(topics).where(owned).orderBy(topics.slug);
    },
    addEdge(from: string, to: string) {
      return referencedRow(
        db.transaction(async (tx) => {
          const fromTopicId = await resolveTopic(tx, from);
          const toTopicId = await resolveTopic(tx, to);
          if (!fromTopicId || !toTopicId || fromTopicId === toTopicId) return [];
          return tx
            .insert(topicEdges)
            .values({ userId, fromTopicId, toTopicId })
            .onConflictDoUpdate({
              target: [topicEdges.userId, topicEdges.fromTopicId, topicEdges.toTopicId],
              set: { updatedAt: new Date() },
            })
            .returning();
        }),
      );
    },
    removeEdge(from: string, to: string) {
      return db.transaction(async (tx) => {
        const fromId = await resolveTopic(tx, from);
        const toId = await resolveTopic(tx, to);
        if (!fromId || !toId) return undefined;
        return (
          await tx
            .delete(topicEdges)
            .where(
              and(
                eq(topicEdges.userId, userId),
                eq(topicEdges.fromTopicId, fromId),
                eq(topicEdges.toTopicId, toId),
              ),
            )
            .returning()
        )[0];
      });
    },
    listEdges(topicIds?: string[]) {
      return edgesFor(db, userId, topicIds);
    },
    attachTopicToTrack(trackId: string, topicId: string, position: number) {
      return referencedRow(
        db
          .insert(trackTopics)
          .values({ userId, trackId, topicId, position })
          .onConflictDoUpdate({
            target: [trackTopics.trackId, trackTopics.topicId],
            set: { position, updatedAt: new Date() },
            setWhere: eq(trackTopics.userId, userId),
          })
          .returning(),
      );
    },
    async detachTopicFromTrack(trackId: string, topicId: string) {
      return (
        await db
          .delete(trackTopics)
          .where(
            and(
              eq(trackTopics.userId, userId),
              eq(trackTopics.topicId, topicId),
              eq(trackTopics.trackId, trackId),
            ),
          )
          .returning()
      )[0];
    },
    getTrackGraph(id: string) {
      return db.transaction(
        async (tx) => {
          const [track] = await tx
            .select()
            .from(tracks)
            .where(ownedId(tracks, userId, id));
          if (!track) return undefined;
          const members = await tx
            .select({
              topic: topics,
              position: trackTopics.position,
              level: sql<MasteryLevel>`coalesce(${topicMastery.level},0)`,
              lessonCount: count(lessons.id),
            })
            .from(trackTopics)
            .innerJoin(topics, and(owned, eq(topics.id, trackTopics.topicId)))
            .leftJoin(
              topicMastery,
              and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
            )
            .leftJoin(lessons, and(eq(lessons.userId, userId), eq(lessons.topicId, topics.id)))
            .where(and(eq(trackTopics.userId, userId), eq(trackTopics.trackId, id)))
            .groupBy(topics.id, trackTopics.position, topicMastery.level)
            .orderBy(trackTopics.position, topics.slug);
          const edges = await edgesFor(
            tx,
            userId,
            members.map((m) => m.topic.id),
          );
          return {
            track,
            topics: members.map(({ topic, ...details }) => ({ ...topic, ...details })),
            edges,
          };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
  };
}
