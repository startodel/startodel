import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import type { Connection, Database } from "./index.ts";
import { ownedId } from "./owned.ts";
import {
  oauthClients as clients,
  oauthConnections as grants,
  oauthRefreshTokens as tokens,
  oauthRequests as requests,
  type ClientAuthMethod,
} from "./schema.ts";

const opaque = () => randomBytes(32).toString("base64url");
function oauthDigest(
  appSecret: string,
  purpose: "client_secret" | "request" | "code" | "refresh_token",
  value: string,
) {
  if (!appSecret) throw new Error("NUXT_APP_SECRET is required");
  const key = createHmac("sha256", appSecret).update("startodel:oauth:v1").digest();
  return createHmac("sha256", key)
    .update(purpose + "\0")
    .update(value)
    .digest("hex");
}

const active = and(
  isNull(grants.revokedAt),
  gt(grants.lastUsedAt, sql`now() - interval '90 days'`),
);
const usedNow = sql`clock_timestamp()`;

export async function registerOAuthClient(
  db: Database,
  appSecret: string,
  input: {
    name?: string;
    redirectUris: string[];
    authMethod: ClientAuthMethod;
  },
) {
  const secret = input.authMethod === "none" ? undefined : opaque();
  const [client] = await db
    .insert(clients)
    .values({ ...input, secretHash: secret && oauthDigest(appSecret, "client_secret", secret) })
    .returning({ id: clients.id, createdAt: clients.createdAt });
  return { ...client!, secret };
}

export async function oauthClient(db: Database, id: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  return client;
}

export async function authenticateOAuthClient(
  db: Database,
  appSecret: string,
  id: string,
  method: ClientAuthMethod,
  secret?: string,
) {
  const client = await oauthClient(db, id);
  if (!client || client.authMethod !== method) return false;
  if (method === "none") return secret === undefined;
  return (
    !!secret &&
    !!client.secretHash &&
    timingSafeEqual(
      Buffer.from(client.secretHash, "hex"),
      Buffer.from(oauthDigest(appSecret, "client_secret", secret), "hex"),
    )
  );
}

type Authorization = Pick<
  typeof requests.$inferInsert,
  "clientId" | "redirectUri" | "resource" | "challenge" | "state"
>;
export async function beginAuthorization(db: Database, appSecret: string, input: Authorization) {
  const request = opaque();
  await db.transaction(async (tx) => {
    await tx.delete(requests).where(lt(requests.expiresAt, usedNow));
    await tx
      .insert(requests)
      .values({ ...input, hash: oauthDigest(appSecret, "request", request) });
  });
  return request;
}

function pending(appSecret: string, request: string) {
  return and(
    eq(requests.hash, oauthDigest(appSecret, "request", request)),
    gt(requests.expiresAt, usedNow),
  );
}

export function connectionsForUser(db: Connection, userId: string) {
  return {
    async preview(appSecret: string, request: string) {
      const [row] = await db
        .select({ name: clients.name, redirectUri: requests.redirectUri })
        .from(requests)
        .innerJoin(clients, eq(clients.id, requests.clientId))
        .where(pending(appSecret, request));
      if (row) return { name: row.name, host: new URL(row.redirectUri).host };
    },
    decide(appSecret: string, request: string, allow: boolean) {
      return db.transaction(async (tx) => {
        const [input] = await tx.delete(requests).where(pending(appSecret, request)).returning();
        if (!input) return;
        const { clientId, redirectUri, resource, challenge, state } = input;
        let code: string | undefined;
        if (allow) {
          code = opaque();
          await tx.insert(grants).values({
            clientId,
            redirectUri,
            resource,
            challenge,
            userId,
            codeHash: oauthDigest(appSecret, "code", code),
          });
        }
        return { redirectUri, state, code };
      });
    },
    async list() {
      const rows = await db
        .select({
          id: grants.id,
          name: clients.name,
          redirectUri: grants.redirectUri,
          createdAt: grants.createdAt,
          lastUsedAt: grants.lastUsedAt,
        })
        .from(grants)
        .innerJoin(clients, eq(clients.id, grants.clientId))
        .where(
          and(
            eq(grants.userId, userId),
            active,
            or(sql`${grants.exchangedAt} is not null`, gt(grants.codeExpiresAt, usedNow)),
          ),
        )
        .orderBy(desc(grants.createdAt));
      return rows.map(({ redirectUri, ...row }) => ({ ...row, host: new URL(redirectUri).host }));
    },
    async revoke(id: string) {
      const [row] = await db
        .update(grants)
        .set({ revokedAt: usedNow })
        .where(ownedId(grants, userId, id))
        .returning({ id: grants.id });
      return row;
    },
  };
}

type Grant = typeof grants.$inferSelect;
async function issueRefresh(db: Connection, appSecret: string, grant: Grant) {
  const refreshToken = opaque();
  await db.insert(tokens).values({
    hash: oauthDigest(appSecret, "refresh_token", refreshToken),
    userId: grant.userId,
    connectionId: grant.id,
  });
  return {
    userId: grant.userId,
    clientId: grant.clientId,
    grantId: grant.id,
    resource: grant.resource,
    refreshToken,
  };
}

export function exchangeOAuthCode(
  db: Database,
  appSecret: string,
  input: {
    clientId: string;
    resource: string;
    redirectUri: string;
    code: string;
    verifier: string;
  },
) {
  const challenge = createHash("sha256").update(input.verifier).digest("base64url");
  return db.transaction(async (tx) => {
    const [grant] = await tx
      .select()
      .from(grants)
      .where(
        and(
          eq(grants.codeHash, oauthDigest(appSecret, "code", input.code)),
          eq(grants.clientId, input.clientId),
          eq(grants.redirectUri, input.redirectUri),
          eq(grants.resource, input.resource),
          eq(grants.challenge, challenge),
          isNull(grants.revokedAt),
        ),
      )
      .for("update");
    if (!grant) return;
    const owned = ownedId(grants, grant.userId, grant.id);
    if (grant.exchangedAt) {
      await tx.update(grants).set({ revokedAt: usedNow }).where(owned);
      return;
    }
    if (grant.codeExpiresAt.getTime() <= Date.now()) return;
    await tx.update(grants).set({ exchangedAt: usedNow, lastUsedAt: usedNow }).where(owned);
    return issueRefresh(tx, appSecret, grant);
  });
}

export function refreshOAuthGrant(
  db: Database,
  appSecret: string,
  clientId: string,
  resource: string,
  refresh: string,
) {
  const fingerprint = eq(tokens.hash, oauthDigest(appSecret, "refresh_token", refresh));
  return db.transaction(async (tx) => {
    // Serialize every generation on the parent, then read rotation time in a fresh statement.
    const [row] = await tx
      .select({ grant: grants })
      .from(tokens)
      .innerJoin(grants, and(eq(grants.id, tokens.connectionId), eq(grants.userId, tokens.userId)))
      .where(and(fingerprint, eq(grants.clientId, clientId), eq(grants.resource, resource), active))
      .for("update", { of: grants });
    if (!row) return;
    const { grant } = row;
    const owned = ownedId(grants, grant.userId, grant.id);
    const family = and(eq(tokens.connectionId, grant.id), eq(tokens.userId, grant.userId));
    const [token] = await tx
      .select({
        late: sql<boolean>`${tokens.rotatedAt} <= clock_timestamp() - interval '60 seconds'`,
      })
      .from(tokens)
      .where(and(family, fingerprint));
    if (!token || token.late) {
      await tx.update(grants).set({ revokedAt: usedNow }).where(owned);
      return;
    }
    await tx
      .update(tokens)
      .set({ rotatedAt: usedNow })
      .where(and(family, isNull(tokens.rotatedAt)));
    await tx.update(grants).set({ lastUsedAt: usedNow }).where(owned);
    return issueRefresh(tx, appSecret, grant);
  });
}

export async function hasOAuthConnection(db: Connection, userId: string) {
  const [row] = await db
    .select({ id: grants.id })
    .from(grants)
    .where(and(eq(grants.userId, userId), active, sql`${grants.exchangedAt} is not null`))
    .limit(1);
  return !!row;
}

export type AccessGrant = { userId: string; grantId: string; clientId: string; resource: string };
function matchingGrant(access: AccessGrant) {
  return and(
    ownedId(grants, access.userId, access.grantId),
    eq(grants.clientId, access.clientId),
    eq(grants.resource, access.resource),
  );
}
export async function useOAuthAccess(db: Database, access: AccessGrant) {
  const [row] = await db
    .update(grants)
    .set({ lastUsedAt: usedNow })
    .where(and(matchingGrant(access), active))
    .returning({ userId: grants.userId });
  return row?.userId ?? null;
}
export async function revokeOAuthAccess(db: Database, access: AccessGrant) {
  await db.update(grants).set({ revokedAt: usedNow }).where(matchingGrant(access));
}
export async function revokeOAuthRefresh(
  db: Database,
  appSecret: string,
  clientId: string,
  refresh: string,
) {
  await db
    .update(grants)
    .set({ revokedAt: usedNow })
    .where(
      and(
        eq(grants.clientId, clientId),
        sql`exists (
    select 1 from ${tokens} where ${tokens.hash} = ${oauthDigest(appSecret, "refresh_token", refresh)} and ${tokens.userId} = ${grants.userId} and ${tokens.connectionId} = ${grants.id})`,
      ),
    );
}
