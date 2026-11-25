import type { Database } from "./index.ts";
import { profiles, users } from "./schema.ts";

type GitHubIdentity = Pick<typeof users.$inferSelect, "githubId" | "login" | "name" | "avatarUrl">;

export function signInWithGitHub(db: Database, { githubId, ...display }: GitHubIdentity) {
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
    await tx
      .insert(profiles)
      .values({ userId: user.id })
      .onConflictDoNothing({ target: profiles.userId });
    return user;
  });
}
