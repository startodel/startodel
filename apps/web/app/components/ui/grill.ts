import type { LinkTarget } from "./nav";

/** A Verdict, or one of the two states before one exists: awaiting a Verdict, and not answered. */
export type VerdictState = "strong" | "partial" | "weak" | "pending" | "none";

export interface GrillReviewTopic {
  id: string;
  title: string;
  to: LinkTarget;
  dueAt?: string | null;
}
