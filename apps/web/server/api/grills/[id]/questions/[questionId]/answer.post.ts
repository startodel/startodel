import { defineHandler, createError } from "nuxt/server";
import { userData } from "../../../../../lib/database";
import { found, readNonemptyString, rowId } from "../../../../../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  const result = found(
    await data.submitSessionAnswer(
      rowId(event),
      rowId(event, "questionId"),
      await readNonemptyString(event, "answer"),
    ),
  );
  if (result === "closed")
    throw createError({ status: 409, message: "This question no longer accepts answers" });
  return result;
});
