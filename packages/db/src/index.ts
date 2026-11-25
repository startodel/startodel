import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";

export function createDatabase(url: string) {
  return drizzle({
    connection: { connectionString: url, connectionTimeoutMillis: 2000 },
    schema,
  });
}

export type Database = ReturnType<typeof createDatabase>;
export { signInWithGitHub, type GitHubIdentity } from "./sign-in.ts";
export { forUser } from "./for-user.ts";
