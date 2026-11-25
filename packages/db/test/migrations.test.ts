import { expect, test } from "vite-plus/test";
import { createDatabase } from "@startodel/db";

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
