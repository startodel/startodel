import { expect, test } from "vite-plus/test";
import { createDatabase } from "@startodel/db";
import { runMigrations } from "./setup.ts";

const url = process.env.DATABASE_URL_TEST;
test.skipIf(!url)("the migrations create all learning and account tables", async () => {
  const db = createDatabase(url!);
  try {
    const tables = await db.execute<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' order by tablename",
    );
    expect(tables.rows.map((row) => row.tablename)).toEqual([
      "grill_sessions",
      "lessons",
      "mcp_tokens",
      "profiles",
      "progress",
      "quizzes",
      "review_items",
      "topic_edges",
      "topics",
      "tracks",
      "users",
    ]);
  } finally {
    await db.$client.end();
  }
});

test.skipIf(!url)("running startup migrations again preserves the migration journal", async () => {
  const db = createDatabase(url!);
  try {
    const journal = () =>
      db.$client.query("select * from drizzle.__drizzle_migrations order by id");
    const before = await journal();
    expect(before.rowCount).toBeGreaterThan(0);
    await runMigrations(url!);
    expect((await journal()).rows).toEqual(before.rows);
  } finally {
    await db.$client.end();
  }
});
