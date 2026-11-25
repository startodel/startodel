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
    const [user] = await tx
      .insert(users)
      .values({ githubId, ...display })
      .onConflictDoUpdate({ target: users.githubId, set: { ...display, updatedAt: new Date() } })
      .returning({
        id: users.id,
        login: users.login,
        name: users.name,
        avatarUrl: users.avatarUrl,
      });
    if (!user) throw new Error("GitHub sign-in did not return a User");
    await tx
      .insert(profiles)
      .values({ userId: user.id })
      .onConflictDoNothing({ target: profiles.userId });
    return user;
  });
}
