import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { found } from "../../utils/input";

export default defineHandler(async (event) => ({
  handle: found(await (await userData(event)).getPublicHandle()),
}));
