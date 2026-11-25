import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";

export default defineHandler(async (event) => {
  const data = await userData(event);
  return data.listTracks();
});
