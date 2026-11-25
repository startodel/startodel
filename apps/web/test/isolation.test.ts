import { createHash } from "node:crypto";
import { fork, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

import { createDatabase, forUser } from "@startodel/db";
import { localGitHub } from "./github";

const url = process.env.DATABASE_URL_TEST;
describe.skipIf(!url)("HTTP authentication and Owner isolation", () => {
  let app: ChildProcess;
  let origin: string;
  let github: Awaited<ReturnType<typeof localGitHub>>;
  let db: ReturnType<typeof createDatabase>;

  function request(path: string, cookie = "", method = "GET", body?: unknown) {
    return fetch(origin + path, {
      method,
      redirect: "manual",
      headers: { cookie, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function signIn(login: string) {
    const start = await request("/auth/github");
    expect(start.status).toBe(302);
    const state = new URL(start.headers.get("location")!).searchParams.get("state");
    expect(state).toBeTruthy();
    const callback = await request(
      `/auth/github?code=${login}&state=${state}`,
      start.headers.getSetCookie()[0].split(";")[0],
    );
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/");
    const cookie = callback.headers
      .getSetCookie()
      .find((value) => value.startsWith("nuxt-auth-session="))!;
    expect(cookie).toContain("HttpOnly");
    return cookie.split(";")[0];
  }

  beforeAll(async () => {
    github = await localGitHub();
    db = createDatabase(url!);
    app = fork(new URL("./serve.mjs", import.meta.url), {
      execArgv: [],
      env: {
        ...process.env,
        DATABASE_URL: url,
        NUXT_OAUTH_GITHUB: JSON.stringify({
          clientId: "test-client",
          clientSecret: "test-secret",
          authorizationURL: github.origin + "/authorize",
          tokenURL: github.origin + "/token",
          apiURL: github.origin,
        }),
        NUXT_SESSION_PASSWORD: "test-only-session-password-at-least-32-characters",
      },
    });
    const [{ port }] = await Promise.race([
      once(app, "message"),
      once(app, "exit").then(([code]) => {
        throw new Error(`Test app exited with code ${code}`);
      }),
    ]);
    origin = `http://127.0.0.1:${port}`;
  }, 120_000);
  afterAll(async () => {
    if (app?.connected) app.disconnect();
    github?.close();
    if (db) {
      try {
        await db.$client.query("delete from users where github_id = any($1::bigint[])", [
          github.users.map((user) => user.id),
        ]);
      } finally {
        await db.$client.end();
      }
    }
  });

  test("health is public while Profile, Tracks and new API routes require a Session", async () => {
    expect(await (await fetch(origin + "/api/health")).json()).toEqual({ ok: true, db: "up" });
    for (const path of ["/api/profile", "/api/tracks", "/api/new-route", "/api/health/private"]) {
      expect((await fetch(origin + path)).status, path).toBe(401);
    }
  });

  test("the landing page requires sign-in and logout expires the sealed Session", async () => {
    expect((await request("/")).headers.get("location")).toBe("/login");
    expect(await (await request("/login")).text()).toContain("Sign in with GitHub");
    const cookie = await signIn("alice");
    const page = await request("/", cookie);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Alice");
    const { user } = await (await request("/api/_auth/session", cookie)).json();
    expect(user).toEqual({
      id: expect.any(String),
      login: "alice",
      name: "Alice",
      avatarUrl: github.users[0].avatar_url,
    });
    const logout = await request("/api/_auth/session", cookie, "DELETE");
    expect(logout.status).toBe(200);
    const expired = logout.headers
      .getSetCookie()
      .find((value) => value.startsWith("nuxt-auth-session="))!;
    expect(expired).toMatch(/max-age=0/i);
    expect((await request("/api/profile", expired.split(";")[0])).status).toBe(401);
  });

  test("each Session can read and change only its own Profile", async () => {
    const a = await signIn("alice");
    const b = await signIn("bob");
    const write = await request("/api/profile", b, "PATCH", { goals: ["Bob only"] });
    expect(write.status).toBe(200);
    const foreign = await write.json();
    expect(await (await request("/api/profile", a)).json()).toMatchObject({ goals: [] });
    expect((await request(`/api/profile/${foreign.id}`, a)).status).toBe(404);
    expect((await request(`/api/profile?userId=${foreign.userId}`, a)).status).toBe(400);
    expect(
      (await request("/api/profile", a, "PATCH", { userId: foreign.userId, goals: [] })).status,
    ).toBe(400);
    expect(await (await request("/api/profile", b)).json()).toEqual(foreign);
  });

  test("foreign and missing Tracks return 404 for GET, PATCH and DELETE and leave the Owner's row intact", async () => {
    const a = await signIn("alice");
    const b = await signIn("bob");
    const mine = await request("/api/tracks", a, "POST", { title: "Alice only" });
    expect(mine.status).toBe(201);
    const own = await mine.json();
    const created = await request("/api/tracks", b, "POST", { title: "Bob only" });
    expect(created.status).toBe(201);
    const foreign = await created.json();
    const bob = forUser(db, foreign.userId);
    const before = await bob.getTrack(foreign.id);
    expect(before).toMatchObject({ title: "Bob only" });
    expect(await (await request("/api/tracks", a)).json()).toEqual([own]);
    for (const id of [foreign.id, crypto.randomUUID()]) {
      for (const method of ["GET", "PATCH", "DELETE"]) {
        const response = await request(
          `/api/tracks/${id}`,
          a,
          method,
          method === "PATCH" ? { title: "changed" } : undefined,
        );
        expect(response.status).toBe(404);
      }
    }
    expect(await bob.getTrack(foreign.id)).toEqual(before);
    expect(
      (await request("/api/tracks", a, "POST", { title: "invalid", userId: foreign.userId }))
        .status,
    ).toBe(400);
    expect((await request(`/api/tracks/${own.id}`, a, "PATCH", { title: "updated" })).status).toBe(
      200,
    );
    expect((await request(`/api/tracks/${own.id}`, a, "DELETE")).status).toBe(204);
  });

  async function issueToken(cookie: string) {
    const issued = await request("/api/mcp-tokens", cookie, "POST", { name: "Learning agent" });
    expect(issued.status).toBe(201);
    return issued.json() as Promise<{ token: string; id: string; prefix: string }>;
  }

  test("a Session creates an MCP Token once and lists only its metadata", async () => {
    const a = await signIn("alice");
    const { token, id, prefix } = await issueToken(a);
    expect(/^sto_[A-Za-z0-9_-]{43}$/.test(token)).toBe(true);
    expect(token.startsWith(prefix) && prefix.length < token.length).toBe(true);
    const {
      rows: [stored],
    } = await db.$client.query("select * from mcp_tokens where id = $1", [id]);
    expect(JSON.stringify(stored).includes(token)).toBe(false);
    expect(stored.token_hash === createHash("sha256").update(token).digest("hex")).toBe(true);
    expect(stored.token_prefix).toBe(prefix);
    const listed = await request("/api/mcp-tokens", a);
    expect(listed.status).toBe(200);
    expect(await listed.json()).toContainEqual({
      id,
      prefix,
      name: "Learning agent",
      createdAt: expect.any(String),
      lastUsedAt: null,
      revokedAt: null,
    });
  });
});
