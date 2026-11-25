import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { found, readTitle, trackId } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  return found(await data.updateTrack(trackId(event), await readTitle(event)));
});
