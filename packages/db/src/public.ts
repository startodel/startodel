import {
  publicBlock,
  studyOrder,
  TrackSources,
  type ForkedFrom,
  type PublicBlock,
  type PublicLesson,
  type PublicProfile,
  type PublicTopic,
  type PublicTrack,
} from "@startodel/core";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { alias, type SelectedFields } from "drizzle-orm/pg-core";
import type { Connection } from "./index.ts";
import type { Transaction } from "./owned.ts";
import { users, tracks, trackTopics, topics, topicEdges, lessons } from "./schema.ts";

const author = { login: users.login, name: users.name, avatarUrl: users.avatarUrl };
const visible = eq(tracks.public, true);
const fork = alias(tracks, "fork");
// Qualify both sides of correlated subqueries, including in a single-table projection.
export const forkCount = sql<number>`(select count(*)::integer from tracks as fork where fork.forked_from_track_id = tracks.id)`;
export const forkedFrom = sql<ForkedFrom | null>`case when tracks.forked_from_login is not null then
  json_build_object('login', tracks.forked_from_login, 'slug', tracks.forked_from_slug, 'source',
    (select json_build_object('login', source_author.login, 'slug', source.slug)
     from tracks as source join users as source_author on source_author.id = source.user_id
     where source.id = tracks.forked_from_track_id and source.public = true)) end`;
const trackSummary = {
  language: tracks.language,
  title: tracks.title,
  description: tracks.description,
  slug: tracks.slug,
  createdAt: tracks.createdAt,
  updatedAt: tracks.updatedAt,
  forkCount,
};
const lessonSummary = {
  id: lessons.id,
  title: lessons.title,
  summary: lessons.summary,
  position: lessons.position,
};

export function accountId(db: Connection, login: string | typeof users.login) {
  // A GitHub login can be reassigned. Resolve one identity before reading its catalog.
  const candidate = alias(users, "candidate");
  return db
    .select({ id: candidate.id })
    .from(candidate)
    .where(eq(candidate.login, login))
    .orderBy(desc(candidate.updatedAt), candidate.id)
    .limit(1);
}
function publicTrack(db: Connection, login: string, slug: string) {
  return and(visible, eq(tracks.userId, accountId(db, login)), eq(tracks.slug, slug));
}
// Anonymous Lesson queries discard practice keys inside PostgreSQL. WITH ORDINALITY
// preserves the authored order of both Blocks and questions.
const previewBlocks = sql<PublicBlock[]>`(select coalesce(jsonb_agg(case b->>'type'
  when 'quiz' then jsonb_strip_nulls(jsonb_build_object('type','quiz','id',b->'id','title',b->'title','questions',
    (select jsonb_agg(jsonb_build_object('prompt',q->'prompt','options',q->'options') order by qi)
     from jsonb_array_elements(b->'questions') with ordinality as questions(q,qi))))
  when 'exercise' then b - 'solution'
  else b end order by bi),'[]'::jsonb)
  from jsonb_array_elements(${lessons.blocks}) with ordinality as blocks(b,bi))`;
function trackLessons<T extends SelectedFields>(db: Connection, fields: T) {
  return db
    .select({
      ...lessonSummary,
      ...fields,
      topic: topics.slug,
      trackTitle: tracks.title,
      language: tracks.language,
    })
    .from(tracks)
    .innerJoin(trackTopics, eq(trackTopics.trackId, tracks.id))
    .innerJoin(topics, eq(topics.id, trackTopics.topicId))
    .innerJoin(lessons, eq(lessons.topicId, topics.id));
}

function publicEdges(db: Connection, where: SQL | undefined) {
  const dest = alias(trackTopics, "dest");
  const target = alias(topics, "target");
  return db
    .select({ from: topics.slug, to: target.slug })
    .from(tracks)
    .innerJoin(trackTopics, eq(trackTopics.trackId, tracks.id))
    .innerJoin(topicEdges, eq(topicEdges.fromTopicId, trackTopics.topicId))
    .innerJoin(dest, and(eq(dest.trackId, tracks.id), eq(dest.topicId, topicEdges.toTopicId)))
    .innerJoin(topics, eq(topics.id, trackTopics.topicId))
    .innerJoin(target, eq(target.id, dest.topicId))
    .where(where)
    .orderBy(topics.slug, target.slug);
}

// Fork-only reads. Neither function is exposed on the public reader or the package entry point.
export async function lockForkSource(
  tx: Transaction,
  login: string,
  slug: string,
  recipient: string,
) {
  const [row] = await tx
    .select({ id: tracks.id, isOwner: eq(tracks.userId, recipient) })
    .from(tracks)
    .where(publicTrack(tx, login, slug))
    .for("share");
  return row;
}
export function forkLessons(tx: Transaction, login: string, slug: string, topic: string) {
  return trackLessons(tx, { blocks: lessons.blocks })
    .where(and(publicTrack(tx, login, slug), eq(topics.slug, topic)))
    .orderBy(lessons.position, lessons.id);
}

export function publicReader(db: Connection) {
  return {
    async profile(login: string): Promise<PublicProfile | undefined> {
      const [user] = await db
        .select(author)
        .from(users)
        .where(eq(users.id, accountId(db, login)));
      if (!user) return undefined;
      const list = await db
        .select(trackSummary)
        .from(tracks)
        .where(and(visible, eq(tracks.userId, accountId(db, login))))
        .orderBy(tracks.title, tracks.slug);
      return { ...user, tracks: list };
    },
    async track(login: string, slug: string): Promise<PublicTrack | undefined> {
      const where = publicTrack(db, login, slug);
      const [track] = await db
        .select({ ...trackSummary, sources: tracks.sources, author, forkedFrom })
        .from(tracks)
        .innerJoin(users, eq(users.id, tracks.userId))
        .where(where);
      if (!track) return undefined;
      const rows = await db
        .select({
          slug: topics.slug,
          title: topics.title,
          summary: topics.summary,
          position: trackTopics.position,
          lesson: lessonSummary,
        })
        .from(tracks)
        .innerJoin(trackTopics, eq(trackTopics.trackId, tracks.id))
        .innerJoin(topics, eq(topics.id, trackTopics.topicId))
        .leftJoin(lessons, eq(lessons.topicId, topics.id))
        .where(where)
        .orderBy(trackTopics.position, topics.slug, lessons.position, lessons.id);
      const members = new Map<string, PublicTopic>();
      for (const { lesson, ...topic } of rows) {
        let member = members.get(topic.slug);
        if (!member) {
          member = { ...topic, lessons: [] };
          members.set(topic.slug, member);
        }
        if (lesson) member.lessons.push(lesson);
      }
      const edges = await publicEdges(db, where);
      const forks = await db
        .select({
          login: users.login,
          slug: fork.slug,
          title: fork.title,
          language: fork.language,
          createdAt: fork.createdAt,
        })
        .from(tracks)
        .innerJoin(fork, and(eq(fork.forkedFromTrackId, tracks.id), eq(fork.public, true)))
        .innerJoin(users, eq(users.id, fork.userId))
        .where(where)
        .orderBy(fork.createdAt, fork.id);
      return {
        ...track,
        sources: TrackSources.parse(track.sources),
        topics: [...members.values()],
        edges,
        forks,
      };
    },
    async lesson(login: string, slug: string, id: string): Promise<PublicLesson | undefined> {
      const where = publicTrack(db, login, slug);
      const [lesson] = await trackLessons(db, {
        blocks: previewBlocks,
        topicTitle: topics.title,
        lessonOrdinal: sql<number>`(select count(*)::int from lessons as sibling
          where sibling.topic_id = ${lessons.topicId}
          and (sibling.position, sibling.id) <= (${lessons.position}, ${lessons.id}))`,
      }).where(and(where, eq(lessons.id, id)));
      if (!lesson) return;
      // The Public Track numbers its syllabus in prerequisite order, retaining membership order on ties.
      const [members, edges] = await Promise.all([
        db
          .select({ id: topics.slug })
          .from(tracks)
          .innerJoin(trackTopics, eq(trackTopics.trackId, tracks.id))
          .innerJoin(topics, eq(topics.id, trackTopics.topicId))
          .where(where)
          .orderBy(trackTopics.position, topics.slug),
        publicEdges(db, where),
      ]);
      const index = studyOrder(members, edges).findIndex((member) => member.id === lesson.topic);
      if (index >= 0)
        return { ...lesson, topicOrdinal: index + 1, blocks: lesson.blocks.map(publicBlock) };
    },
    sitemap() {
      // Match the Public Profile lookup when a GitHub login has been reassigned.
      const accounts = db
        .selectDistinctOn([users.login], { id: users.id, login: users.login })
        .from(users)
        .orderBy(users.login, desc(users.updatedAt), users.id)
        .as("public_accounts");
      return db
        .select({
          login: accounts.login,
          slug: tracks.slug,
          updatedAt: tracks.updatedAt,
          lessonId: lessons.id,
          lessonUpdatedAt: lessons.updatedAt,
        })
        .from(accounts)
        .leftJoin(tracks, and(eq(tracks.userId, accounts.id), visible))
        .leftJoin(trackTopics, eq(trackTopics.trackId, tracks.id))
        .leftJoin(lessons, eq(lessons.topicId, trackTopics.topicId))
        .orderBy(accounts.login, tracks.slug, lessons.id);
    },
  };
}
