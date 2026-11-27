import { PublicHandle } from "@startodel/core";
import { eq } from "drizzle-orm";
import type { Database } from "./index.ts";
import { profiles, users } from "./schema.ts";

export type GitHubIdentity = Pick<
  typeof users.$inferSelect,
  "githubId" | "login" | "name" | "avatarUrl"
>;

export function signInWithGitHub(
  db: Database,
  { githubId, login, name, avatarUrl }: GitHubIdentity,
) {
  const display = { login, name, avatarUrl };
  return db.transaction(async (tx) => {
    const fields = {
      id: users.id,
      login: users.login,
      name: users.name,
      avatarUrl: users.avatarUrl,
    };
    const sync = () =>
      tx
        .update(users)
        .set({ ...display, updatedAt: new Date() })
        .where(eq(users.githubId, githubId))
        .returning(fields);
    let [user] = await sync();
    const base = PublicHandle.safeParse(login.toLowerCase()).success
      ? login.toLowerCase()
      : "learner";
    for (let n = 1; !user; n++) {
      const suffix = n === 1 ? "" : "-" + n;
      const handle = base.slice(0, 40 - suffix.length).replace(/-$/, "") + suffix;
      [user] = await tx
        .insert(users)
        .values({ githubId, ...display, handle })
        .onConflictDoNothing()
        .returning(fields);
      // Another sign-in may have claimed either the identity or just the handle.
      if (!user) [user] = await sync();
    }
    await tx
      .insert(profiles)
      .values({ userId: user.id })
      .onConflictDoNothing({ target: profiles.userId });
    return user;
  });
}
