type PracticeQuestion = {
  lessonId: string;
  blockId: string;
  index: number;
  prompt: string;
  options: string[];
};
type BlockResult = { lessonId: string; blockId: string; perQuestion: boolean[] };

/** Keep transport metadata out of UiQuiz. Only a successful submission supplies outcomes. */
export function practiceQuizProps(questions: PracticeQuestion[], results?: BlockResult[]) {
  const visible = questions.map(({ prompt, options }) => ({ prompt, options }));
  if (!results) return { questions: visible, result: undefined };
  const blocks = new Map(
    results.map((block) => [block.lessonId + "/" + block.blockId, block.perQuestion]),
  );
  return {
    questions: visible,
    result: {
      perQuestion: questions.map((q) => blocks.get(q.lessonId + "/" + q.blockId)![q.index]!),
    },
  };
}
