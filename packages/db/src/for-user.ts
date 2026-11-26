import { forkTrack } from "./fork.ts";
import { trackWrites } from "./track-writes.ts";
import { practiceForUser } from "./practice.ts";
import { progressForUser } from "./progress.ts";
import { grillsForUser } from "./grills.ts";
import { lessonsForUser } from "./lessons.ts";
import { masteryForUser } from "./mastery.ts";
import { accountId } from "./public.ts";
import { ProfilePatch } from "@startodel/core";
import { catalogForUser } from "./catalog.ts";
import { tokensForUser } from "./mcp-tokens.ts";
import { and, eq, getTableColumns } from "drizzle-orm";
import type { Connection } from "./index.ts";
import { grillSessions, profiles, tracks, users } from "./schema.ts";

export function forUser(db: Connection, userId: string) {
  const ownProfile = eq(profiles.userId, userId);
  const ownTracks = eq(tracks.userId, userId);
  const ownTrack = (id: string) => and(ownTracks, eq(tracks.id, id));

  const catalog = catalogForUser(db, userId);
  const lessons = lessonsForUser(db, userId);
  const mastery = masteryForUser(db, userId);
  return {
    forkTrack: (login: string, slug: string) => forkTrack(db, userId, login, slug),
    ...catalog,
    ...trackWrites(db, userId),
    async getTopicDetails(id: string) {
      const topic = await catalog.getTopic(id);
      if (!topic) return undefined;
      const [assessment, summaries, related] = await Promise.all([
        mastery.getMastery(id),
        lessons.listLessonSummaries(id),
        catalog.relatedTopics(id),
      ]);
      return {
        topic,
        mastery: assessment ?? { level: 0 as const, evidence: null },
        lessons: summaries,
        ...related,
      };
    },
    ...practiceForUser(db, userId),
    ...progressForUser(db, userId),
    ...grillsForUser(db, userId),
    ...lessons,
    ...mastery,
    mcpTokens: tokensForUser(db, userId),
    async getPublicLogin() {
      const [owner] = await db
        .select({ login: users.login })
        .from(users)
        .where(and(eq(users.id, userId), eq(users.id, accountId(db, users.login))));
      return owner?.login;
    },
    async getProfileWithLogin() {
      const [profile] = await db
        .select({ ...getTableColumns(profiles), login: users.login })
        .from(profiles)
        .innerJoin(users, eq(users.id, profiles.userId))
        .where(ownProfile);
      return profile;
    },
    async getProfile() {
      const [profile] = await db.select().from(profiles).where(ownProfile);
      return profile;
    },
    async updateProfile(input: string[] | ProfilePatch) {
      const [profile] = await db
        .update(profiles)
        .set({
          ...ProfilePatch.parse(Array.isArray(input) ? { goals: input } : input),
          updatedAt: new Date(),
        })
        .where(ownProfile)
        .returning();
      return profile;
    },
    listTracks() {
      return db.select().from(tracks).where(ownTracks).orderBy(tracks.createdAt, tracks.id);
    },
    async getTrackBySlug(slug: string) {
      const [track] = await db
        .select()
        .from(tracks)
        .where(and(ownTracks, eq(tracks.slug, slug)));
      return track;
    },
    async getTrack(id: string) {
      const [track] = await db.select().from(tracks).where(ownTrack(id));
      return track;
    },
    deleteTrack(id: string) {
      return db.transaction(async (tx) => {
        // Block new references until existing GrillSessions have been detached.
        const [track] = await tx
          .select({ id: tracks.id })
          .from(tracks)
          .where(ownTrack(id))
          .for("update");
        if (!track) return undefined;
        await tx
          .update(grillSessions)
          .set({ trackId: null, updatedAt: new Date() })
          .where(and(eq(grillSessions.userId, userId), eq(grillSessions.trackId, id)));
        await tx.delete(tracks).where(ownTrack(id));
        return track;
      });
    },
  };
}
