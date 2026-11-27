import { PublicProfilePatch } from "@startodel/core";
import { and, eq, isNotNull } from "drizzle-orm";
import type { Connection } from "./index.ts";
import { profiles, tracks, users } from "./schema.ts";

export function publicProfileSettings(db: Connection, userId: string) {
  const ownProfile = eq(profiles.userId, userId);
  const ownTracks = eq(tracks.userId, userId);
  return {
    async getPublicProfileSettings() {
      const [profile] = await db
        .select({
          handle: users.handle,
          headline: profiles.headline,
          bio: profiles.bio,
          links: profiles.links,
          publicProfileEnabled: profiles.publicProfileEnabled,
          showActivityHeatmap: profiles.showActivityHeatmap,
          includePrivateActivity: profiles.includePrivateActivity,
          showLearningProgress: profiles.showLearningProgress,
        })
        .from(profiles)
        .innerJoin(users, eq(users.id, profiles.userId))
        .where(ownProfile);
      if (!profile) return;
      const published = await db
        .select({ id: tracks.id, title: tracks.title, pinOrder: tracks.pinOrder })
        .from(tracks)
        .where(and(ownTracks, eq(tracks.public, true)))
        .orderBy(tracks.pinOrder, tracks.title, tracks.slug);
      return { ...profile, tracks: published };
    },
    async updatePublicProfile(input: PublicProfilePatch) {
      const { handle, pinnedTrackIds, ...patch } = PublicProfilePatch.parse(input);
      try {
        return await db.transaction(async (tx) => {
          // Serialize replacements of an Owner's ordered pin list, including an empty list.
          const [profile] = await tx
            .update(profiles)
            .set({ ...patch, updatedAt: new Date() })
            .where(ownProfile)
            .returning({ id: profiles.id });
          if (!profile) return;
          if (pinnedTrackIds) {
            await tx
              .update(tracks)
              .set({ pinOrder: null })
              .where(and(ownTracks, isNotNull(tracks.pinOrder)));
            for (const [i, id] of pinnedTrackIds.entries()) {
              const [pinned] = await tx
                .update(tracks)
                .set({ pinOrder: i + 1 })
                .where(and(ownTracks, eq(tracks.id, id), eq(tracks.public, true)))
                .returning({ id: tracks.id });
              if (!pinned) throw new RangeError("Track not found");
            }
          }
          if (handle !== undefined)
            await tx.update(users).set({ handle }).where(eq(users.id, userId));
          return profile;
        });
      } catch (error) {
        const cause = error instanceof Error ? error.cause : undefined;
        if (
          cause &&
          typeof cause === "object" &&
          "constraint" in cause &&
          cause.constraint === "users_handle_unique"
        )
          throw new RangeError("Handle already in use");
        throw error;
      }
    },
  };
}
