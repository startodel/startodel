import { defineHandler } from "nuxt/server";
import { userData } from "../lib/database";
import { nextStep } from "../lib/next-step";
export default defineHandler(async (event) => nextStep(await userData(event)));
