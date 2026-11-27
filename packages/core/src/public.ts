import type { ProfileLink } from "./public-profile.ts";
import type { Block, TrackLanguage, TrackSources } from "./content.ts";

type Quiz = Extract<Block, { type: "quiz" }>;
export type PublicBlock =
  | Exclude<Block, { type: "quiz" | "exercise" }>
  | Omit<Extract<Block, { type: "exercise" }>, "solution">
  | (Omit<Quiz, "questions"> & {
      questions: Pick<Quiz["questions"][number], "prompt" | "options">[];
    });

export function publicBlock(block: PublicBlock): PublicBlock {
  const { id, type, title } = block;
  switch (type) {
    case "quiz":
      return {
        type,
        id,
        title,
        questions: block.questions.map(({ prompt, options }) => ({ prompt, options })),
      };
    case "exercise":
      return { type, id, title, prompt: block.prompt, hints: block.hints };
    case "theory":
      return { type, id, title, markdown: block.markdown };
    case "callout":
      return { type, id, title, variant: block.variant, markdown: block.markdown };
    case "code":
      return {
        type,
        id,
        title,
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
  language: TrackLanguage;
  title: string;
  description: string | null;
  slug: string;
  forkCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface PublicProfile extends PublicAuthor {
  headline: string | null;
  bio: string | null;
  links: ProfileLink[];
  tracks: (PublicTrackSummary & { topicCount: number; pinOrder: number | null })[];
  heatmap?: { through: string; days: { date: string; count: number }[]; total: number };
  learningProgress?: { title: string; slug: string; counts: number[] }[];
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
  author: PublicAuthor & { profileEnabled: boolean };
  forkedFrom: ForkedFrom | null;
  topics: PublicTopic[];
  edges: { from: string; to: string }[];
  forks: {
    profileEnabled: boolean;
    login: string;
    slug: string;
    title: string;
    language: TrackLanguage;
    createdAt: Date;
  }[];
}
export interface PublicLesson extends PublicLessonSummary {
  topic: string;
  profileEnabled: boolean;
  topicTitle: string;
  topicOrdinal: number;
  lessonOrdinal: number;
  trackTitle: string;
  language: TrackLanguage;
  blocks: PublicBlock[];
}
