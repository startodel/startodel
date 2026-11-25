import type { IconName } from "./icons";

/** The seven kinds of Lesson Block, in the terms of docs/CONTEXT.md. */
export type BlockKind = "theory" | "code" | "callout" | "link" | "video" | "quiz" | "exercise";

export const blockIcons: Record<BlockKind, IconName> = {
  theory: "theory",
  code: "code",
  callout: "gotcha",
  link: "link",
  video: "video",
  quiz: "quiz",
  exercise: "exercise",
};
