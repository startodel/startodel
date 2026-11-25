import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { createHash } from "node:crypto";
import { fork, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

import { createDatabase, forUser } from "@startodel/db";
import { localGitHub } from "./github";
import { publicHttpTests } from "./public-http";
import { practiceHttpTests } from "./practice-http";
import { learningMcpTests } from "./learning-mcp";

const url = process.env.DATABASE_URL_TEST;
describe.skipIf(!url)("HTTP authentication and Owner isolation", () => {
  const publicOrigin = "https://startodel.example";
  let app: ChildProcess;
  let origin: string;
  let github: Awaited<ReturnType<typeof localGitHub>>;
  let db: ReturnType<typeof createDatabase>;

  learningMcpTests(() => ({ db, origin }));

  function request(path: string, cookie = "", method = "GET", body?: unknown) {
    return fetch(origin + path, {
      method,
      redirect: "manual",
      headers: { cookie, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
  }

  publicHttpTests(() => ({ db, origin }), request, signIn);
  practiceHttpTests(() => ({ db, origin }), request, signIn);

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
        NUXT_OAUTH_GITHUB_REDIRECT_URL: publicOrigin + "/auth/github",
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

  test("the design showcase is not served unless its flag is set", async () => {
    for (const path of ["/design", "/design/components", "/design/og", "/en/design"]) {
      const response = await request(path);
      expect(response.headers.get("location"), path).toBe(
        path.startsWith("/en") ? "/en/login" : "/login",
      );
      expect(await response.text(), path).not.toContain("s-root");
    }
  });

  test("the landing page requires sign-in and logout expires the sealed Session", async () => {
    expect((await request("/")).headers.get("location")).toBe("/login");
    expect(await (await request("/login")).text()).toContain("Войти через GitHub");
    expect(await (await request("/en/login")).text()).toContain("Sign in with GitHub");
    expect((await request("/", "startodel_language=en")).headers.get("location")).toBe("/en/login");
    for (const prefix of ["", "/en"]) {
      for (const path of [
        "/settings",
        "/progress",
        "/grills",
        "/onboarding",
        "/reviews",
        "/tracks/unknown",
      ]) {
        const response = await request(prefix + path);
        expect(response.headers.get("location"), prefix + path).toBe(prefix + "/login");
        expect(response.headers.get("cache-control")).toContain("no-store");
      }
      expect((await request(prefix + "/api/profile")).status).toBe(401);
    }
    const cookie = await signIn("alice");
    const page = await request("/", cookie);
    expect(page.headers.get("location")).toBe("/onboarding");
    for (const path of [
      "/settings",
      "/tracks/" + crypto.randomUUID(),
      "/lessons/" + crypto.randomUUID(),
      "/login",
    ]) {
      expect((await request(path, cookie)).headers.get("location"), path).toBe("/onboarding");
    }
    expect((await request("/onboarding", cookie)).status).toBe(200);
    const html = await (await request("/onboarding", cookie)).text();
    expect(html).toContain("Alice");
    expect(html).toContain("С какими технологиями вы работаете?");
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

  test("learning pages and writes bind each Session to its own Profile, Track, Topic and Lesson", async () => {
    const a = await signIn("alice");
    const b = await signIn("bob");
    const me = await (await request("/api/me", b)).json();
    expect(me).toMatchObject({
      user: { login: "bob" },
      onboarded: false,
      mcpUrl: publicOrigin + "/mcp",
    });
    const bob = forUser(db, me.user.id);
    const track = await bob.createTrack("Private learning");
    const topic = await bob.upsertTopic({ slug: "queues", title: "Queues" });
    await bob.attachTopicToTrack(track.id, topic.id, 0);
    await bob.recordReviewResult(topic.id, "weak");
    await db.$client.query(
      "update review_items set due_at = now() where user_id = $1 and topic_id = $2",
      [me.user.id, topic.id],
    );
    expect((await (await request("/api/dashboard", a)).json()).dueReviewsCount).toBe(0);
    expect((await (await request("/api/dashboard", b)).json()).dueReviewsCount).toBe(1);
    const lesson = (await bob.createLesson({
      topicId: topic.id,
      title: "Delivery",
      blocks: [
        {
          type: "quiz",
          id: "q",
          questions: [{ prompt: "Pick", options: ["A", "B"], correctIndex: 1 }],
        },
      ],
    }))!;
    const questionnaire = { stack: ["Rust"], goals: ["Learn"], experience: "junior" };
    const routes = (trackId: string, topicId: string, lessonId: string) =>
      [
        ["/api/tracks/" + trackId + "/graph", "GET"],
        ["/api/topics/" + topicId, "GET"],
        ["/api/lessons/" + lessonId, "GET"],
        ["/api/lessons/" + lessonId + "/read", "POST"],
        ["/api/lessons/" + lessonId + "/quiz/q", "POST", { answers: [1] }],
      ] as const;
    const own = routes(track.id, topic.id, lesson.id);
    for (const [path, method, body] of [
      ...own,
      ["/api/me", "GET"],
      ["/api/dashboard", "GET"],
      ["/api/profile/questionnaire", "PUT", questionnaire],
    ] as const) {
      expect((await request(path, "", method, body)).status, path).toBe(401);
    }
    const missing = crypto.randomUUID();
    for (const [path, method, body] of [...own, ...routes(missing, missing, missing)]) {
      expect((await request(path, a, method, body)).status, path).toBe(404);
    }
    for (const path of ["/api/me", "/api/dashboard"]) {
      expect((await request(path + "?userId=" + me.user.id, a)).status).toBe(400);
    }
    expect((await (await request("/api/me", a)).json()).user.id).not.toBe(me.user.id);
    const before = await bob.getProfile();
    for (const patch of [
      { userId: me.user.id },
      { stack: [] },
      { goals: [" "] },
      { experience: "other" },
      { notes: "extra" },
    ]) {
      expect(
        (await request("/api/profile/questionnaire", a, "PUT", { ...questionnaire, ...patch }))
          .status,
      ).toBe(400);
    }
    expect((await request("/api/profile/questionnaire", a, "PUT", questionnaire)).status).toBe(200);
    expect(await bob.getProfile()).toEqual(before);
    expect(await (await request("/api/me", a)).json()).toMatchObject({
      onboarded: true,
      profile: { ...questionnaire, onboardedAt: expect.any(String) },
    });
    expect((await request("/", a)).status).toBe(200);
    expect((await request("/onboarding/connect", a)).status).toBe(200);
    expect((await (await request("/api/dashboard", a)).json()).tracks).not.toContainEqual(
      expect.objectContaining({ trackId: track.id }),
    );
    expect(await (await request(own[0][0], b)).json()).toMatchObject({
      topics: [{ id: topic.id, level: 0 }],
    });
    expect(await (await request(own[1][0], b)).json()).toMatchObject({
      topic: { id: topic.id },
      lessons: [{ id: lesson.id, readAt: null }],
      prerequisites: [],
      dependents: [],
    });
    const lessonView = await (await request(own[2][0], b)).json();
    expect(lessonView.lesson.blocks[0].questions[0]).toEqual({
      prompt: "Pick",
      options: ["A", "B"],
    });
    expect(lessonView).toMatchObject({
      lesson: { id: lesson.id },
      readAt: null,
      mastery: 0,
    });
    expect(await (await request(own[3][0], b, "POST")).json()).toMatchObject({ mastery: 1 });
    expect((await request(own[4][0], b, "POST", { answers: [20] })).status).toBe(400);
    expect(await (await request(own[4][0], b, "POST", { answers: [1] })).json()).toEqual({
      correct: 1,
      total: 1,
      perQuestion: [true],
      feedback: [{ correctIndex: 1 }],
      mastery: 2,
    });
    expect((await bob.getProgress()).recentQuizAttempts[0]).toMatchObject({ source: "ui" });
    expect((await (await request("/api/dashboard", b)).json()).tracks).toContainEqual(
      expect.objectContaining({ trackId: track.id, total: 1, completed: 1, percent: 100 }),
    );
  });

  async function issueToken(cookie: string) {
    const issued = await request("/api/mcp-tokens", cookie, "POST", { name: "Learning agent" });
    expect(issued.status).toBe(201);
    const result = await issued.json();
    expect(Object.keys(result).sort()).toEqual([
      "createdAt",
      "id",
      "lastUsedAt",
      "name",
      "prefix",
      "revokedAt",
      "token",
    ]);
    return result as { token: string; id: string; prefix: string };
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
    const body = await listed.text();
    expect(body.includes(token) || body.includes(stored.token_hash)).toBe(false);
    expect(JSON.parse(body)).toContainEqual({
      id,
      prefix,
      name: "Learning agent",
      createdAt: expect.any(String),
      lastUsedAt: null,
      revokedAt: null,
    });
  });

  function rpc(method: string, params: unknown, headers: Record<string, string> = {}) {
    return fetch(origin + "/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...headers,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
  }

  test("proxied OAuth and MCP requests use the configured public origin", async () => {
    const forwarded = { "x-forwarded-host": "startodel.example", "x-forwarded-proto": "https" };
    const start = await fetch(origin + "/auth/github", { redirect: "manual", headers: forwarded });
    expect(new URL(start.headers.get("location")!).searchParams.get("redirect_uri")).toBe(
      publicOrigin + "/auth/github",
    );
    const { token } = await issueToken(await signIn("alice"));
    const headers = { ...forwarded, authorization: "Bearer " + token, origin: publicOrigin };
    expect((await rpc("ping", {}, headers)).status).toBe(200);
    expect((await rpc("ping", {}, { ...headers, origin: "https://other.example" })).status).toBe(
      403,
    );
  });

  test("MCP challenges missing, malformed, unknown, revoked and cookie-only credentials before a Tool runs", async () => {
    const cookie = await signIn("alice");
    const { token, id } = await issueToken(cookie);
    expect((await request("/api/mcp-tokens/" + id, cookie, "DELETE")).status).toBe(204);
    const profile = await (await request("/api/profile", cookie)).json();
    const headersToReject: Record<string, string>[] = [
      {},
      { authorization: "Bearer invalid" },
      { authorization: "Bearer sto_" + "a".repeat(43) },
      { authorization: "Bearer " + token },
      { cookie },
      { cookie, authorization: "Bearer " + token },
      { accept: "text/html" },
    ];
    for (const headers of headersToReject) {
      const response = await rpc(
        "tools/call",
        { name: "update_profile", arguments: { goals: ["unauthorized"] } },
        headers,
      );
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toBe("Bearer");
    }
    expect((await fetch(origin + "/mcp")).status).toBe(401);
    expect(await (await request("/api/profile", cookie)).json()).toEqual(profile);
    const { rows } = await db.$client.query(
      "select last_used_at, revoked_at from mcp_tokens where id = $1",
      [id],
    );
    expect(rows[0]).toEqual({ last_used_at: null, revoked_at: expect.any(Date) });
  });

  test("only the issuing Session's User can list and revoke an MCP Token", async () => {
    const a = await signIn("alice");
    const b = await signIn("bob");
    const foreign = await issueToken(b);
    const list = await request("/api/mcp-tokens", a);
    expect(list.status).toBe(200);
    expect((await list.json()).some((row: { id: string }) => row.id === foreign.id)).toBe(false);
    for (const id of [foreign.id, crypto.randomUUID()]) {
      expect((await request("/api/mcp-tokens/" + id, a, "DELETE")).status).toBe(404);
    }
    for (const method of ["GET", "POST", "DELETE"]) {
      const path = "/api/mcp-tokens" + (method === "DELETE" ? "/" + foreign.id : "");
      const response = await fetch(origin + path, {
        method,
        headers: { authorization: "Bearer " + foreign.token },
      });
      expect(response.status).toBe(401);
    }
    const { rows } = await db.$client.query("select revoked_at from mcp_tokens where id = $1", [
      foreign.id,
    ]);
    expect(rows[0]).toEqual({ revoked_at: null });
  });

  test("the SDK client discovers the learning Tools and the Bearer Owner scopes every Profile and Track operation", async () => {
    const a = await signIn("alice");
    const b = await signIn("bob");
    const profileA = await (await request("/api/profile", a)).json();
    const profileB = await (await request("/api/profile", b)).json();
    const before = await (await request("/api/tracks", a)).json();
    const foreign = await (
      await request("/api/tracks", b, "POST", { title: "Private Track" })
    ).json();
    const bob = forUser(db, profileB.userId);
    const original = await bob.getTrack(foreign.id);
    expect(original).toMatchObject({ title: "Private Track" });
    const { token } = await issueToken(a);
    const client = new Client({ name: "integration-test", version: "1.0.0" });
    async function call(name: string, args: Record<string, unknown> = {}, error = false) {
      const result = CallToolResultSchema.parse(await client.callTool({ name, arguments: args }));
      expect(result.isError ?? false).toBe(error);
      const [content] = result.content;
      if (content?.type !== "text") throw new Error("Expected text content");
      return JSON.parse(content.text);
    }
    try {
      // Supply the other User's Session alongside the token on every request.
      await client.connect(
        new StreamableHTTPClientTransport(new URL("/mcp", origin), {
          requestInit: { headers: { authorization: "Bearer " + token, cookie: b } },
        }),
      );
      const { tools } = await client.listTools();
      expect(tools.map(({ name }) => name).sort()).toEqual([
        "add_edges",
        "add_grill_questions",
        "attach_topics_to_track",
        "create_lesson",
        "create_track",
        "detach_topic_from_track",
        "finish_grill",
        "get_grill",
        "get_grill_candidates",
        "get_guide",
        "get_lesson",
        "get_profile",
        "get_progress",
        "get_topic",
        "get_track",
        "get_track_graph",
        "judge_grill_answer",
        "list_due_reviews",
        "list_grills",
        "list_lessons",
        "list_topics",
        "list_tracks",
        "mark_lesson_read",
        "record_quiz_result",
        "record_review_result",
        "remove_edge",
        "set_mastery",
        "set_track_visibility",
        "start_grill",
        "submit_grill_answer",
        "update_lesson",
        "update_profile",
        "update_track",
        "upsert_topics",
      ]);
      for (const tool of tools) {
        expect(tool.description?.trim().length).toBeGreaterThan(0);
        expect(tool.inputSchema).toMatchObject({ type: "object", additionalProperties: false });
        expect(JSON.stringify(tool.inputSchema)).not.toMatch(/"(userId|ownerId|user_id)"\s*:/);
      }
      expect(await call("get_profile")).toEqual(profileA);
      const updated = await call("update_profile", { goals: ["Transactions"] });
      expect(updated).toMatchObject({ id: profileA.id, goals: ["Transactions"] });
      expect(await (await request("/api/profile", a)).json()).toEqual(updated);
      expect(await (await request("/api/profile", b)).json()).toEqual(profileB);

      const own = await call("create_track", { title: "Databases", slug: "db-foundations" });
      expect(own).toMatchObject({ title: "Databases", userId: profileA.userId });
      expect(await call("get_track", { id: own.id })).toEqual(own);
      expect(await call("list_tracks")).toEqual([...before, own]);
      const renamed = await call("update_track", { id: own.id, title: "Database design" });
      expect(renamed).toMatchObject({
        id: own.id,
        title: "Database design",
        slug: "db-foundations",
      });
      expect(await (await request("/api/tracks/" + own.id, a)).json()).toEqual(renamed);
      expect(await call("update_track", { id: own.id, slug: "database-design" })).toMatchObject({
        slug: "database-design",
      });
      const visibility = { trackId: own.id, public: true };
      expect(await call("set_track_visibility", visibility, true)).toEqual({
        error: `The user must accept the current Publishing rules and Terms of Use in the Startodel app before publishing. Ask them to open ${publicOrigin}/tracks/${own.id} and publish there once.`,
      });
      expect(
        (
          await request("/api/tracks/" + own.id + "/visibility", a, "PATCH", {
            public: true,
            acceptTerms: true,
          })
        ).status,
      ).toBe(200);
      for (const visible of [false, true, false])
        expect(
          await call("set_track_visibility", { ...visibility, public: visible }),
        ).toMatchObject({ public: visible });
      for (const id of [foreign.id, crypto.randomUUID()]) {
        expect(await call("set_track_visibility", { trackId: id, public: true }, true)).toEqual({
          error: "Not found",
        });
        expect(await call("get_track", { id }, true)).toEqual({ error: "Not found" });
        expect(await call("update_track", { id, title: "changed" }, true)).toEqual({
          error: "Not found",
        });
      }
      for (const [name, args] of [
        ["get_profile", { userId: profileB.userId }],
        ["create_track", { title: "   " }],
        ["create_track", { title: "Invalid slug", slug: "a/b" }],
        ["update_track", { id: own.id, slug: "Upper" }],
        ["set_track_visibility", { ...visibility, acceptTerms: true }],
        ["update_profile", { goals: [7] }],
        ["get_track", { id: "invalid" }],
        ["update_track", { id: foreign.id, title: "other", ownerId: profileB.userId }],
      ] as const) {
        expect((await client.callTool({ name, arguments: args })).isError).toBe(true);
      }
      expect(await bob.getTrack(foreign.id)).toEqual(original);
    } finally {
      await client.close();
    }
  });

  test("successful MCP requests advance lastUsedAt", async () => {
    const a = await signIn("alice");
    const { token, id } = await issueToken(a);
    const headers = { authorization: "Bearer " + token };
    async function lastUse() {
      const list = await (await request("/api/mcp-tokens", a)).json();
      return list.find((row: { id: string }) => row.id === id).lastUsedAt;
    }
    expect(await lastUse()).toBeNull();
    const first = await rpc("tools/list", {}, headers);
    expect(first.status).toBe(200);
    expect(Date.parse(await lastUse())).toBeGreaterThan(0);
    // An existing last-use value makes the second check independent of clock resolution.
    const earlier = "2000-01-01T00:00:00.000Z";
    await db.$client.query("update mcp_tokens set last_used_at = $1 where id = $2", [earlier, id]);
    const second = await rpc("tools/call", { name: "get_profile" }, headers);
    expect((await second.json()).result.content[0].type).toBe("text");
    const lastSuccessfulUse = await lastUse();
    expect(Date.parse(lastSuccessfulUse)).toBeGreaterThan(Date.parse(earlier));
    expect((await request("/api/mcp-tokens/" + id, a, "DELETE")).status).toBe(204);
    expect((await rpc("tools/list", {}, headers)).status).toBe(401);
    expect(await lastUse()).toBe(lastSuccessfulUse);
  });
});
