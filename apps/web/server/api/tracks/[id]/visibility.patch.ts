import { createError, defineHandler, readBody } from "nuxt/server";
import { z } from "zod";
import { userData } from "../../../lib/database";
import { found, rowId } from "../../../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  const input = z
    .strictObject({ public: z.boolean(), acceptTerms: z.literal(true).optional() })
    .safeParse(await readBody(event));
  if (!input.success) throw createError({ status: 400, message: "Invalid visibility request" });
  try {
    return found(
      await data.setTrackVisibility(rowId(event), input.data.public, input.data.acceptTerms),
    );
  } catch (error) {
    if (error instanceof RangeError) throw createError({ status: 409, message: error.message });
    throw error;
  }
});
