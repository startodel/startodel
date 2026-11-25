import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { found, rowId } from "../../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  return found(await data.getTopicDetails(rowId(event)));
});
