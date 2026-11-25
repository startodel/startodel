import { defineHandler } from "nuxt/server";
import { userData } from "../lib/database";
import { found, readGoals } from "../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  return found(await data.updateProfile(await readGoals(event)));
});
