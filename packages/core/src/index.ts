import type { LessonBlocks, ProfileQuestionnaire, TopicSlug, TrackSources } from "./content.ts";
import type { ReviewSchedule, Verdict } from "./review.ts";
export * from "./content.ts";
export * from "./review.ts";

interface OwnedRecord {
  id: string;
  userId: string;
}
export interface Profile extends OwnedRecord, ProfileQuestionnaire {}
export interface Topic extends OwnedRecord {
  slug: TopicSlug;
  title: string;
  summary: string | null;
}
export interface TopicEdge extends OwnedRecord {
  fromTopicId: string;
  toTopicId: string;
}
export interface Track extends OwnedRecord {
  title: string;
  description: string | null;
  sources: TrackSources;
}
export interface Lesson extends OwnedRecord {
  topicId: string;
  title: string;
  summary: string | null;
  position: number;
  blocks: LessonBlocks;
}
export interface GrillSession extends OwnedRecord {
  trackId: string | null;
  title: string;
  status: "open" | "finished";
  targetSize: number;
  finishedAt: Date | null;
}
export interface ReviewItem extends OwnedRecord, ReviewSchedule {
  topicId: string;
  lastResult: Verdict | null;
  reason: string | null;
  lastReviewedAt: Date | null;
}
