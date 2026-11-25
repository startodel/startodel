import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run migrations");

const pool = new pg.Pool({ connectionString, max: 1 });
try {
  const client = await pool.connect();
  try {
    await client.query("select pg_advisory_lock(hashtextextended('startodel:migrations', 0))");
    await migrate(drizzle(client), {
      migrationsFolder: fileURLToPath(new URL("./migrations/", import.meta.url)),
    });
  } finally {
    // Closing the lock-holding session releases its advisory lock, including on failure.
    client.release(true);
  }
} catch (error) {
  // Connection errors may include credentials from a malformed URL.
  throw new Error(
    `Startup migrations failed (${error.cause?.code ?? error.code ?? "unknown error"})`,
  );
} finally {
  await pool.end();
}
