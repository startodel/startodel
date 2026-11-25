import { createDatabase } from "@startodel/db";
let pool: ReturnType<typeof createDatabase>;

export function database() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required");
    pool = createDatabase(url);
    useNitroApp().hooks.hook("close", () => pool.$client.end());
  }
  return pool;
}
