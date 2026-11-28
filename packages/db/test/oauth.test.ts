import { createHash, randomBytes, randomInt } from "node:crypto";
import { test, expect } from "vite-plus/test";
import {
  authenticateOAuthClient,
  beginAuthorization,
  createDatabase,
  exchangeOAuthCode,
  forUser,
  oauthClient,
  refreshOAuthGrant,
  registerOAuthClient,
  revokeOAuthRefresh,
  signInWithGitHub,
  useOAuthAccess,
} from "@startodel/db";

const url = process.env.DATABASE_URL_TEST;
test.skipIf(!url)(
  "Connection lifetime, single-use codes, refresh grace and Owner revocation",
  async () => {
    const db = createDatabase(url!);
    const appSecret = randomBytes(32).toString("hex");
    const otherAppSecret = randomBytes(32).toString("hex");
    const client = await registerOAuthClient(db, appSecret, {
      name: "Test",
      authMethod: "client_secret_post",
      redirectUris: ["https://example.test/return"],
    });
    const id = BigInt(-randomInt(1, 2 ** 46));
    const identity = { githubId: id, login: "grant-owner", name: null, avatarUrl: null };
    const owner = await signInWithGitHub(db, identity);
    const other = await signInWithGitHub(db, {
      ...identity,
      githubId: id - 1n,
      login: "other-grant-owner",
    });
    const connections = forUser(db, owner.id).connections;
    const resource = "https://startodel.example/mcp";
    const clientId = client.id;
    const verifier = randomBytes(32).toString("base64url");
    const params = { clientId, redirectUri: "https://example.test/return", resource, verifier };
    const authorize = async () => {
      const request = await beginAuthorization(db, appSecret, {
        ...params,
        challenge: createHash("sha256").update(verifier).digest("base64url"),
      });
      expect(await connections.preview(otherAppSecret, request)).toBeUndefined();
      const approved = await connections.decide(appSecret, request, true);
      expect(await connections.decide(appSecret, request, true)).toBeUndefined();
      return { ...params, code: approved!.code! };
    };
    const exchange = async () => (await exchangeOAuthCode(db, appSecret, await authorize()))!;
    const refresh = (value: string) => refreshOAuthGrant(db, appSecret, clientId, resource, value);
    try {
      await db.$client.query(
        "update oauth_clients set created_at=now()-interval '10 years' where id=$1",
        [clientId],
      );
      expect((await oauthClient(db, clientId))?.secretHash).toMatch(/^[0-9a-f]{64}$/);
      expect(
        await authenticateOAuthClient(
          db,
          otherAppSecret,
          clientId,
          "client_secret_post",
          client.secret,
        ),
      ).toBe(false);
      expect(
        await authenticateOAuthClient(db, appSecret, clientId, "client_secret_post", client.secret),
      ).toBe(true);
      const expired = await authorize();
      await db.$client.query(
        "update oauth_connections set code_expires_at=now() where user_id=$1",
        [owner.id],
      );
      expect(await exchangeOAuthCode(db, appSecret, expired)).toBeUndefined();
      const code = await authorize();
      for (const change of [
        { verifier: verifier + "x" },
        { clientId: crypto.randomUUID() },
        { resource: resource + "/other" },
        { redirectUri: "https://example.test/other" },
      ])
        expect(await exchangeOAuthCode(db, appSecret, { ...code, ...change })).toBeUndefined();
      expect(await exchangeOAuthCode(db, otherAppSecret, code)).toBeUndefined();
      const issued = (await exchangeOAuthCode(db, appSecret, code))!;
      expect(await useOAuthAccess(db, issued)).toBe(owner.id);
      expect(await exchangeOAuthCode(db, appSecret, code)).toBeUndefined();
      expect(await useOAuthAccess(db, issued)).toBeNull();
      expect(await refresh(issued.refreshToken)).toBeUndefined();

      const first = await exchange();
      expect(
        await refreshOAuthGrant(db, otherAppSecret, clientId, resource, first.refreshToken),
      ).toBeUndefined();
      await revokeOAuthRefresh(db, otherAppSecret, clientId, first.refreshToken);
      const [next, retry] = await Promise.all([
        refresh(first.refreshToken),
        refresh(first.refreshToken),
      ]);
      expect(next!.refreshToken).not.toBe(retry!.refreshToken);
      for (const pair of [next!, retry!]) {
        expect(await useOAuthAccess(db, pair)).toBe(owner.id);
        expect(await refresh(pair.refreshToken)).toBeDefined();
      }
      await db.$client.query(
        "update oauth_refresh_tokens set rotated_at=now()-interval '61 seconds' where user_id=$1 and connection_id=$2 and rotated_at is not null",
        [owner.id, first.grantId],
      );
      expect(await refresh(first.refreshToken)).toBeUndefined();
      expect(await useOAuthAccess(db, retry!)).toBeNull();

      const idle = await exchange();
      await db.$client.query(
        "update oauth_connections set last_used_at=now()-interval '90 days' where id=$1",
        [idle.grantId],
      );
      expect(await useOAuthAccess(db, idle)).toBeNull();
      expect(await refresh(idle.refreshToken)).toBeUndefined();

      const active = await exchange();
      const foreign = forUser(db, other.id).connections;
      expect(await foreign.list()).toEqual([]);
      expect(await foreign.revoke(active.grantId)).toBeUndefined();
      await expect(
        db.$client.query(
          "insert into oauth_refresh_tokens(hash,user_id,connection_id,rotated_at) values ('foreign',$1,$2,now())",
          [other.id, active.grantId],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      expect(await connections.list()).toEqual([
        expect.objectContaining({ id: active.grantId, host: "example.test" }),
      ]);
      await connections.revoke(active.grantId);
      expect(await useOAuthAccess(db, active)).toBeNull();
      expect(await refresh(active.refreshToken)).toBeUndefined();
    } finally {
      await db.$client.query("delete from users where id=any($1)", [[owner.id, other.id]]);
      await db.$client.query("delete from oauth_clients where id=$1", [clientId]);
      await db.$client.end();
    }
  },
);
