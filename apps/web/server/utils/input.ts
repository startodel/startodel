import { isUuid, TrackSlug } from "@startodel/core";
import { createError, getRouterParam, readBody, type RequestEvent } from "nuxt/server";

async function readOnlyField(event: RequestEvent, key: string): Promise<unknown> {
  const body = await readBody(event);
  if (
    typeof body !== "object" ||
    !body ||
    !Object.hasOwn(body, key) ||
    Object.keys(body).length !== 1
  ) {
    throw createError({ status: 400, message: `Expected only ${key}` });
  }
  return Reflect.get(body, key);
}

export async function readNonemptyString(event: RequestEvent, field: "title" | "name" | "answer") {
  const value = await readOnlyField(event, field);
  if (typeof value !== "string" || !value.trim())
    throw createError({ status: 400, message: `Expected a nonempty ${field}` });
  return value;
}

export async function readGoals(event: RequestEvent) {
  const goals = await readOnlyField(event, "goals");
  if (!Array.isArray(goals) || !goals.every((goal): goal is string => typeof goal === "string")) {
    throw createError({ status: 400, message: "Expected goals to be an array of strings" });
  }
  return goals;
}

export function rowId(event: RequestEvent, param = "id") {
  return parseRowId(getRouterParam(event, param));
}

export function parseRowId(id: string | undefined) {
  if (!id || !isUuid(id)) {
    throw createError({ status: 404, message: "Not found" });
  }
  return id;
}

export async function readTrackRef<T>(
  event: RequestEvent,
  byId: (id: string) => Promise<T | undefined>,
  bySlug: (slug: string) => Promise<T | undefined>,
) {
  const ref = getRouterParam(event, "id") ?? "";
  if (isUuid(ref)) {
    const track = await byId(ref);
    if (track) return track;
  }
  if (!TrackSlug.safeParse(ref).success) throw createError({ status: 404, message: "Not found" });
  return found(await bySlug(ref));
}

export function found<T>(row: T | undefined): T {
  if (!row) throw createError({ status: 404, message: "Not found" });
  return row;
}
