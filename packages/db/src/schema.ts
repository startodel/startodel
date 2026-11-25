import { bigint, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

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

export const profiles = pgTable("profiles", {
  ...rowColumns(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  goals: text("goals").array().notNull().default([]),
});

export const topics = pgTable("topics", {
  ...rowColumns(),
  title: text("title").notNull(),
});

export const topicEdges = pgTable(
  "topic_edges",
  {
    ...rowColumns(),
    fromTopicId: uuid("from_topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    toTopicId: uuid("to_topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (table) => [unique().on(table.fromTopicId, table.toTopicId)],
);

export const tracks = pgTable("tracks", {
  ...rowColumns(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
});

export const lessons = pgTable("lessons", {
  ...rowColumns(),
  trackId: uuid("track_id")
    .notNull()
    .references(() => tracks.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: "set null" }),
  title: text("title").notNull(),
});

export const quizzes = pgTable("quizzes", {
  ...rowColumns(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
});

export const grillSessions = pgTable("grill_sessions", {
  ...rowColumns(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  trackId: uuid("track_id").references(() => tracks.id, { onDelete: "set null" }),
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
});

export const reviewItems = pgTable("review_items", {
  ...rowColumns(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: "set null" }),
});

export const progress = pgTable(
  "progress",
  {
    ...rowColumns(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
  },
  (table) => [unique().on(table.userId, table.lessonId)],
);
