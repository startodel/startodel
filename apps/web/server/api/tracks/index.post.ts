import { defineHandler, setResponseStatus } from "nuxt/server";
import { userData } from "../../lib/database";
import { readNonemptyString } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  const track = await data.createTrack(await readNonemptyString(event, "title"));
  setResponseStatus(event, 201);
  return track;
});
