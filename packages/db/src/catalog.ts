import { trackTopicOrder } from "./track-order.ts";
import { forkCount, forkedFrom } from "./public.ts";
import { TopicSlug, type MasteryLevel } from "@startodel/core";
import {
  and,
  count,
  eq,
  exists,
  notExists,
  getTableColumns,
  inArray,
  like,
  lt,
  lte,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import type { Connection } from "./index.ts";
import {
  ownedCatalogRow,
  type CatalogKey,
  ownedId,
  referencedRow,
  type Transaction,
} from "./owned.ts";
import {
  lessonProgress,
  reviewItems,
  lessons,
  topicEdges,
  topicMastery,
  topics,
  tracks,
  trackTopics,
} from "./schema.ts";

function edgesFor(db: Connection | Transaction, userId: string, ids?: string[]) {
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

function blockedTopics(db: Connection | Transaction, userId: string, memberIds?: string[]) {
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

function topicLessons(db: Connection, userId: string) {
  return db
    .select({ id: lessons.id })
    .from(lessons)
    .where(and(eq(lessons.userId, userId), eq(lessons.topicId, topics.id)));
}

function eligibleTopics(
  db: Connection,
  userId: string,
  {
    excludeDueAt,
    withLessons,
    trackId,
  }: { excludeDueAt?: Date; withLessons?: boolean; trackId?: string } = {},
) {
  return db
    .selectDistinct({
      id: topics.id,
      slug: topics.slug,
      title: topics.title,
      level: level.as("level"),
    })
    .from(topics)
    .innerJoin(trackTopics, and(eq(trackTopics.userId, userId), eq(trackTopics.topicId, topics.id)))
    .leftJoin(
      topicMastery,
      and(eq(topicMastery.userId, userId), eq(topicMastery.topicId, topics.id)),
    )
    .where(
      and(
        eq(topics.userId, userId),
        lt(level, 2),
        trackId ? eq(trackTopics.trackId, trackId) : undefined,
        withLessons ? exists(topicLessons(db, userId)) : undefined,
        notInArray(topics.id, blockedTopics(db, userId)),
        excludeDueAt &&
          notInArray(
            topics.id,
            db
              .select({ id: reviewItems.topicId })
              .from(reviewItems)
              .where(and(eq(reviewItems.userId, userId), lte(reviewItems.dueAt, excludeDueAt))),
          ),
      ),
    );
}

async function firstStudyLesson(db: Connection, userId: string, topicId: string) {
  const [lesson] = await db
    .select({ id: lessons.id, readAt: lessonProgress.readAt })
    .from(lessons)
    .leftJoin(
      lessonProgress,
      and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessons.id)),
    )
    .where(and(eq(lessons.userId, userId), eq(lessons.topicId, topicId)))
    .orderBy(sql`${lessonProgress.readAt} is not null`, lessons.position, lessons.id)
    .limit(1);
  return lesson;
}

export async function nextStudyTopic(db: Connection, userId: string, excludeDueAt?: Date) {
  const ready = eligibleTopics(db, userId, { excludeDueAt })
    .orderBy(topics.slug)
    .limit(1)
    .as("ready");
  const [topic] = await db
    .select({
      id: ready.id,
      slug: ready.slug,
      title: ready.title,
      trackId: tracks.id,
      trackSlug: tracks.slug,
    })
    .from(ready)
    .innerJoin(trackTopics, and(eq(trackTopics.userId, userId), eq(trackTopics.topicId, ready.id)))
    .innerJoin(tracks, and(eq(tracks.userId, userId), eq(tracks.id, trackTopics.trackId)))
    .orderBy(tracks.createdAt, tracks.id)
    .limit(1);
  if (!topic) return;
  const lesson = await firstStudyLesson(db, userId, topic.id);
  return { ...topic, firstLessonId: lesson?.id ?? null, allLessonsRead: !!lesson?.readAt };
}

async function topicsBySlug(tx: Transaction, userId: string, slugs: string[]) {
  const rows = await tx
    .select({ slug: topics.slug, id: topics.id, title: topics.title })
    .from(topics)
    .where(and(eq(topics.userId, userId), inArray(topics.slug, slugs)))
    .for("key share");
  return new Map(rows.map((row) => [row.slug, row]));
}

type TopicInput = { slug: string; title: string; summary?: string | null };

export function catalogForUser(db: Connection, userId: string) {
  const owned = eq(topics.userId, userId);
  async function getTopic(key: CatalogKey) {
    const [topic] = await db
      .select()
      .from(topics)
      .where(ownedCatalogRow(topics, userId, key));
    return topic;
  }
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
    const preserveSummary = inArray(
      topics.slug,
      values.filter((t) => t.summary === undefined).map((t) => t.slug),
    );
    return db
      .insert(topics)
      .values(values)
      .onConflictDoUpdate({
        target: [topics.userId, topics.slug],
        setWhere: owned,
        set: {
          title: sql`excluded.title`,
          summary: sql`case when ${preserveSummary} then ${topics.summary} else excluded.summary end`,
          updatedAt: new Date(),
        },
      })
      .returning();
  }
  return {
    upsertTopics,
    async reuseOrCreateTopic(input: TopicInput) {
      await db
        .insert(topics)
        .values({
          userId,
          slug: TopicSlug.parse(input.slug),
          title: input.title,
          summary: input.summary,
        })
        .onConflictDoNothing({ target: [topics.userId, topics.slug] });
      const [row] = await db
        .select({ id: topics.id })
        .from(topics)
        .where(and(owned, eq(topics.slug, input.slug)))
        .for("update");
      if (!row) throw new Error("Topic unavailable");
      return row;
    },
    async upsertTopic(input: TopicInput) {
      const [row] = await upsertTopics([input]);
      if (!row) throw new Error("Topic upsert did not return a Topic");
      return row;
    },
    listTopicsWithMastery(prefix = "") {
      return db
        .select({
          ...getTableColumns(topics),
          level,
          lessonCount: db.$count(
            lessons,
            and(eq(lessons.userId, userId), eq(lessons.topicId, topics.id)),
          ),
        })
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
    suggestedTopics(limit: number, trackId?: string) {
      return eligibleTopics(db, userId, { withLessons: true, trackId })
        .orderBy(topics.slug)
        .limit(limit);
    },
    nextTopicsToAuthor(trackId: string) {
      return db
        .select({ id: topics.id, slug: topics.slug, title: topics.title })
        .from(trackTopics)
        .innerJoin(topics, and(owned, eq(topics.id, trackTopics.topicId)))
        .where(
          and(
            eq(trackTopics.userId, userId),
            eq(trackTopics.trackId, trackId),
            notExists(topicLessons(db, userId)),
          ),
        )
        .orderBy(trackTopicOrder)
        .limit(2);
    },
    addEdges(edges: { from: string; to: string }[]) {
      return db.transaction(async (tx) => {
        const slugs = [...new Set(edges.flatMap(({ from, to }) => [from, to]))];
        const matches = await topicsBySlug(tx, userId, slugs);
        const missing = slugs.filter((slug) => !matches.has(slug));
        if (missing.length) throw new RangeError("Missing Topic slugs: " + missing.join(", "));
        const values = edges.map(({ from, to }) => ({
          userId,
          fromTopicId: matches.get(from)!.id,
          toTopicId: matches.get(to)!.id,
        }));
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
        const requested = await topicsBySlug(tx, userId, slugs);
        if (requested.size !== slugs.length) return undefined;
        const existing = await tx
          .select({ id: topics.id, slug: topics.slug, title: topics.title })
          .from(trackTopics)
          .innerJoin(topics, and(owned, eq(topics.id, trackTopics.topicId)))
          .where(and(eq(trackTopics.userId, userId), eq(trackTopics.trackId, trackId)))
          .orderBy(trackTopics.position, trackTopics.topicId)
          .for("update", { of: trackTopics });
        const ordered = [
          ...slugs.map((slug) => requested.get(slug)!),
          ...existing.filter((topic) => !requested.has(topic.slug)),
        ];
        const values = ordered.map(({ id: topicId }, position) => ({
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
        return ordered.map((topic, position) => ({
          ...topic,
          trackId,
          topicId: topic.id,
          position,
        }));
      });
    },
    async updateTopic(key: CatalogKey, patch: { title?: string; summary?: string | null }) {
      const [topic] = await db
        .update(topics)
        .set({ title: patch.title, summary: patch.summary, updatedAt: new Date() })
        .where(ownedCatalogRow(topics, userId, key))
        .returning();
      return topic;
    },
    async deleteTopic(key: CatalogKey) {
      const [deleted] = await db
        .delete(topics)
        .where(ownedCatalogRow(topics, userId, key))
        .returning({ id: topics.id });
      return deleted;
    },
    getTopic,
    getTopicBySlug: (slug: string) => getTopic({ slug }),
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
    getTrackGraph(ref: CatalogKey) {
      return db.transaction(
        async (tx) => {
          const [track] = await tx
            .select({ ...getTableColumns(tracks), forkCount, forkedFrom })
            .from(tracks)
            .where(ownedCatalogRow(tracks, userId, ref));
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
            .where(and(eq(trackTopics.userId, userId), eq(trackTopics.trackId, track.id)))
            .groupBy(topics.id, trackTopics.position, topicMastery.level)
            .orderBy(trackTopicOrder);
          const memberIds = members.map((m) => m.topic.id);
          const edges = await edgesFor(tx, userId, memberIds);
          const blocked = new Set(
            (await blockedTopics(tx, userId, memberIds)).map((row) => row.id),
          );
          const ready = members.filter((m) => m.level < 2 && !blocked.has(m.topic.id));
          const next = ready.find((m) => m.readCount < m.lessonCount);
          const lesson = next && (await firstStudyLesson(tx, userId, next.topic.id));
          return {
            nextLesson: lesson
              ? { id: lesson.id, started: members.some((m) => m.readCount > 0) }
              : null,
            suggestedNextTopics: ready.map((m) => m.topic),
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
