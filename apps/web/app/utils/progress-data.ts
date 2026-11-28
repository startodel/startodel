import type { TrackLanguage, Verdict } from "@startodel/core";
import type { LinkTarget } from "../components/ui/nav";

export interface ProgressTopic {
  id: string;
  ordinal: number;
  title: string;
  level: number;
  read: number;
  lessons: number;
  nextReview: string | null;
  to: LinkTarget;
}

export interface ProgressData {
  perTopic: ProgressTopic[];
  perTrack: {
    trackId: string;
    title: string;
    language: TrackLanguage;
    completed: number;
    levels: number[];
    updatedAt: string;
    to: LinkTarget;
  }[];
  masteryDistribution: number[];
  grill: Record<Verdict, number> & { answers: number };
  recentVerdicts: Record<Verdict, number>;
  reviews: { scheduled: number; onTime: number };
  activity: {
    id: string;
    at: string;
    kind:
      | "Lesson read"
      | "Quiz attempt"
      | "Grill answer"
      | "Grill verdict"
      | "Review result"
      | "Mastery";
    title: string;
    detail: string | null;
  }[];
}
