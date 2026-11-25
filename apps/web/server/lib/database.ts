import { createDatabase, forUser, signInWithGitHub, type GitHubIdentity } from "@startodel/db";
import { createError, getRequestURL, type RequestEvent } from "nuxt/server";
import { requireUser } from "../utils/require-user";

let pool: ReturnType<typeof createDatabase>;

function database() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required");
    pool = createDatabase(url);
    useNitroApp().hooks.hook("close", () => pool.$client.end());
  }
  return pool;
}

export function signIn(identity: GitHubIdentity) {
  return signInWithGitHub(database(), identity);
}

export async function userData(event: RequestEvent) {
  const userId = await requireUser(event);
  if (getRequestURL(event).search)
    throw createError({ status: 400, message: "Unexpected query parameters" });
  return forUser(database(), userId);
}
