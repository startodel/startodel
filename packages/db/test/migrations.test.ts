import { readFile } from "node:fs/promises";
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
      "grill_questions",
      "grill_sessions",
      "lesson_progress",
      "lessons",
      "mcp_tokens",
      "profiles",
      "quiz_attempts",
      "review_items",
      "topic_edges",
      "topic_mastery",
      "topics",
      "track_topics",
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

test.skipIf(!url)(
  "the learning migration preserves populated accounts, Profiles, Tracks and MCP Tokens",
  async () => {
    const db = createDatabase(url!);
    const client = await db.$client.connect();
    try {
      // Other test workers share this database. Stage the upgrade in its own namespace.
      await client.query("begin");
      await client.query("create schema learning_upgrade");
      await client.query("set local search_path to learning_upgrade");
      const apply = async (file: string) => {
        const sql = await readFile(new URL(`../migrations/${file}.sql`, import.meta.url), "utf8");
        await client.query(sql.replaceAll('"public".', '"learning_upgrade".'));
      };
      await apply("0000_initial");
      await apply("0001_mcp_tokens");
      await client.query(`
      insert into users(github_id, login) values (1,'learner');
      insert into profiles(user_id, goals) select id, array['study'] from users;
      insert into tracks(user_id, title) select id, 'Existing' from users;
      insert into mcp_tokens(user_id, name, token_prefix, token_hash)
        select id, 'Existing', 'prefix', 'test-digest' from users;
    `);
      const snapshot = async () =>
        (
          await client.query(`select to_jsonb(u) as account, to_jsonb(p) as profile,
      to_jsonb(t) as track, to_jsonb(m) as token from users u join profiles p on u.id=p.user_id
      join tracks t on u.id=t.user_id join mcp_tokens m on u.id=m.user_id`)
        ).rows;
      const [before] = await snapshot();
      await apply("0002_learning_core");
      expect(await snapshot()).toEqual([
        {
          ...before,
          profile: {
            ...before.profile,
            stack: [],
            experience: null,
            years_of_experience: null,
            notes: null,
            onboarded_at: null,
          },
          track: { ...before.track, description: null, sources: {} },
        },
      ]);
    } finally {
      try {
        await client.query("rollback");
      } finally {
        client.release();
        await db.$client.end();
      }
    }
  },
);
