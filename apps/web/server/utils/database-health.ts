import { createDatabase } from "@startodel/db";

export async function databaseHealth() {
  const url = process.env.DATABASE_URL;
  if (!url) return { ok: false, db: "down" };

  try {
    const db = createDatabase(url);
    try {
      await db.execute("select 1");
      return { ok: true, db: "up" };
    } finally {
      await db.$client.end();
    }
  } catch {
    return { ok: false, db: "down" };
  }
}
