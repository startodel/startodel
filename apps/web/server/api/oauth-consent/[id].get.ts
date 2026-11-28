import { createError, defineHandler, getRouterParam } from "nuxt/server";
import { pendingRequest } from "../../lib/oauth-http";
import { userData } from "../../lib/database";
export default defineHandler(async (event) => {
  const request = pendingRequest(await getUserSession(event));
  if (request && request.id === getRouterParam(event, "id")) {
    const preview = await (
      await userData(event)
    ).connections.preview(useRuntimeConfig().appSecret, request.id);
    if (preview) return preview;
  }
  throw createError({ status: 404 });
});
