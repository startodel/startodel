import { defineHandler, setResponseStatus } from "nuxt/server";
import { userData } from "../../lib/database";
import { found, rowId } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  found(await data.connections.revoke(rowId(event)));
  setResponseStatus(event, 204);
});
