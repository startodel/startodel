import { defineHandler, readBody, getRouterParam, createError } from "nuxt/server";
import { z } from "zod";
import { userData } from "../../../../lib/database";
import { found, rowId } from "../../../../utils/input";
const submission = z.strictObject({ answers: z.array(z.int().nonnegative()).min(1).max(3) });
export default defineHandler(async (event) => {
  const data = await userData(event);
  const input = submission.safeParse(await readBody(event));
  if (!input.success)
    throw createError({ status: 400, message: "Expected an option index for each question" });
  try {
    const { correct, total, perQuestion, mastery } = found(
      await data.recordQuizAttempt(
        rowId(event),
        getRouterParam(event, "blockId")!,
        input.data.answers,
        "ui",
      ),
    );
    return { correct, total, perQuestion, mastery };
  } catch (error) {
    if (error instanceof RangeError) throw createError({ status: 400, message: error.message });
    throw error;
  }
});
