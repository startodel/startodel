import type {
  LessonBlocks,
  PreferredLanguage,
  ProfileQuestionnaire,
  TopicSlug,
  TrackLanguage,
  TrackSources,
} from "./content.ts";
import type { ReviewSchedule, Verdict } from "./review.ts";
export * from "./content.ts";
export * from "./review.ts";

interface OwnedRecord {
  id: string;
  userId: string;
}
export interface Profile extends OwnedRecord, ProfileQuestionnaire {
  preferredLanguage: PreferredLanguage | null;
}
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
  language: TrackLanguage;
  slug: string;
  public: boolean;
  forkedFromTrackId: string | null;
  forkedFromSlug: string | null;
  forkedFromLogin: string | null;
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
export * from "./legal.ts";
export * from "./public.ts";
