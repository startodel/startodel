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
      await client.query(`insert into tracks(user_id,title,created_at) select id, title, '2100-01-01'::date + n from users
        cross join (values (1,'Existing'),(2,'Existing 2'),(3,'中文')) t(n,title)`);
      await apply("0003_public_tracks");
      await apply("0004_publishing_terms");
      const migrated = await client.query(
        "select title,slug,public from tracks order by created_at",
      );
      expect(migrated.rows).toEqual([
        { title: "Existing", slug: "existing", public: false },
        { title: "Existing", slug: "existing-2", public: false },
        { title: "Existing 2", slug: "existing-2-2", public: false },
        { title: "中文", slug: "track", public: false },
      ]);
      await apply("0005_review_practice_score");
      await apply("0006_profile_preferred_language");
      await apply("0007_uuidv7_defaults");
      await client.query("update profiles set preferred_language='ru'");
      await client.query(
        "insert into tracks(user_id,title,slug) select id,'SQL · Ї','sql-uk' from users",
      );
      await apply("0008_track_language");
      const languages = await client.query("select title,language from tracks order by slug");
      expect(languages.rows).toEqual([
        { title: "Existing", language: "en" },
        { title: "Existing", language: "en" },
        { title: "Existing 2", language: "en" },
        { title: "SQL · Ї", language: "ru" },
        { title: "中文", language: "en" },
      ]);
      const column = await client.query(
        "select is_nullable from information_schema.columns where table_schema='learning_upgrade' and table_name='tracks' and column_name='language'",
      );
      expect(column.rows).toEqual([{ is_nullable: "NO" }]);
      const existing = await client.query(
        "select id, uuid_extract_version(id) as version from users",
      );
      expect(existing.rows).toEqual([{ id: before.account.id, version: 4 }]);
      const inserted = await client.query(
        "insert into mcp_tokens(user_id, name, token_prefix, token_hash) select id, 'New', 'prefix', 'new-digest' from users returning uuid_extract_version(id) as version",
      );
      expect(inserted.rows).toEqual([{ version: 7 }]);
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

test.skipIf(!url)(
  "the review score migration recognizes only complete legacy score notes",
  async () => {
    const db = createDatabase(url!);
    const client = await db.$client.connect();
    try {
      await client.query("begin");
      await client.query(
        "create temporary table review_items (id serial primary key, reason text)",
      );
      const reasons = [
        "Practice Quiz: 0 of 3 correct",
        "Practice Quiz: 12 of 12 correct",
        "Practice Quiz: 1 of 1 correct — repeat later",
        "I wrote Practice Quiz: 1 of 1 correct",
        "Practice Quiz: 2 of 1 correct",
        "Practice Quiz: 1 of 2147483648 correct",
        "Practice Quiz: 01 of 2 correct",
        "Practice Quiz: 1 of 1 correct\n",
        null,
      ];
      await client.query("insert into review_items (reason) select unnest($1::text[])", [reasons]);
      await client.query(
        await readFile(
          new URL("../migrations/0005_review_practice_score.sql", import.meta.url),
          "utf8",
        ),
      );
      const { rows } = await client.query(
        "select reason, practice_correct, practice_total from review_items order by id",
      );
      expect(rows.map((r) => r.reason)).toEqual(reasons);
      expect(rows.map((r) => [r.practice_correct, r.practice_total])).toEqual([
        [0, 3],
        [12, 12],
        ...reasons.slice(2).map(() => [null, null]),
      ]);
    } finally {
      await client.query("rollback");
      client.release();
      await db.$client.end();
    }
  },
);
