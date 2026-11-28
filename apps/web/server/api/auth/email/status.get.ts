import { defineHandler } from "nuxt/server";
import { mailTransportMode } from "../../../lib/mail-transport";

export default defineHandler(() => ({ available: mailTransportMode() !== "unavailable" }));
