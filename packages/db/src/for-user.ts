import { and, eq } from "drizzle-orm";
import type { Database } from "./index.ts";
import { profiles, tracks } from "./schema.ts";

export function forUser(db: Database, userId: string) {
  const ownProfile = eq(profiles.userId, userId);
  const ownTracks = eq(tracks.userId, userId);
  const ownTrack = (id: string) => and(ownTracks, eq(tracks.id, id));

  return {
    async getProfile() {
      const [profile] = await db.select().from(profiles).where(ownProfile);
      return profile;
    },
    async updateProfile(goals: string[]) {
      const [profile] = await db
        .update(profiles)
        .set({ goals, updatedAt: new Date() })
        .where(ownProfile)
        .returning();
      return profile;
    },
    listTracks() {
      return db.select().from(tracks).where(ownTracks).orderBy(tracks.createdAt, tracks.id);
    },
    async getTrack(id: string) {
      const [track] = await db.select().from(tracks).where(ownTrack(id));
      return track;
    },
    async createTrack(title: string) {
      const [track] = await db.insert(tracks).values({ userId, title }).returning();
      return track;
    },
    async updateTrack(id: string, title: string) {
      const [track] = await db
        .update(tracks)
        .set({ title, updatedAt: new Date() })
        .where(ownTrack(id))
        .returning();
      return track;
    },
    async deleteTrack(id: string) {
      const [track] = await db.delete(tracks).where(ownTrack(id)).returning({ id: tracks.id });
      return track;
    },
  };
}
