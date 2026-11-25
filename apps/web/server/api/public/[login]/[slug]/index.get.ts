import { defineHandler, getRouterParam } from "nuxt/server";
import { publicData } from "../../../../lib/public-reader";
import { found } from "../../../../utils/input";
export default defineHandler(async (event) =>
  found(await publicData().track(getRouterParam(event, "login")!, getRouterParam(event, "slug")!)),
);
