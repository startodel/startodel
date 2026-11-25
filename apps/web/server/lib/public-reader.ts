import { publicReader } from "@startodel/db";
import { database } from "./pool";
export const publicData = () => publicReader(database());
