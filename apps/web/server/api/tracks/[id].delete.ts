import { defineHandler, setResponseStatus } from "nuxt/server";
import { userData } from "../../lib/database";
import { found, trackId } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  found(await data.deleteTrack(trackId(event)));
  setResponseStatus(event, 204);
});
