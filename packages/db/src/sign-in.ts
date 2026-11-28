import { randomInt } from "node:crypto";
import { PublicHandle } from "@startodel/core";
import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import type { Connection, Database } from "./index.ts";
import { profiles, users } from "./schema.ts";

export const sessionFields = {
  id: users.id,
  login: users.login,
  name: users.name,
  avatarUrl: users.avatarUrl,
};
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function lockIdentity(tx: Connection, key: string) {
  return tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
}

export type GitHubIdentity = {
  githubId: bigint;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  verifiedPrimaryEmail?: string;
};

type AccountInput = Pick<
  typeof users.$inferInsert,
  "githubId" | "email" | "name" | "avatarUrl" | "login"
>;

async function ensureProfile(
  tx: Connection,
  user: Pick<typeof users.$inferSelect, keyof typeof sessionFields>,
) {
  await tx
    .insert(profiles)
    .values({ userId: user.id })
    .onConflictDoNothing({ target: profiles.userId });
  return user;
}

async function createUser(tx: Connection, input: AccountInput, base: string) {
  for (let n = 1; ; n++) {
    const suffix =
      n === 1 ? "" : input.githubId != null ? "-" + n : String(randomInt(1000, 1000000));
    const handle = base.slice(0, 40 - suffix.length).replace(/-$/, "") + suffix;
    const [user] = await tx
      .insert(users)
      .values({
        ...input,
        handle,
        ...(input.githubId == null && { login: handle, name: handle }),
      })
      .onConflictDoNothing({ target: users.handle })
      .returning(sessionFields);
    if (user) return ensureProfile(tx, user);
  }
}

export async function accountForEmail(tx: Connection, email: string) {
  // The caller holds the email lock through account creation or a change of address.
  const [existing] = await tx
    .select(sessionFields)
    .from(users)
    .where(eq(users.email, email))
    .for("update");
  if (existing) return ensureProfile(tx, existing);
  const local = email
    .split("@")[0]!
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
  const base = PublicHandle.safeParse(local).success ? local : "learner";
  return createUser(tx, { email, login: base }, base);
}

export class SignInConflict extends Error {}

export function signInWithGitHub(db: Database, identity: GitHubIdentity, linkOwner?: string) {
  const { githubId, login, name, avatarUrl } = identity;
  const email = identity.verifiedPrimaryEmail && normalizeEmail(identity.verifiedPrimaryEmail);
  return db.transaction(async (tx) => {
    await lockIdentity(tx, "github:" + githubId);
    if (email) await lockIdentity(tx, "email:" + email);
    const accounts = await tx
      .select()
      .from(users)
      .where(
        or(
          eq(users.githubId, githubId),
          email ? eq(users.email, email) : undefined,
          linkOwner ? eq(users.id, linkOwner) : undefined,
        ),
      )
      .orderBy(users.id)
      .for("update");
    const github = accounts.find((account) => account.githubId === githubId);
    const address = email ? accounts.find((account) => account.email === email) : undefined;
    const owner = linkOwner ? accounts.find((account) => account.id === linkOwner) : undefined;
    if (github && !github.email && address && github.id !== address.id) throw new SignInConflict();
    if (
      linkOwner &&
      (!owner ||
        (owner.githubId !== null && owner.githubId !== githubId) ||
        (github && github.id !== linkOwner) ||
        (address && address.id !== linkOwner))
    )
      throw new SignInConflict();
    // A provider ID already bound to a User always returns to that same UUID.
    const existing = github ?? owner ?? address;
    if (existing) {
      if (existing.githubId !== null && existing.githubId !== githubId) throw new SignInConflict();
      const [user] = await tx
        .update(users)
        .set({
          githubId,
          login,
          name,
          avatarUrl,
          ...(!existing.email && email && (!address || address.id === existing.id) && { email }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning(sessionFields);
      return ensureProfile(tx, user!);
    }
    const base = PublicHandle.safeParse(login.toLowerCase()).success
      ? login.toLowerCase()
      : "learner";
    return createUser(tx, { githubId, login, name, avatarUrl, email: email || null }, base);
  });
}

export function signInMethods(db: Connection, userId: string) {
  return {
    async getSignInMethods() {
      const [row] = await db
        .select({
          email: users.email,
          github: sql<
            string | null
          >`case when ${users.githubId} is not null then ${users.login} end`,
        })
        .from(users)
        .where(eq(users.id, userId));
      return row;
    },
    async unlinkGitHub() {
      const [user] = await db
        .update(users)
        .set({ githubId: null, login: users.handle, avatarUrl: null, updatedAt: new Date() })
        .where(and(eq(users.id, userId), isNotNull(users.email)))
        .returning(sessionFields);
      return user;
    },
  };
}
