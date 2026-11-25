import { publicBlock } from "@startodel/core";
import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { found, rowId } from "../../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  const { lesson, ...details } = found(await data.getLessonDetails(rowId(event)));
  const blocks = lesson.blocks.map(publicBlock);
  return { ...details, lesson: { ...lesson, blocks } };
});
