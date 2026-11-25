import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { found, rowId } from "../../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  const { lesson, ...details } = found(await data.getLessonDetails(rowId(event)));
  const blocks = lesson.blocks.map((block) => {
    if (block.type === "quiz")
      return {
        ...block,
        questions: block.questions.map(({ prompt, options }) => ({ prompt, options })),
      };
    if (block.type === "exercise")
      return { type: block.type, id: block.id, prompt: block.prompt, hints: block.hints };
    return block;
  });
  return { ...details, lesson: { ...lesson, blocks } };
});
