import { and, eq, sql } from "drizzle-orm";
import type { Connection } from "./index.ts";
import type { Transaction } from "./owned.ts";
import { topics, trackTopics } from "./schema.ts";

export const trackTopicOrder = sql`${trackTopics.position}, ${topics.slug}`;

export function rankedTrackTopics(db: Connection | Transaction, userId: string) {
  return db
    .select({
      trackId: trackTopics.trackId,
      topicId: trackTopics.topicId,
      ordinal: sql<number>`(row_number() over (partition by ${trackTopics.trackId}
        order by ${trackTopicOrder}))::int`.as("ordinal"),
    })
    .from(trackTopics)
    .innerJoin(topics, and(eq(topics.userId, userId), eq(topics.id, trackTopics.topicId)))
    .where(eq(trackTopics.userId, userId));
}
