import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { found, readNonemptyString, rowId } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  return found(await data.updateTrack(rowId(event), await readNonemptyString(event, "title")));
});
