import { database } from "./pool";
import { forUser, resolveMcpToken, signInWithGitHub, type GitHubIdentity } from "@startodel/db";
import { createError, getRequestURL, type RequestEvent } from "nuxt/server";
import { requireUser } from "../utils/require-user";

export function signIn(identity: GitHubIdentity) {
  return signInWithGitHub(database(), identity);
}

export async function userData(event: RequestEvent) {
  const userId = await requireUser(event);
  if (getRequestURL(event).search)
    throw createError({ status: 400, message: "Unexpected query parameters" });
  return forUser(database(), userId);
}

export async function mcpData(plaintext: string) {
  const db = database();
  const userId = await resolveMcpToken(db, plaintext);
  return userId === null ? null : forUser(db, userId);
}
