import { createError, defineHandler, readBody, setResponseStatus } from "nuxt/server";
import { z } from "zod";
import { TrackSlug } from "@startodel/core";
import { userData } from "../../lib/database";
import { found } from "../../utils/input";
export default defineHandler(async (event) => {
  const own = await userData(event);
  const input = z
    .strictObject({ login: z.string().min(1), slug: TrackSlug })
    .safeParse(await readBody(event));
  if (!input.success)
    throw createError({ status: 400, message: "Expected a login and Track Slug" });
  try {
    const copy = found(await own.forkTrack(input.data.login, input.data.slug));
    setResponseStatus(event, 201);
    return copy;
  } catch (error) {
    if (error instanceof RangeError) throw createError({ status: 400, message: error.message });
    throw error;
  }
});
