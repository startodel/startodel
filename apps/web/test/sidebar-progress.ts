import type { Block } from "@startodel/core";
import type { forUser } from "@startodel/db";

export async function sidebarProgressFixture(owner: ReturnType<typeof forUser>) {
  const track = await owner.createTrack({ title: "React 19 с нуля", language: "ru" });
  const topics = await owner.upsertTopics(
    Array.from({ length: 9 }, (_, i) => ({ slug: "react-" + i, title: "React " + i })),
  );
  await owner.attachTopics(
    track.id,
    topics.map((topic) => topic.slug),
  );
  const topicId = topics[0]!.id;
  const quiz: Block = {
    id: "state",
    type: "quiz",
    questions: [
      { prompt: "Which hook stores state?", options: ["useState", "useEffect"], correctIndex: 0 },
    ],
  };
  const first = (await owner.createLesson({ topicId, title: "Hooks", blocks: [quiz] }))!;
  const last = (await owner.createLesson({ topicId, title: "State", blocks: [quiz] }))!;
  await owner.markLessonRead(first.id);
  await owner.recordQuizAttempt(first.id, quiz.id, [0], "ui");
  // Removing the unanswered Quiz leaves the first Quiz as the only one. The next
  // read re-evaluates that evidence and raises the Topic to the counted level, 2.
  await owner.updateLesson(last.id, { blocks: [] });
  return { track, last };
}
