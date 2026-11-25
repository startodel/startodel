import { defineHandler, setResponseStatus } from "nuxt/server";
import { userData } from "../../lib/database";
import { readTitle } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  const track = await data.createTrack(await readTitle(event));
  setResponseStatus(event, 201);
  return track;
});
