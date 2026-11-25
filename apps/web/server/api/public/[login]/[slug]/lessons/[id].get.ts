import { defineHandler, getRouterParam } from "nuxt/server";
import { publicData } from "../../../../../lib/public-reader";
import { found, rowId } from "../../../../../utils/input";
export default defineHandler(async (event) =>
  found(
    await publicData().lesson(
      getRouterParam(event, "login")!,
      getRouterParam(event, "slug")!,
      rowId(event),
    ),
  ),
);
