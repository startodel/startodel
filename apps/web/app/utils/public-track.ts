import type { PublicLessonSummary, PublicTopic } from "@startodel/core";
import { studyOrder, type BoardEdge } from "../components/ui/board";

type Topic = Pick<PublicTopic, "slug" | "title" | "summary"> & {
  lessons: Pick<PublicLessonSummary, "id" | "title">[];
};

/** The board, syllabus and Course metadata share one order and the same Lesson destinations. */
export function publicTrackTopics(
  topics: Topic[],
  edges: BoardEdge[],
  lessonPath: (id: string) => string,
) {
  const ordered = studyOrder(
    topics.map((topic) => ({ ...topic, id: topic.slug })),
    edges,
  );
  const numbered = ordered.map((topic, index) => ({
    id: topic.id,
    title: topic.title,
    summary: topic.summary,
    tag: "T" + String(index + 1).padStart(2, "0"),
    level: 0,
    lessons: topic.lessons.map(({ id, title }) => ({ id, title, to: lessonPath(id) })),
  }));
  return numbered.map((topic) => {
    const incoming = new Set(edges.filter(({ to }) => to === topic.id).map(({ from }) => from));
    return { ...topic, prerequisites: numbered.filter(({ id }) => incoming.has(id)) };
  });
}
