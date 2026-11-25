import { defineHandler, getRouterParam } from "nuxt/server";
import { userData } from "../../../../../lib/database";
import { found, rowId } from "../../../../../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  const lesson = found(await data.getLesson(rowId(event)));
  const block = lesson.blocks.find((b) => b.id === getRouterParam(event, "blockId"));
  return { solution: found(block?.type === "exercise" ? block.solution : undefined) };
});
