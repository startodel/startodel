import { defineHandler, useRuntimeConfig } from "nuxt/server";
import { userData } from "../lib/database";
import { found } from "../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  const profile = found(await data.getProfile());
  const { user } = await getUserSession(event);
  const callback = useRuntimeConfig().oauth.github.redirectURL;
  return {
    user,
    profile,
    onboarded: profile.onboardedAt !== null,
    mcpUrl: new URL("/mcp", callback || event.req.url).href,
  };
});
