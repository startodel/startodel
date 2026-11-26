import { QuizAnswers } from "@startodel/core";
import { defineHandler, readBody, createError } from "nuxt/server";
import { z } from "zod";
import { userData } from "../../../lib/database";
import { found, rowId } from "../../../utils/input";
const submission = z.strictObject({
  revision: z.string().regex(/^[a-f0-9]{64}$/),
  answers: z
    .array(
      z.strictObject({
        lessonId: z.guid(),
        blockId: z.string().min(1).max(64),
        answers: QuizAnswers,
      }),
    )
    .min(1),
});
export default defineHandler(async (event) => {
  const data = await userData(event);
  const topicId = rowId(event, "topicId");
  const input = submission.safeParse(await readBody(event));
  if (!input.success)
    throw createError({ status: 400, message: "Expected a Practice Quiz submission" });
  try {
    const result = found(
      await data.submitPractice(topicId, input.data.revision, input.data.answers),
    );
    if (result === "stale")
      throw createError({
        status: 409,
        message: "The review has changed. Start a fresh Practice Quiz.",
      });
    return result;
  } catch (error) {
    if (error instanceof RangeError) throw createError({ status: 400, message: error.message });
    throw error;
  }
});
