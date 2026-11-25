import { LEGAL_TERMS_VERSION, TrackSlug, TrackSources } from "@startodel/core";
import { and, eq } from "drizzle-orm";
import type { Connection } from "./index.ts";
import { tracks, users } from "./schema.ts";

type TrackInput = {
  title: string;
  slug?: string;
  description?: string | null;
  sources?: TrackSources;
};
type ForkSource = { id: string; login: string; slug: string };

function fields(input: Partial<TrackInput>) {
  return {
    title: input.title,
    description: input.description,
    sources: input.sources === undefined ? undefined : TrackSources.parse(input.sources),
    slug: input.slug === undefined ? undefined : TrackSlug.parse(input.slug),
  };
}

export function trackWrites(db: Connection, userId: string) {
  const ownTrack = (id: string) => and(eq(tracks.userId, userId), eq(tracks.id, id));
  return {
    async createTrack(input: string | TrackInput, source?: ForkSource) {
      const values = typeof input === "string" ? { title: input } : input;
      const parsed = fields(values);
      const base =
        parsed.slug ??
        (values.title
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .toLowerCase()
          .replace(/^-/, "")
          .slice(0, 120)
          .replace(/-$/, "") ||
          "track");
      for (let n = 1; ; n++) {
        const suffix = n === 1 ? "" : "-" + n;
        const slug = base.slice(0, 120 - suffix.length).replace(/-$/, "") + suffix;
        const [track] = await db
          .insert(tracks)
          .values({
            ...parsed,
            title: values.title,
            slug,
            userId,
            forkedFromTrackId: source?.id,
            forkedFromLogin: source?.login,
            forkedFromSlug: source?.slug,
          })
          .onConflictDoNothing({ target: [tracks.userId, tracks.slug] })
          .returning();
        if (track) return track;
      }
    },
    async updateTrack(id: string, input: string | Partial<TrackInput>) {
      const [track] = await db
        .update(tracks)
        .set({
          ...fields(typeof input === "string" ? { title: input } : input),
          updatedAt: new Date(),
        })
        .where(ownTrack(id))
        .returning();
      return track;
    },
    async termsAcceptance() {
      const [row] = await db
        .select({ version: users.acceptedTermsVersion, at: users.acceptedTermsAt })
        .from(users)
        .where(eq(users.id, userId));
      return row;
    },
    setTrackVisibility(id: string, visible: boolean, acceptTerms = false) {
      return db.transaction(async (tx) => {
        const [track] = await tx
          .update(tracks)
          .set({ public: visible, updatedAt: new Date() })
          .where(ownTrack(id))
          .returning();
        if (!track || !visible) return track;
        const [user] = await tx
          .select({ version: users.acceptedTermsVersion })
          .from(users)
          .where(eq(users.id, userId))
          .for("no key update");
        if (user?.version !== LEGAL_TERMS_VERSION) {
          if (!acceptTerms)
            throw new RangeError(
              "The user must accept the current Publishing rules and Terms of Use in the Startodel app before publishing.",
            );
          await tx
            .update(users)
            .set({ acceptedTermsVersion: LEGAL_TERMS_VERSION, acceptedTermsAt: new Date() })
            .where(eq(users.id, userId));
        }
        return track;
      });
    },
  };
}
