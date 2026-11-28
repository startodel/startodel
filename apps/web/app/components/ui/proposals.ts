import type { LinkTarget } from "./nav";

/** Outdated means the Block changed in the source Track after the proposal was made. */
export type ProposalStatus = "open" | "accepted" | "declined" | "outdated";

export interface ProposalAuthor {
  login: string;
  name?: string | null;
  avatarUrl?: string | null;
}

/** The ordinals of the Topic, the Lesson and the Block a proposal touches. */
export interface ProposalTarget {
  topic: number;
  lesson: number;
  block: number;
}

export interface ProposalSummary {
  id: string;
  proposer: ProposalAuthor;
  target: ProposalTarget;
  lessonTitle: string;
  createdAt: string;
  status: ProposalStatus;
  /** Where the row leads. Without it the row is a button and the list emits `open`. */
  to?: LinkTarget;
}
