import { defineHandler, setResponseStatus } from "nuxt/server";
import { userData } from "../../lib/database";
import { readTrackInput, trackInput } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  const track = await data.createTrack(await readTrackInput(event, trackInput));
  setResponseStatus(event, 201);
  return track;
});
