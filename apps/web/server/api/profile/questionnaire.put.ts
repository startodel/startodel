import { defineHandler, readBody, createError } from "nuxt/server";
import { z } from "zod";
import { ProfileQuestionnaire } from "@startodel/core";
import { userData } from "../../lib/database";
import { found } from "../../utils/input";
const choices = z.array(z.string().trim().min(1)).min(1);
const questionnaire = z.strictObject({
  yearsOfExperience: ProfileQuestionnaire.shape.yearsOfExperience.optional(),
  notes: ProfileQuestionnaire.shape.notes.optional(),
  stack: choices,
  goals: choices,
  experience: ProfileQuestionnaire.shape.experience.unwrap(),
});
export default defineHandler(async (event) => {
  const data = await userData(event);
  const input = questionnaire.safeParse(await readBody(event));
  if (!input.success)
    throw createError({ status: 400, message: "Choose a stack, a goal and a grade." });
  return found(await data.updateProfile({ ...input.data, onboardedAt: new Date() }));
});
