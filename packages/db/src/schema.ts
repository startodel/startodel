import { sql } from "drizzle-orm";
import type {
  AnswerSource,
  LessonBlocks,
  MasteryLevel,
  ProfileQuestionnaire,
  TrackSources,
  Verdict,
} from "@startodel/core";
import {
  type AnyPgColumn,
  check,
  foreignKey,
  integer,
  jsonb,
  smallint,
  bigint,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

function rowColumns() {
  return {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  };
}

export const users = pgTable("users", {
  ...rowColumns(),
  githubId: bigint("github_id", { mode: "bigint" }).notNull().unique(),
  login: text("login").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
});

const owner = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });
const time = (name: string) => timestamp(name, { withTimezone: true });
function ownedColumns() {
  return { ...rowColumns(), userId: owner() };
}

function parentKey(
  userId: AnyPgColumn,
  id: AnyPgColumn,
  parent: { userId: AnyPgColumn; id: AnyPgColumn },
) {
  return foreignKey({ columns: [userId, id], foreignColumns: [parent.userId, parent.id] }).onDelete(
    "cascade",
  );
}
const verdictColumn = (name: string) => text(name).$type<Verdict>();
const sourceColumn = (name: string) => text(name).$type<AnswerSource>();
const validVerdict = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} in ('strong','partial','weak')`);
const validSource = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} in ('ui','mcp')`);

export const profiles = pgTable(
  "profiles",
  {
    ...rowColumns(),
    userId: owner().unique(),
    goals: text("goals").array().notNull().default([]),
    stack: text("stack").array().notNull().default([]),
    experience: text("experience").$type<ProfileQuestionnaire["experience"]>(),
    yearsOfExperience: integer("years_of_experience"),
    notes: text("notes"),
    onboardedAt: time("onboarded_at"),
  },
  (t) => [
    check("profiles_experience_check", sql`${t.experience} in ('junior','middle','senior','lead')`),
    check("profiles_years_check", sql`${t.yearsOfExperience} between 0 and 60`),
  ],
);

export const tracks = pgTable(
  "tracks",
  {
    ...ownedColumns(),
    title: text("title").notNull(),
    description: text("description"),
    sources: jsonb("sources").$type<TrackSources>().default({}).notNull(),
  },
  (t) => [unique().on(t.userId, t.id)],
);

export const topics = pgTable(
  "topics",
  {
    ...ownedColumns(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
  },
  (t) => [unique().on(t.userId, t.id), unique().on(t.userId, t.slug)],
);

export const topicEdges = pgTable(
  "topic_edges",
  {
    ...ownedColumns(),
    fromTopicId: uuid("from_topic_id").notNull(),
    toTopicId: uuid("to_topic_id").notNull(),
  },
  (t) => [
    parentKey(t.userId, t.fromTopicId, topics),
    parentKey(t.userId, t.toTopicId, topics),
    unique().on(t.userId, t.fromTopicId, t.toTopicId),
    check("topic_edges_distinct", sql`${t.fromTopicId} <> ${t.toTopicId}`),
  ],
);

export const trackTopics = pgTable(
  "track_topics",
  {
    ...ownedColumns(),
    trackId: uuid("track_id").notNull(),
    topicId: uuid("topic_id").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    parentKey(t.userId, t.trackId, tracks),
    parentKey(t.userId, t.topicId, topics),
    unique().on(t.trackId, t.topicId),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    ...ownedColumns(),
    topicId: uuid("topic_id").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    position: integer("position").notNull(),
    blocks: jsonb("blocks").$type<LessonBlocks>().default([]).notNull(),
  },
  (t) => [unique().on(t.userId, t.id), parentKey(t.userId, t.topicId, topics)],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    ...ownedColumns(),
    lessonId: uuid("lesson_id").notNull(),
    readAt: time("read_at"),
  },
  (t) => [parentKey(t.userId, t.lessonId, lessons), unique().on(t.userId, t.lessonId)],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    ...ownedColumns(),
    lessonId: uuid("lesson_id").notNull(),
    blockId: text("block_id").notNull(),
    answers: jsonb("answers").$type<number[]>().notNull(),
    correct: integer("correct").notNull(),
    total: integer("total").notNull(),
    source: sourceColumn("source").notNull(),
  },
  (t) => [
    parentKey(t.userId, t.lessonId, lessons),
    validSource("quiz_attempts_source_check", t.source),
  ],
);

export const topicMastery = pgTable(
  "topic_mastery",
  {
    ...ownedColumns(),
    topicId: uuid("topic_id").notNull(),
    level: smallint("level").$type<MasteryLevel>().notNull(),
    evidence: text("evidence"),
  },
  (t) => [
    parentKey(t.userId, t.topicId, topics),
    unique().on(t.userId, t.topicId),
    check("topic_mastery_level_check", sql`${t.level} between 0 and 4`),
  ],
);

export const reviewItems = pgTable(
  "review_items",
  {
    ...ownedColumns(),
    topicId: uuid("topic_id").notNull(),
    box: smallint("box").notNull(),
    dueAt: time("due_at").notNull(),
    lastResult: verdictColumn("last_result"),
    reason: text("reason"),
    lastReviewedAt: time("last_reviewed_at"),
  },
  (t) => [
    parentKey(t.userId, t.topicId, topics),
    unique().on(t.userId, t.topicId),
    check("review_items_box_check", sql`${t.box} between 0 and 4`),
    validVerdict("review_items_result_check", t.lastResult),
  ],
);

export const grillSessions = pgTable(
  "grill_sessions",
  {
    ...ownedColumns(),
    trackId: uuid("track_id"),
    title: text("title").notNull(),
    status: text("status").$type<"open" | "finished">().default("open").notNull(),
    targetSize: integer("target_size").default(15).notNull(),
    finishedAt: time("finished_at"),
  },
  (t) => [
    unique().on(t.userId, t.id),
    parentKey(t.userId, t.trackId, tracks),
    check("grill_sessions_status_check", sql`${t.status} in ('open','finished')`),
  ],
);

export const grillQuestions = pgTable(
  "grill_questions",
  {
    ...ownedColumns(),
    sessionId: uuid("session_id").notNull(),
    topicId: uuid("topic_id"),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    answer: text("answer"),
    answeredAt: time("answered_at"),
    answerSource: sourceColumn("answer_source"),
    verdict: verdictColumn("verdict"),
    feedback: text("feedback"),
    judgedAt: time("judged_at"),
  },
  (t) => [
    parentKey(t.userId, t.sessionId, grillSessions),
    parentKey(t.userId, t.topicId, topics),
    unique().on(t.sessionId, t.position),
    validVerdict("grill_questions_verdict_check", t.verdict),
    validSource("grill_questions_source_check", t.answerSource),
  ],
);
export const mcpTokens = pgTable("mcp_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenPrefix: text("token_prefix").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
