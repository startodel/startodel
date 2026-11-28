import { createError, defineHandler } from "nuxt/server";
import { mailTransportMode } from "../../lib/mail-transport";
import { userData } from "../../lib/database";
export default defineHandler(async (event) => {
  const data = await userData(event);
  if (mailTransportMode() === "unavailable")
    throw createError({
      status: 503,
      message: "Email sign-in unavailable",
      data: { reason: "unavailable" },
    });
  const user = await data.unlinkGitHub();
  if (!user)
    throw createError({ status: 409, message: "Email required", data: { reason: "lastMethod" } });
  await replaceUserSession(event, { user });
  return { ok: true };
});
