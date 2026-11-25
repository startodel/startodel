import { defineHandler, setResponseStatus } from "nuxt/server";
import { userData } from "../../lib/database";
import { readNonemptyString } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  const issued = await data.mcpTokens.create(await readNonemptyString(event, "name"));
  setResponseStatus(event, 201);
  return issued;
});
