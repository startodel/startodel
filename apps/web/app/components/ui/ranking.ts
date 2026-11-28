import type { LinkTarget } from "./nav";

/** What earned a learner's points. */
export interface PointsBreakdown {
  lessons: number;
  quizzes: number;
  grills: number;
  reviews: number;
}

export type LeaderboardPeriod = "week" | "month" | "all";

export interface LeaderboardRow {
  id: string;
  rank: number;
  handle: string;
  avatarUrl?: string | null;
  points: number;
  /** Places gained since the last period: positive is up, 0 is the same place, null is a newcomer. */
  move: number | null;
  /** The learner's Public Profile. */
  to?: LinkTarget;
}
