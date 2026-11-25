import type { Connection } from "./index.ts";
import type { tracks } from "./schema.ts";
import { forUser } from "./for-user.ts";
import { forkLessons, lockForkSource, publicReader } from "./public.ts";

// Retry a fresh snapshot if concurrent Forks allocated the same slug or reused the same Topic.
export async function forkTrack(
  db: Connection,
  userId: string,
  login: string,
  slug: string,
): Promise<typeof tracks.$inferSelect | undefined> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.transaction(
        async (tx) => {
          const source = await lockForkSource(tx, login, slug, userId);
          if (!source) return undefined;
          if (source.isOwner) throw new RangeError("You already own this Track.");
          const track = await publicReader(tx).track(login, slug);
          if (!track) return undefined;
          const own = forUser(tx, userId);
          const copy = await own.createTrack(track, { id: source.id, login, slug });
          for (const topic of track.topics) {
            const { id } = await own.reuseOrCreateTopic(topic);
            if (topic.lessons.length && !(await own.listLessonSummaries(id)).length) {
              for (const lesson of await forkLessons(tx, login, slug, topic.slug))
                await own.createLesson({ ...lesson, topicId: id });
            }
            await own.attachTopicToTrack(copy.id, id, topic.position);
          }
          if (track.edges.length) await own.addEdges(track.edges);
          return copy;
        },
        { isolationLevel: "repeatable read" },
      );
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      if (
        attempt >= 4 ||
        !cause ||
        typeof cause !== "object" ||
        !("code" in cause) ||
        !["40001", "40P01"].includes(String(cause.code))
      )
        throw error;
    }
  }
}
