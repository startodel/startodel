import type { Block } from "@startodel/core";
type Quiz = Extract<Block, { type: "quiz" }>;
export type LessonBlock =
  | Exclude<Block, { type: "quiz" | "exercise" }>
  | Omit<Extract<Block, { type: "exercise" }>, "solution">
  | (Omit<Quiz, "questions"> & {
      questions: Pick<Quiz["questions"][number], "prompt" | "options">[];
    });
