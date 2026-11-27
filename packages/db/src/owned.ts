import { and, eq } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { Database } from "./index.ts";

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export const ownedId = (
  table: { userId: AnyPgColumn; id: AnyPgColumn },
  userId: string,
  id: string,
) => and(eq(table.userId, userId), eq(table.id, id));

export type CatalogKey = string | { slug: string };
export function ownedCatalogRow(
  table: { userId: AnyPgColumn; id: AnyPgColumn; slug: AnyPgColumn },
  userId: string,
  key: CatalogKey,
) {
  return typeof key === "string"
    ? ownedId(table, userId, key)
    : and(eq(table.userId, userId), eq(table.slug, key.slug));
}

// A composite FK treats missing and foreign parents identically, including concurrent deletes.
export async function referencedRows<T>(write: PromiseLike<T[]>): Promise<T[] | undefined> {
  try {
    return await write;
  } catch (error) {
    if (
      error instanceof Error &&
      error.cause &&
      typeof error.cause === "object" &&
      "code" in error.cause &&
      error.cause.code === "23503"
    )
      return undefined;
    throw error;
  }
}

export async function referencedRow<T>(write: PromiseLike<T[]>): Promise<T | undefined> {
  return (await referencedRows(write))?.[0];
}
