import { createHash, randomBytes } from "node:crypto";
import { test, expect } from "vite-plus/test";
import type { Database } from "@startodel/db";
import {
  OAuthMetadataSchema,
  OAuthTokensSchema,
  OAuthProtectedResourceMetadataSchema,
  OAuthClientInformationFullSchema,
} from "@modelcontextprotocol/sdk/shared/auth.js";

export function oauthHttpTests(
  env: () => {
    origin: string;
    publicOrigin: string;
    db: Database;
    mail: Map<string, { subject: string }>;
  },
  signIn: (login: string) => Promise<string>,
  restart: () => Promise<void>,
) {
  test("registration limits each IP independently", async () => {
    // Invalid metadata exercises the same rate bucket without leaving registered clients.
    const attempt = (ip: string) =>
      fetch(env().origin + "/oauth/register", {
        method: "POST",
        headers: { "x-forwarded-for": ip, "content-type": "application/json" },
        body: "{}",
      });
    for (let i = 0; i < 20; i++) expect((await attempt("192.0.2.21")).status).toBe(400);
    expect((await attempt("192.0.2.21")).status).toBe(429);
    expect((await attempt("192.0.2.22")).status).toBe(400);
  });
  test("discovery, consent, rotation across restart and immediate disconnection over HTTP", async () => {
    const { db, publicOrigin } = env();
    const get = (path: string, options: RequestInit = {}) =>
      fetch(env().origin + path, { redirect: "manual", ...options });
    const post = (
      path: string,
      fields: Record<string, string>,
      headers: Record<string, string> = {},
    ) => get(path, { method: "POST", body: new URLSearchParams(fields), headers });
    const resource = publicOrigin + "/mcp";
    const redirect = "https://chatgpt.com/connector_platform_oauth_redirect";
    const a = await signIn("alice");
    const b = await signIn("bob");
    const clients: string[] = [];
    const credential = (r: Response) =>
      r.headers
        .getSetCookie()
        .find((c) => c.startsWith("nuxt-auth-session="))!
        .split(";")[0]!;
    async function register(method: string) {
      const r = await get("/oauth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_name: "ChatGPT",
          redirect_uris: [redirect],
          token_endpoint_auth_method: method,
        }),
      });
      expect(r.status).toBe(201);
      const client = OAuthClientInformationFullSchema.parse(await r.json());
      clients.push(client.client_id);
      return client;
    }
    try {
      const metadata = OAuthMetadataSchema.parse(
        await (await get("/.well-known/oauth-authorization-server")).json(),
      );
      expect(metadata).toMatchObject({
        issuer: publicOrigin,
        registration_endpoint: publicOrigin + "/oauth/register",
        code_challenge_methods_supported: ["S256"],
      });
      for (const path of [
        "/.well-known/oauth-protected-resource",
        "/.well-known/oauth-protected-resource/mcp",
      ]) {
        const response = await get(path);
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(OAuthProtectedResourceMetadataSchema.parse(await response.json())).toMatchObject({
          resource,
          authorization_servers: [publicOrigin],
        });
      }
      expect((await get("/.well-known/openid-configuration")).status).toBe(404);
      for (const path of [
        "/oauth/register",
        "/oauth/token",
        "/.well-known/oauth-authorization-server",
      ]) {
        const preflight = await get(path, { method: "OPTIONS" });
        expect(preflight.status).toBe(204);
        expect(preflight.headers.get("access-control-allow-origin")).toBe("*");
      }
      const unauthorized = await get("/mcp");
      expect(unauthorized.status).toBe(401);
      expect(unauthorized.headers.get("www-authenticate")).toBe(
        `Bearer resource_metadata="${publicOrigin}/.well-known/oauth-protected-resource/mcp"`,
      );
      const client = await register("none");
      const fields = { client_id: client.client_id, resource };
      const verifier = randomBytes(32).toString("base64url");
      const auth = {
        ...fields,
        redirect_uri: redirect,
        response_type: "code",
        code_challenge: createHash("sha256").update(verifier).digest("base64url"),
        code_challenge_method: "S256",
        state: "opaque-state",
      };
      const start = (cookie: string, changes: Record<string, string> = {}) =>
        get("/oauth/authorize?" + new URLSearchParams({ ...auth, ...changes }), {
          headers: { cookie },
        });
      const errorRedirect = async (changes: Record<string, string>, error: string) => {
        const r = await start(b, changes);
        const callback = new URL(r.headers.get("location")!);
        expect(callback.searchParams.get("error")).toBe(error);
        expect(callback.searchParams.get("iss")).toBe(publicOrigin);
      };
      expect((await start("", { redirect_uri: redirect + "/other" })).status).toBe(400);
      await errorRedirect({ scope: "unknown" }, "invalid_scope");
      await errorRedirect({ code_challenge_method: "plain" }, "invalid_request");
      await errorRedirect({ resource: publicOrigin }, "invalid_target");
      const anon = await start("");
      expect(anon.headers.get("location")).toBe("/signin");
      // Continue the original request through the real GitHub state and Session replacement.
      const github = await get("/auth/github", { headers: { cookie: credential(anon) } });
      const state = new URL(github.headers.get("location")!).searchParams.get("state")!;
      const cookies = [
        credential(anon),
        ...github.headers.getSetCookie().map((c) => c.split(";")[0]),
      ].join("; ");
      const callback = await get("/auth/github?" + new URLSearchParams({ code: "bob", state }), {
        headers: { cookie: cookies },
      });
      const path = callback.headers.get("location")!;
      expect(path).toMatch(/^\/consent\?request=/);
      const request = new URL(path, publicOrigin).searchParams.get("request")!;
      const cookie = credential(callback);
      expect(await (await get(path, { headers: { cookie } })).text()).toContain(
        "Connect ChatGPT to Startodel?",
      );
      const decide = (choice: string, id: string, session: string, origin = publicOrigin) =>
        post("/oauth/decision", { [choice]: id }, { cookie: session, origin });
      expect((await decide("allow", request, a)).status).toBe(403);
      expect((await decide("allow", request, cookie, "https://other.example")).status).toBe(403);
      const approved = await decide("allow", request, cookie);
      expect(approved.status).toBe(303);
      const result = new URL(approved.headers.get("location")!);
      expect(result.origin + result.pathname).toBe(redirect);
      expect(result.searchParams.get("state")).toBe(auth.state);
      expect(result.searchParams.get("iss")).toBe(publicOrigin);
      const exchange = {
        ...fields,
        grant_type: "authorization_code",
        code: result.searchParams.get("code")!,
        code_verifier: verifier,
        redirect_uri: redirect,
      };
      const tokens = async (body: Record<string, string>) => {
        const response = await post("/oauth/token", body);
        expect(response.status).toBe(200);
        return OAuthTokensSchema.parse(await response.json());
      };
      expect(
        (await post("/oauth/token", { ...exchange, client_id: (await register("none")).client_id }))
          .status,
      ).toBe(400);
      expect((await post("/oauth/token", { ...exchange, resource: publicOrigin })).status).toBe(
        400,
      );
      const first = await tokens(exchange);
      expect(first).toMatchObject({ scope: "mcp", expires_in: 3600, token_type: "Bearer" });
      const call = (access: string) =>
        get("/mcp", {
          method: "POST",
          headers: {
            cookie: a,
            authorization: "Bearer " + access,
            accept: "application/json, text/event-stream",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: "get_profile", arguments: {} },
          }),
        });
      const profile = await (await call(first.access_token)).json();
      const me = await (await get("/api/me", { headers: { cookie: b } })).json();
      expect(JSON.parse(profile.result.content[0].text)).toMatchObject({
        userId: me.user.id,
        login: "bob",
      });
      const refresh = {
        ...fields,
        grant_type: "refresh_token",
        refresh_token: first.refresh_token!,
      };
      const rotated = await tokens(refresh);
      await restart();
      expect((await call(first.access_token)).status).toBe(200);
      const retried = await tokens(refresh);
      expect(retried.refresh_token).not.toBe(rotated.refresh_token);
      const final = await tokens({ ...refresh, refresh_token: retried.refresh_token! });
      expect((await call(final.access_token)).status).toBe(200);
      const connections = await (await get("/api/connections", { headers: { cookie: b } })).json();
      const grant = connections.find((c: { name: string }) => c.name === "ChatGPT");
      expect(grant.host).toBe("chatgpt.com");
      const disconnect = (session: string) =>
        get("/api/connections/" + grant.id, { method: "DELETE", headers: { cookie: session } });
      expect((await disconnect(a)).status).toBe(404);
      expect((await disconnect(b)).status).toBe(204);
      expect((await call(first.access_token)).status).toBe(401);
      expect((await post("/oauth/token", refresh)).status).toBe(400);

      const another = await start(a);
      const denyId = new URL(another.headers.get("location")!, publicOrigin).searchParams.get(
        "request",
      )!;
      const denied = await decide("deny", denyId, credential(another));
      expect(new URL(denied.headers.get("location")!).searchParams.get("error")).toBe(
        "access_denied",
      );
      const email = crypto.randomUUID() + "@example.test";
      try {
        const guest = await start("");
        const browser = credential(guest);
        const emailPost = (path: string, body: unknown) =>
          get("/api/auth/email/" + path, {
            method: "POST",
            headers: { cookie: browser, "content-type": "application/json" },
            body: JSON.stringify(body),
          });
        const challenge = await (await emailPost("request", { email, locale: "ru" })).json();
        await expect.poll(() => env().mail.has(email)).toBe(true);
        const verification = await emailPost("verify", {
          id: challenge.id,
          code: env()
            .mail.get(email)!
            .subject.match(/\d{6}$/)![0],
        });
        const destination = (await verification.json()).consent;
        expect(destination).toMatch(/^\/consent\?request=/);
        const consent = new URL(destination, publicOrigin);
        const emailCookie = credential(verification);
        const grant = await decide("allow", consent.searchParams.get("request")!, emailCookie);
        const pair = await tokens({
          ...exchange,
          code: new URL(grant.headers.get("location")!).searchParams.get("code")!,
        });
        const user = await (await get("/api/me", { headers: { cookie: emailCookie } })).json();
        const settings = await get("/ru/settings", { headers: { cookie: emailCookie } });
        expect(settings.status).toBe(200);
        expect(await settings.text()).toContain("Подключения");
        expect(
          JSON.parse((await (await call(pair.access_token)).json()).result.content[0].text).userId,
        ).toBe(user.user.id);
      } finally {
        await db.$client.query("delete from users where email=$1", [email]);
        await db.$client.query("delete from email_challenges where email=$1", [email]);
      }
      for (const method of ["client_secret_basic", "client_secret_post"]) {
        const confidential = await register(method);
        const basic = method === "client_secret_basic";
        const authFields = {
          client_id: confidential.client_id,
          ...(!basic && { client_secret: confidential.client_secret! }),
        };
        const headers: Record<string, string> = basic
          ? {
              authorization:
                "Basic " +
                Buffer.from(confidential.client_id + ":" + confidential.client_secret).toString(
                  "base64",
                ),
            }
          : {};
        const startPrivate = await start(b, { client_id: confidential.client_id });
        const id = new URL(startPrivate.headers.get("location")!, publicOrigin).searchParams.get(
          "request",
        )!;
        const decision = await decide("allow", id, credential(startPrivate));
        const code = new URL(decision.headers.get("location")!).searchParams.get("code")!;
        const tokenResponse = await post(
          "/oauth/token",
          { ...exchange, ...authFields, code },
          headers,
        );
        expect(tokenResponse.status).toBe(200);
        const pair = OAuthTokensSchema.parse(await tokenResponse.json());
        const token = basic ? pair.refresh_token! : pair.access_token;
        expect(
          (await post("/oauth/revoke", { client_id: confidential.client_id, token })).status,
        ).toBe(401);
        expect((await post("/oauth/revoke", { client_id: client.client_id, token })).status).toBe(
          200,
        );
        expect((await call(pair.access_token)).status).toBe(200);
        expect((await post("/oauth/revoke", { ...authFields, token }, headers)).status).toBe(200);
        expect((await call(pair.access_token)).status).toBe(401);
      }
    } finally {
      for (const table of ["oauth_connections", "oauth_requests", "oauth_clients"]) {
        const key = table === "oauth_clients" ? "id" : "client_id";
        await db.$client.query(`delete from ${table} where ${key}=any($1::uuid[])`, [clients]);
      }
    }
  }, 30000);
}
