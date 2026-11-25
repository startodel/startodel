import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Connection } from "./index.ts";
import { mcpTokens } from "./schema.ts";

const metadata = {
  id: mcpTokens.id,
  name: mcpTokens.name,
  prefix: mcpTokens.tokenPrefix,
  createdAt: mcpTokens.createdAt,
  lastUsedAt: mcpTokens.lastUsedAt,
  revokedAt: mcpTokens.revokedAt,
};

function hashToken(plaintext: string) {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function tokensForUser(db: Connection, userId: string) {
  const owned = eq(mcpTokens.userId, userId);
  return {
    async create(name: string) {
      const token = "sto_" + randomBytes(32).toString("base64url");
      const [row] = await db
        .insert(mcpTokens)
        .values({ userId, name, tokenPrefix: token.slice(0, 12), tokenHash: hashToken(token) })
        .returning(metadata);
      if (!row) throw new Error("MCP Token creation did not return a row");
      return { ...row, token };
    },
    list() {
      return db
        .select(metadata)
        .from(mcpTokens)
        .where(owned)
        .orderBy(mcpTokens.createdAt, mcpTokens.id);
    },
    async revoke(id: string) {
      const [row] = await db
        .update(mcpTokens)
        .set({ revokedAt: sql`coalesce(${mcpTokens.revokedAt}, now())` })
        .where(and(owned, eq(mcpTokens.id, id)))
        .returning({ id: mcpTokens.id });
      return row;
    },
  };
}

export async function resolveMcpToken(db: Connection, plaintext: string) {
  if (!/^sto_[A-Za-z0-9_-]{43}$/.test(plaintext)) return null;
  const [row] = await db
    .update(mcpTokens)
    .set({ lastUsedAt: sql`clock_timestamp()` })
    .where(and(eq(mcpTokens.tokenHash, hashToken(plaintext)), isNull(mcpTokens.revokedAt)))
    .returning({ userId: mcpTokens.userId });
  return row?.userId ?? null;
}
