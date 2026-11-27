import { PublicProfilePatch } from "@startodel/core";
import { createError, defineHandler, readBody } from "nuxt/server";
import { userData } from "../../lib/database";
import { found } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  const patch = PublicProfilePatch.safeParse(await readBody(event));
  if (!patch.success) throw createError({ status: 400, message: "Invalid public profile" });
  try {
    return found(await data.updatePublicProfile(patch.data));
  } catch (error) {
    if (error instanceof RangeError)
      throw createError({
        status: error.message === "Track not found" ? 404 : 409,
        message: error.message,
      });
    throw error;
  }
});
