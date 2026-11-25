import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

export async function runMigrations(url: string) {
  await promisify(execFile)(
    process.execPath,
    [fileURLToPath(new URL("../migrate.mjs", import.meta.url))],
    {
      env: { ...process.env, DATABASE_URL: url },
    },
  );
}

export default async function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (url) await Promise.all([runMigrations(url), runMigrations(url)]);
}
