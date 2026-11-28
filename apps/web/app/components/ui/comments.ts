import type { IconName } from "./icons";
import type { LinkTarget } from "./nav";

/** What a learner's comment on a Block is about. */
export const commentKinds = ["unclear", "outdated", "broken-link", "suggestion"] as const;
export type CommentKind = (typeof commentKinds)[number];

export const commentKindIcon: Record<CommentKind, IconName> = {
  unclear: "unclear",
  outdated: "clock",
  "broken-link": "link-off",
  suggestion: "tip",
};

export interface CommentAuthor {
  handle: string;
  avatarUrl?: string | null;
}

/** One comment in the thread of a Block. */
export interface BlockComment {
  id: string;
  kind: CommentKind;
  text: string;
  createdAt: string;
  author: CommentAuthor;
  resolved?: boolean;
  /** The answer of the Track's author. */
  reply?: { text: string; createdAt: string; author: CommentAuthor };
}

/** One comment in the author's inbox. */
export interface FeedbackComment {
  id: string;
  kind: CommentKind;
  text: string;
  /** The Block's position in the Lesson, from 1. */
  block: number;
  author: CommentAuthor;
  createdAt: string;
  resolved?: boolean;
}
export interface FeedbackLesson {
  id: string;
  track: string;
  topic: { ordinal: number; title: string };
  lesson: { ordinal: number; title: string; to?: LinkTarget };
  comments: FeedbackComment[];
}

export function useCommentKindLabel() {
  const { t } = useI18n();
  const labels = computed<Record<CommentKind, string>>(() => ({
    unclear: t("comments.unclear"),
    outdated: t("comments.outdated"),
    "broken-link": t("comments.brokenLink"),
    suggestion: t("comments.suggestion"),
  }));
  return (kind: CommentKind) => labels.value[kind];
}
