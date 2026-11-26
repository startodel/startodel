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
  if (!id || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    throw createError({ status: 404, message: "Not found" });
  }
  return id;
}

export function found<T>(row: T | undefined): T {
  if (!row) throw createError({ status: 404, message: "Not found" });
  return row;
}
