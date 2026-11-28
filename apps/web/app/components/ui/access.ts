import type { IconName } from "./icons";
import type { LinkTarget } from "./nav";

/** How a Track is shared: with nobody, with everybody, or with the learners its author lets in. */
export type TrackAccess = "private" | "public" | "gated";

export const trackAccessIcon: Record<TrackAccess, IconName> = {
  private: "lock",
  public: "pad",
  gated: "lock-pad",
};

export interface SyllabusLesson {
  id: string;
  title: string;
  /** Left out for a locked Lesson, which stays unlinked. */
  to?: LinkTarget;
  locked?: boolean;
  /** Open to everybody as a free preview. */
  preview?: boolean;
  /** Left out where there is no Lesson Progress, as for a visitor without access. */
  read?: boolean;
}
export interface SyllabusTopic {
  id: string;
  title: string;
  lessons: SyllabusLesson[];
}

export type AccessRequestState = "signed-out" | "available" | "pending" | "granted" | "declined";

export interface AccessLearner {
  handle: string;
  avatarUrl?: string | null;
}
export interface AccessPending {
  id: string;
  learner: AccessLearner;
  message?: string | null;
  requestedAt: string;
}
export interface AccessGrant {
  id: string;
  learner: AccessLearner;
  grantedAt: string;
  lastActiveAt?: string | null;
}
