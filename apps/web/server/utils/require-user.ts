import { createError, type RequestEvent } from "nuxt/server";

export async function requireUser(event: RequestEvent) {
  const { user } = await getUserSession(event);
  if (!user?.id) throw createError({ status: 401, message: "Unauthorized" });
  return user.id;
}
