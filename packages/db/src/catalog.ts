import { TopicSlug, type MasteryLevel } from "@startodel/core";
import {
  and,
  count,
  eq,
  getTableColumns,
  inArray,
  like,
  lt,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import type { Database } from "./index.ts";
import { ownedId, referencedRow, type Transaction } from "./owned.ts";
import {
  lessonProgress,
  lessons,
  topicEdges,
  topicMastery,
  topics,
  tracks,
  trackTopics,
} from "./schema.ts";

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

const level = sql<MasteryLevel>`coalesce(${topicMastery.level},0)`;

function blockedTopics(db: Database | Transaction, userId: string, memberIds?: string[]) {
  return db
    .selectDistinct({ id: topicEdges.toTopicId })
    .from(topicEdges)
    .leftJoin(
      topicMastery,
      and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topicEdges.fromTopicId)),
    )
    .where(
      and(
        eq(topicEdges.userId, userId),
        lt(level, 2),
        memberIds && inArray(topicEdges.toTopicId, memberIds),
      ),
    );
}

async function idsBySlug(tx: Transaction, userId: string, slugs: string[]) {
  const rows = await tx
    .select({ slug: topics.slug, id: topics.id })
    .from(topics)
    .where(and(eq(topics.userId, userId), inArray(topics.slug, slugs)))
    .for("key share");
  return new Map(rows.map((row) => [row.slug, row.id]));
}

type TopicInput = { slug: string; title: string; summary?: string | null };

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
  function upsertTopics(inputs: TopicInput[]) {
    // Validate even when called directly, and acquire conflicting rows in a stable order.
    const values = inputs
      .map(({ slug, title, summary }) => ({ slug: TopicSlug.parse(slug), title, summary, userId }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
    return db
      .insert(topics)
      .values(values)
      .onConflictDoUpdate({
        target: [topics.userId, topics.slug],
        setWhere: owned,
        set: {
          title: sql`excluded.title`,
          summary: sql`excluded.summary`,
          updatedAt: new Date(),
        },
      })
      .returning();
  }
  return {
    upsertTopics,
    async upsertTopic(input: TopicInput) {
      const [row] = await upsertTopics([input]);
      if (!row) throw new Error("Topic upsert did not return a Topic");
      return row;
    },
    listTopicsWithMastery(prefix = "") {
      return db
        .select({ ...getTableColumns(topics), level })
        .from(topics)
        .leftJoin(
          topicMastery,
          and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
        )
        .where(and(owned, like(topics.slug, prefix + "%")))
        .orderBy(topics.slug);
    },
    async relatedTopics(id: string) {
      const rows = await db
        .select({ topic: topics, fromId: topicEdges.fromTopicId })
        .from(topicEdges)
        .innerJoin(
          topics,
          and(
            owned,
            or(
              and(eq(topicEdges.fromTopicId, id), eq(topics.id, topicEdges.toTopicId)),
              and(eq(topicEdges.toTopicId, id), eq(topics.id, topicEdges.fromTopicId)),
            ),
          ),
        )
        .where(
          and(
            eq(topicEdges.userId, userId),
            or(eq(topicEdges.fromTopicId, id), eq(topicEdges.toTopicId, id)),
          ),
        )
        .orderBy(topics.slug);
      return {
        prerequisites: rows.filter((r) => r.fromId !== id).map((r) => r.topic),
        dependents: rows.filter((r) => r.fromId === id).map((r) => r.topic),
      };
    },
    suggestedTopics(limit: number) {
      return db
        .select({ id: topics.id, slug: topics.slug, title: topics.title, level })
        .from(topics)
        .leftJoin(
          topicMastery,
          and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
        )
        .where(
          and(
            owned,
            lt(level, 2),
            notInArray(topics.id, blockedTopics(db, userId)),
            inArray(
              topics.id,
              db
                .select({ id: trackTopics.topicId })
                .from(trackTopics)
                .where(eq(trackTopics.userId, userId)),
            ),
          ),
        )
        .orderBy(topics.slug)
        .limit(limit);
    },
    addEdges(edges: { from: string; to: string }[]) {
      return db.transaction(async (tx) => {
        const ids = await idsBySlug(
          tx,
          userId,
          edges.flatMap((e) => [e.from, e.to]),
        );
        const values = [];
        for (const edge of edges) {
          const fromTopicId = ids.get(edge.from);
          const toTopicId = ids.get(edge.to);
          if (!fromTopicId || !toTopicId) return undefined;
          values.push({ userId, fromTopicId, toTopicId });
        }
        await tx.insert(topicEdges).values(values).onConflictDoNothing();
        return { count: values.length };
      });
    },
    attachTopics(trackId: string, slugs: string[]) {
      return db.transaction(async (tx) => {
        const [track] = await tx
          .select({ id: tracks.id })
          .from(tracks)
          .where(ownedId(tracks, userId, trackId))
          .for("update");
        if (!track) return undefined;
        const ids = await idsBySlug(tx, userId, slugs);
        if (ids.size !== slugs.length) return undefined;
        const existing = await tx
          .select({ id: trackTopics.topicId })
          .from(trackTopics)
          .where(and(eq(trackTopics.userId, userId), eq(trackTopics.trackId, trackId)))
          .orderBy(trackTopics.position, trackTopics.topicId)
          .for("update");
        const order = new Set([
          ...slugs.map((slug) => ids.get(slug)!),
          ...existing.map((row) => row.id),
        ]);
        const values = Array.from(order, (topicId, position) => ({
          userId,
          trackId,
          topicId,
          position,
        }));
        await tx
          .insert(trackTopics)
          .values(values)
          .onConflictDoUpdate({
            target: [trackTopics.trackId, trackTopics.topicId],
            set: { position: sql`excluded.position`, updatedAt: new Date() },
            setWhere: and(
              eq(trackTopics.userId, userId),
              sql`${trackTopics.position} <> excluded.position`,
            ),
          });
        return values;
      });
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
              level,
              readCount: count(lessonProgress.readAt),
              lessonCount: count(lessons.id),
            })
            .from(trackTopics)
            .innerJoin(topics, and(owned, eq(topics.id, trackTopics.topicId)))
            .leftJoin(
              topicMastery,
              and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
            )
            .leftJoin(lessons, and(eq(lessons.userId, userId), eq(lessons.topicId, topics.id)))
            .leftJoin(
              lessonProgress,
              and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessons.id)),
            )
            .where(and(eq(trackTopics.userId, userId), eq(trackTopics.trackId, id)))
            .groupBy(topics.id, trackTopics.position, topicMastery.level)
            .orderBy(trackTopics.position, topics.slug);
          const memberIds = members.map((m) => m.topic.id);
          const edges = await edgesFor(tx, userId, memberIds);
          const blocked = new Set(
            (await blockedTopics(tx, userId, memberIds)).map((row) => row.id),
          );
          return {
            suggestedNextTopics: members
              .filter((m) => m.level < 2 && !blocked.has(m.topic.id))
              .map((m) => m.topic),
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
