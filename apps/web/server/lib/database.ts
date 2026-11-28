import { database } from "./pool";
import {
  forUser,
  useOAuthAccess,
  resolveMcpToken,
  signInWithGitHub,
  type GitHubIdentity,
} from "@startodel/db";
import { createError, getRequestURL, type RequestEvent } from "nuxt/server";
import { verifyAccess } from "./oauth-jwt";
import { requireUser } from "../utils/require-user";

export function signIn(identity: GitHubIdentity, linkOwner?: string) {
  return signInWithGitHub(database(), identity, linkOwner);
}

export async function userData(event: RequestEvent) {
  const userId = await requireUser(event);
  if (getRequestURL(event).search)
    throw createError({ status: 400, message: "Unexpected query parameters" });
  return forUser(database(), userId);
}

export async function mcpData(plaintext: string, issuer: string) {
  const db = database();
  if (!plaintext.startsWith("sto_")) {
    const access = await verifyAccess(useRuntimeConfig().appSecret, issuer, plaintext);
    const owner = access && (await useOAuthAccess(db, access));
    return owner ? forUser(db, owner) : null;
  }
  const userId = await resolveMcpToken(db, plaintext);
  return userId === null ? null : forUser(db, userId);
}
