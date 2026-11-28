import type { LinkTarget } from "./nav";

/** The headline numbers of a Track for its author. */
export interface LearnerCounts {
  started: number;
  active7: number;
  active30: number;
  /** Learners who have read every Lesson. */
  completed: number;
}
/** The difference from the previous period. `completion` is in percentage points. */
export type LearnerChange = Partial<
  Record<"started" | "active7" | "active30" | "completion", number>
>;

export interface FunnelStep {
  id: string;
  title: string;
  /** How many learners reached this step. */
  learners: number;
  to?: LinkTarget;
}

/** Why a Lesson or a Topic counts as a weak spot. `dropoff` and `accuracy` are shares from 0 to 1. */
export interface DropOffSignal {
  type: "dropoff" | "accuracy" | "comments";
  value: number;
}
export interface DropOffItem {
  id: string;
  /** Ordinals from 1. Without `lesson` the weak spot is the whole Topic. */
  ref: { topic: number; lesson?: number };
  title: string;
  to?: LinkTarget;
  signals: DropOffSignal[];
  /** One plain sentence that reads the signals. */
  reading: string;
}

export interface MasteryTopic {
  id: string;
  title: string;
  /** Learners at each Mastery level, 0 to 4. */
  counts: number[];
  median: number;
  /** Shares from 0 to 1. Null where the Topic has no Quiz or no Exercise. */
  quizAccuracy: number | null;
  exerciseCompletion: number | null;
  to?: LinkTarget;
}

export interface CohortLearner {
  id: string;
  handle: string;
  avatarUrl?: string | null;
  /** Lessons read, out of `lessons`. */
  read: number;
  lessons: number;
  /** The median Mastery level over the Topics of the Track. */
  mastery: number;
  lastActiveAt: string;
}
export interface CohortSummary {
  learners: number;
  /** The average share of Lessons read, from 0 to 1. */
  progress: number;
  mastery: number;
}

/** A share from 0 to 1 as a whole percent in the active locale. */
export function usePercent() {
  const { n } = useI18n();
  return (share: number) => n(Math.round(share * 100)) + "%";
}
