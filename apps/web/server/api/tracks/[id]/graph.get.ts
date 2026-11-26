import { defineHandler } from "nuxt/server";
import { userData } from "../../../lib/database";
import { readTrackRef } from "../../../utils/input";
export default defineHandler(async (event) => {
  const data = await userData(event);
  const graph = await readTrackRef(
    event,
    (id) => data.getTrackGraph(id),
    (slug) => data.getTrackGraph({ slug }),
  );
  return { ...graph, termsAcceptance: await data.termsAcceptance() };
});
