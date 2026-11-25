import { defineHandler } from "nuxt/server";
import { userData } from "../../../lib/database";
import { found, rowId } from "../../../utils/input";
export default defineHandler(async (event) =>
  found(await (await userData(event)).getPractice(rowId(event, "topicId"))),
);
