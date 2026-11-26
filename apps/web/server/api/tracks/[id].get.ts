import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
import { readTrackRef } from "../../utils/input";

export default defineHandler(async (event) => {
  const data = await userData(event);
  return readTrackRef(
    event,
    (id) => data.getTrack(id),
    (slug) => data.getTrackBySlug(slug),
  );
});
