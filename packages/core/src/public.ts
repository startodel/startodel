import type { Block, TrackSources } from "./content.ts";

type Quiz = Extract<Block, { type: "quiz" }>;
export type PublicBlock =
  | Exclude<Block, { type: "quiz" | "exercise" }>
  | Omit<Extract<Block, { type: "exercise" }>, "solution">
  | (Omit<Quiz, "questions"> & {
      questions: Pick<Quiz["questions"][number], "prompt" | "options">[];
    });

export function publicBlock(block: PublicBlock): PublicBlock {
  const { id, type } = block;
  switch (type) {
    case "quiz":
      return {
        type,
        id,
        questions: block.questions.map(({ prompt, options }) => ({ prompt, options })),
      };
    case "exercise":
      return { type, id, prompt: block.prompt, hints: block.hints };
    case "theory":
      return { type, id, markdown: block.markdown };
    case "callout":
      return { type, id, variant: block.variant, markdown: block.markdown };
    case "code":
      return {
        type,
        id,
        code: block.code,
        language: block.language,
        explanation: block.explanation,
      };
    case "link":
    case "video":
      return { type, id, title: block.title, url: block.url, note: block.note };
  }
}

export interface PublicAuthor {
  login: string;
  name: string | null;
  avatarUrl: string | null;
}
export interface PublicTrackSummary {
  title: string;
  description: string | null;
  slug: string;
  forkCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface PublicProfile extends PublicAuthor {
  tracks: PublicTrackSummary[];
}
export interface ForkedFrom {
  login: string;
  slug: string;
  source: { login: string; slug: string } | null;
}
export interface PublicLessonSummary {
  id: string;
  title: string;
  summary: string | null;
  position: number;
}
export interface PublicTopic {
  slug: string;
  title: string;
  summary: string | null;
  position: number;
  lessons: PublicLessonSummary[];
}
export interface PublicTrack extends PublicTrackSummary {
  sources: TrackSources;
  author: PublicAuthor;
  forkedFrom: ForkedFrom | null;
  topics: PublicTopic[];
  edges: { from: string; to: string }[];
  forks: { login: string; slug: string; title: string; createdAt: Date }[];
}
export interface PublicLesson extends PublicLessonSummary {
  topic: string;
  trackTitle: string;
  blocks: PublicBlock[];
}
