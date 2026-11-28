import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";

export function createDatabase(url: string) {
  return drizzle({
    connection: { connectionString: url, connectionTimeoutMillis: 2000 },
    schema,
  });
}

export type Database = ReturnType<typeof createDatabase>;
export {
  signInWithGitHub,
  SignInConflict,
  normalizeEmail,
  type GitHubIdentity,
} from "./sign-in.ts";
export { forUser } from "./for-user.ts";
export { resolveMcpToken } from "./mcp-tokens.ts";

// Both the pool and an open transaction implement this query interface.
export type Connection = Omit<Database, "$client">;
export { publicReader } from "./public.ts";

export {
  allowAuthRequest,
  allowAuthRequest as allowEmailRequest,
  issueEmailChallenge,
  verifyEmailChallenge,
} from "./email-challenge.ts";
export {
  type AccessGrant,
  authenticateOAuthClient,
  beginAuthorization,
  exchangeOAuthCode,
  oauthClient,
  refreshOAuthGrant,
  registerOAuthClient,
  revokeOAuthAccess,
  revokeOAuthRefresh,
  useOAuthAccess,
} from "./oauth.ts";
