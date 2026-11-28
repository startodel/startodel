import { sql } from "drizzle-orm";
import type {
  AnswerSource,
  ProfileLink,
  LessonBlocks,
  MasteryLevel,
  ProfileQuestionnaire,
  PreferredLanguage,
  TrackLanguage,
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
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

function rowColumns() {
  return {
    id: uuid("id")
      .default(sql`uuidv7()`)
      .primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  };
}

export const users = pgTable(
  "users",
  {
    ...rowColumns(),
    acceptedTermsVersion: text("accepted_terms_version"),
    acceptedTermsAt: timestamp("accepted_terms_at", { withTimezone: true }),
    githubId: bigint("github_id", { mode: "bigint" }).unique(),
    email: text("email").unique(),
    handle: text("handle").notNull().unique(),
    login: text("login").notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
  },
  (t) => [
    check("users_sign_in_method", sql`${t.githubId} is not null or ${t.email} is not null`),
    check("users_normalized_email", sql`${t.email} = lower(trim(${t.email}))`),
  ],
);

const owner = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });
const time = (name: string) => timestamp(name, { withTimezone: true });
export const emailChallenges = pgTable(
  "email_challenges",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    purpose: text("purpose").$type<"sign_in" | "change_email">().notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    tokenHash: text("token_hash"),
    attempts: smallint("attempts").notNull().default(0),
    createdAt: time("created_at").notNull().defaultNow(),
    expiresAt: time("expires_at")
      .notNull()
      .default(sql`now() + interval '15 minutes'`),
    consumedAt: time("consumed_at"),
  },
  (t) => [
    index("email_challenges_email_created").on(t.email, t.createdAt),
    index("email_challenges_created").on(t.createdAt),
    check(
      "email_challenges_purpose",
      sql`(${t.purpose}='sign_in' and ${t.userId} is null and ${t.tokenHash} is not null) or (${t.purpose}='change_email' and ${t.userId} is not null and ${t.tokenHash} is null)`,
    ),
  ],
);

export const authRateEvents = pgTable(
  "auth_rate_events",
  {
    key: text("key").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("auth_rate_events_key_created").on(t.key, t.createdAt),
    index("auth_rate_events_created").on(t.createdAt),
  ],
);

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
    bio: text("bio"),
    headline: text("headline"),
    links: jsonb("links").$type<ProfileLink[]>().notNull().default([]),
    publicProfileEnabled: boolean("public_profile_enabled").notNull().default(true),
    showActivityHeatmap: boolean("show_activity_heatmap").notNull().default(true),
    includePrivateActivity: boolean("include_private_activity").notNull().default(false),
    showLearningProgress: boolean("show_learning_progress").notNull().default(false),
    goals: text("goals").array().notNull().default([]),
    stack: text("stack").array().notNull().default([]),
    experience: text("experience").$type<ProfileQuestionnaire["experience"]>(),
    yearsOfExperience: integer("years_of_experience"),
    notes: text("notes"),
    preferredLanguage: text("preferred_language").$type<PreferredLanguage>(),
    onboardedAt: time("onboarded_at"),
  },
  (t) => [
    check("profiles_experience_check", sql`${t.experience} in ('junior','middle','senior','lead')`),
    check("profiles_preferred_language_check", sql`${t.preferredLanguage} in ('ru','en')`),
    check("profiles_years_check", sql`${t.yearsOfExperience} between 0 and 60`),
  ],
);

export const tracks = pgTable(
  "tracks",
  {
    ...ownedColumns(),
    slug: text("slug").notNull(),
    pinOrder: smallint("pin_order"),
    public: boolean("public").notNull().default(false),
    forkedFromTrackId: uuid("forked_from_track_id").references((): AnyPgColumn => tracks.id, {
      onDelete: "set null",
    }),
    forkedFromLogin: text("forked_from_login"),
    forkedFromSlug: text("forked_from_slug"),
    title: text("title").notNull(),
    description: text("description"),
    language: text("language").$type<TrackLanguage>().notNull(),
    sources: jsonb("sources").$type<TrackSources>().default({}).notNull(),
  },
  (t) => [
    unique().on(t.userId, t.id),
    unique().on(t.userId, t.slug),
    check(
      "tracks_slug_check",
      sql`length(${t.slug}) <= 120 and ${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
    unique().on(t.userId, t.pinOrder),
    check(
      "tracks_pin_check",
      sql`${t.pinOrder} is null or (${t.public} and ${t.pinOrder} between 1 and 6)`,
    ),
    index("tracks_fork_source_idx").on(t.forkedFromTrackId),
  ],
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
    practiceCorrect: integer("practice_correct"),
    practiceTotal: integer("practice_total"),
  },
  (t) => [
    parentKey(t.userId, t.topicId, topics),
    unique().on(t.userId, t.topicId),
    check("review_items_box_check", sql`${t.box} between 0 and 4`),
    validVerdict("review_items_result_check", t.lastResult),
    check(
      "review_items_practice_score_check",
      sql`(${t.practiceCorrect} is null and ${t.practiceTotal} is null)
      or (${t.practiceCorrect} is not null and ${t.practiceTotal} is not null
        and ${t.practiceTotal} > 0 and ${t.practiceCorrect} between 0 and ${t.practiceTotal})`,
    ),
  ],
);

// Keep the due time that applied before this result rescheduled the ReviewItem.
export const reviewResults = pgTable(
  "review_results",
  {
    ...ownedColumns(),
    topicId: uuid("topic_id").notNull(),
    scheduledFor: time("scheduled_for"),
    verdict: verdictColumn("verdict").notNull(),
  },
  (t) => [
    parentKey(t.userId, t.topicId, topics),
    validVerdict("review_results_verdict_check", t.verdict),
    index("review_results_owner_time_idx").on(t.userId, t.createdAt),
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
  id: uuid("id")
    .default(sql`uuidv7()`)
    .primaryKey(),
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

export type ClientAuthMethod = "none" | "client_secret_post" | "client_secret_basic";

export const oauthClients = pgTable("oauth_clients", {
  id: uuid("id")
    .default(sql`uuidv7()`)
    .primaryKey(),
  createdAt: time("created_at").notNull().defaultNow(),
  name: text("name"),
  redirectUris: text("redirect_uris").array().notNull(),
  authMethod: text("auth_method").$type<ClientAuthMethod>().notNull(),
  secretHash: text("secret_hash"),
});

const authorizationFields = () => ({
  clientId: uuid("client_id")
    .notNull()
    .references(() => oauthClients.id),
  redirectUri: text("redirect_uri").notNull(),
  resource: text("resource").notNull(),
  challenge: text("challenge").notNull(),
});

export const oauthRequests = pgTable(
  "oauth_requests",
  {
    hash: text("hash").primaryKey(),
    ...authorizationFields(),
    state: text("state"),
    expiresAt: time("expires_at")
      .notNull()
      .default(sql`now() + interval '15 minutes'`),
  },
  (t) => [index("oauth_requests_expiry").on(t.expiresAt)],
);

export const oauthConnections = pgTable(
  "oauth_connections",
  {
    id: uuid("id")
      .default(sql`uuidv7()`)
      .primaryKey(),
    userId: owner(),
    ...authorizationFields(),
    codeHash: text("code_hash").unique().notNull(),
    codeExpiresAt: time("code_expires_at")
      .notNull()
      .default(sql`now() + interval '5 minutes'`),
    exchangedAt: time("exchanged_at"),
    createdAt: time("created_at").defaultNow().notNull(),
    lastUsedAt: time("last_used_at").defaultNow().notNull(),
    revokedAt: time("revoked_at"),
  },
  (t) => [unique().on(t.userId, t.id)],
);

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    hash: text("hash").primaryKey(),
    userId: owner(),
    connectionId: uuid("connection_id").notNull(),
    rotatedAt: time("rotated_at"),
  },
  (t) => [
    foreignKey({
      columns: [t.userId, t.connectionId],
      foreignColumns: [oauthConnections.userId, oauthConnections.id],
    }).onDelete("cascade"),
    uniqueIndex("oauth_refresh_current")
      .on(t.connectionId)
      .where(sql`${t.rotatedAt} is null`),
  ],
);
