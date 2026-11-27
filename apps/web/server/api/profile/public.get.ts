import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { found } from "../../utils/input";

export default defineHandler(async (event) =>
  found(await (await userData(event)).getPublicProfileSettings()),
);
