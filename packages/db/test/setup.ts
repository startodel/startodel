import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase } from "@startodel/db";

export default async function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) return;
  const db = createDatabase(url);
  try {
    await migrate(db, {
      migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
    });
  } finally {
    await db.$client.end();
  }
}
