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
import { and, eq, sql, type SQL } from "drizzle-orm";
import { alias, type SelectedFields } from "drizzle-orm/pg-core";
import type { Connection } from "./index.ts";
import type { Transaction } from "./owned.ts";
import { activityHeatmap, learningProgress } from "./public-activity.ts";
import { profiles, users, tracks, trackTopics, topics, topicEdges, lessons } from "./schema.ts";

const author = { login: users.handle, name: users.name, avatarUrl: users.avatarUrl };
const visible = eq(tracks.public, true);
const fork = alias(tracks, "fork");
// Qualify both sides of correlated subqueries, including in a single-table projection.
export const forkCount = sql<number>`(select count(*)::integer from tracks as fork where fork.forked_from_track_id = tracks.id)`;
export const forkedFrom = sql<ForkedFrom | null>`case when tracks.forked_from_login is not null then
  json_build_object('login', coalesce((select source_author.handle from tracks as source join users as source_author on source_author.id = source.user_id where source.id = tracks.forked_from_track_id and source.public), tracks.forked_from_login), 'slug', tracks.forked_from_slug, 'source',
    (select json_build_object('login', source_author.handle, 'slug', source.slug)
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

function publicTrack(db: Connection, login: string, slug: string) {
  return and(
    visible,
    eq(tracks.userId, db.select({ id: users.id }).from(users).where(eq(users.handle, login))),
    eq(tracks.slug, slug),
  );
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
      return db.transaction(
        async (tx) => {
          const [user] = await tx
            .select({
              ...author,
              id: users.id,
              bio: profiles.bio,
              headline: profiles.headline,
              links: profiles.links,
              showHeatmap: profiles.showActivityHeatmap,
              includePrivate: profiles.includePrivateActivity,
              showProgress: profiles.showLearningProgress,
            })
            .from(users)
            .innerJoin(profiles, eq(profiles.userId, users.id))
            .where(and(eq(users.handle, login), eq(profiles.publicProfileEnabled, true)));
          if (!user) return;
          const { id, showHeatmap, includePrivate, showProgress, ...identity } = user;
          const list = await tx
            .select({
              ...trackSummary,
              pinOrder: tracks.pinOrder,
              topicCount: sql<number>`(select count(*)::int from track_topics where track_id = tracks.id)`,
            })
            .from(tracks)
            .where(and(visible, eq(tracks.userId, id)))
            .orderBy(tracks.pinOrder, tracks.title, tracks.slug);
          return {
            ...identity,
            tracks: list,
            ...(showHeatmap && { heatmap: await activityHeatmap(tx, id, includePrivate) }),
            ...(showProgress && { learningProgress: await learningProgress(tx, id) }),
          };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
    },
    async track(login: string, slug: string): Promise<PublicTrack | undefined> {
      const where = publicTrack(db, login, slug);
      const [track] = await db
        .select({
          ...trackSummary,
          sources: tracks.sources,
          author: { ...author, profileEnabled: profiles.publicProfileEnabled },
          forkedFrom,
        })
        .from(tracks)
        .innerJoin(users, eq(users.id, tracks.userId))
        .innerJoin(profiles, eq(profiles.userId, users.id))
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
          login: users.handle,
          profileEnabled: profiles.publicProfileEnabled,
          slug: fork.slug,
          title: fork.title,
          language: fork.language,
          createdAt: fork.createdAt,
        })
        .from(tracks)
        .innerJoin(fork, and(eq(fork.forkedFromTrackId, tracks.id), eq(fork.public, true)))
        .innerJoin(users, eq(users.id, fork.userId))
        .innerJoin(profiles, eq(profiles.userId, users.id))
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
        profileEnabled: sql<boolean>`(select public_profile_enabled from profiles where user_id = tracks.user_id)`,
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
      return db
        .select({
          login: users.handle,
          profileEnabled: profiles.publicProfileEnabled,
          slug: tracks.slug,
          updatedAt: tracks.updatedAt,
          lessonId: lessons.id,
          lessonUpdatedAt: lessons.updatedAt,
        })
        .from(users)
        .innerJoin(profiles, eq(profiles.userId, users.id))
        .leftJoin(tracks, and(eq(tracks.userId, users.id), visible))
        .leftJoin(trackTopics, eq(trackTopics.trackId, tracks.id))
        .leftJoin(lessons, eq(lessons.topicId, trackTopics.topicId))
        .orderBy(users.handle, tracks.slug, lessons.id);
    },
  };
}
