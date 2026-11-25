import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { found, rowId } from "../../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  const id = rowId(event);
  const grill = found(await data.getGrill(id));
  return { ...grill, reinforce: await data.reinforceTopics(id) };
});
