import { defineHandler } from "nuxt/server";
import { userData } from "../../lib/database";
export default defineHandler(async (event) => (await userData(event)).listGrillSummaries());
