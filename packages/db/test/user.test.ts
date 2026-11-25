import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, test } from "vite-plus/test";
import { createDatabase, forUser, signInWithGitHub } from "@startodel/db";
import { profiles, users } from "@startodel/db/schema";

const url = process.env.DATABASE_URL_TEST;
test.skipIf(!url)(
  "concurrent first sign-ins create one User and one Profile and later sign-ins preserve goals",
  async () => {
    const db = createDatabase(url!);
    const identity = {
      githubId: BigInt(-randomInt(1, 2 ** 47)),
      login: "first",
      name: null,
      avatarUrl: null,
    };
    try {
      const [first, second] = await Promise.all([
        signInWithGitHub(db, identity),
        signInWithGitHub(db, identity),
      ]);
      expect(second.id).toBe(first.id);
      const owned = eq(profiles.userId, first.id);
      expect(await db.select().from(profiles).where(owned)).toMatchObject([{ goals: [] }]);
      await db
        .update(profiles)
        .set({ goals: ["SQL"] })
        .where(owned);
      const updated = await signInWithGitHub(db, {
        ...identity,
        login: "new-login",
        name: "New Name",
        avatarUrl: "https://example.org/avatar",
      });
      expect(updated).toEqual({
        id: first.id,
        login: "new-login",
        name: "New Name",
        avatarUrl: "https://example.org/avatar",
      });
      expect(await db.select().from(profiles).where(owned)).toMatchObject([{ goals: ["SQL"] }]);
    } finally {
      await db.delete(users).where(eq(users.githubId, identity.githubId));
      await db.$client.end();
    }
  },
);

test.skipIf(!url)("forUser scopes every Profile and Track operation to its Owner", async () => {
  const db = createDatabase(url!);
  const githubId = BigInt(-randomInt(1, 2 ** 46)) * 2n;
  const identity = { githubId, login: "a", name: null, avatarUrl: null };
  try {
    const a = await signInWithGitHub(db, identity);
    const b = await signInWithGitHub(db, { ...identity, githubId: githubId - 1n, login: "b" });
    const alice = forUser(db, a.id);
    const bob = forUser(db, b.id);
    expect(await alice.updateProfile(["A goals"])).toMatchObject({ userId: a.id });
    expect(await bob.updateProfile(["B goals"])).toMatchObject({ userId: b.id });
    expect(await alice.getProfile()).toMatchObject({ userId: a.id, goals: ["A goals"] });
    const own = await alice.createTrack("A track");
    expect(own).toMatchObject({ slug: "a-track", public: false });
    const duplicate = await alice.createTrack("A track");
    expect(duplicate.slug).toBe("a-track-2");
    await alice.deleteTrack(duplicate.id);
    const foreign = await bob.createTrack("B track");
    expect(await alice.listTracks()).toEqual([own]);
    expect(await alice.getTrack(foreign.id)).toBeUndefined();
    expect(await alice.updateTrack(foreign.id, "changed")).toBeUndefined();
    expect(await alice.deleteTrack(foreign.id)).toBeUndefined();
    expect(await bob.getTrack(foreign.id)).toEqual(foreign);
    expect(await alice.updateTrack(own.id, "new title")).toMatchObject({
      id: own.id,
      title: "new title",
      slug: "a-track",
    });
    expect(await alice.deleteTrack(own.id)).toMatchObject({ id: own.id });
    expect(await alice.listTracks()).toEqual([]);
  } finally {
    await db.delete(users).where(eq(users.githubId, githubId));
    await db.delete(users).where(eq(users.githubId, githubId - 1n));
    await db.$client.end();
  }
});
