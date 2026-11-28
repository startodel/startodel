import { fork } from "node:child_process";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { expect, test } from "vite-plus/test";
import type { Database } from "@startodel/db";

export interface CapturedMail {
  subject: string;
  to: string;
  text: string;
  html: string;
}
export function emailHttpTests(
  env: () => {
    db: Database;
    sessionSecret: string;
    origin: string;
    publicOrigin: string;
    mail: Map<string, CapturedMail>;
    githubEmail: (login: string) => string;
  },
  request: (path: string, cookie?: string, method?: string, body?: unknown) => Promise<Response>,
  githubSignIn: (login: string) => Promise<string>,
) {
  const post = (path: string, body: unknown, cookie = "") => request(path, cookie, "POST", body);
  const issue = (email: string, locale = "en", cookie = "") =>
    post(
      cookie ? "/api/sign-in/email/request" : "/api/auth/email/request",
      { email, locale },
      cookie,
    );
  const verify = (id: string, code: string, cookie = "") =>
    post(cookie ? "/api/sign-in/email/verify" : "/api/auth/email/verify", { id, code }, cookie);
  const newAddress = () => randomUUID() + "@example.test";
  const session = (response: Response) =>
    response.headers
      .getSetCookie()
      .find((c) => c.startsWith("nuxt-auth-session="))!
      .split(";")[0]!;
  const result = async (email: string, locale = "en", owner = "") => {
    const response = await issue(email, locale, owner);
    expect(response.status).toBe(200);
    const { id } = await response.json();
    await expect.poll(() => env().mail.has(email)).toBe(true);
    const mail = env().mail.get(email)!;
    const code = mail.subject.match(/\d{6}$/)![0];
    expect(mail.html).toContain(code);
    expect(mail.text).toContain(code);
    env().mail.delete(email);
    return { id, code, mail };
  };
  const clear = async (emails: string[]) => {
    await env().db.$client.query("delete from email_challenges where email=any($1)", [emails]);
    await env().db.$client.query("delete from users where email=any($1) and github_id is null", [
      emails,
    ]);
  };

  async function withProductionServer(
    overrides: NodeJS.ProcessEnv,
    run: (origin: string) => Promise<void>,
  ) {
    const app = fork(new URL("./serve.mjs", import.meta.url), ["--built"], {
      execArgv: [],
      env: {
        ...process.env,
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL_TEST,
        NUXT_APP_SECRET: env().sessionSecret,
        SMTP_HOST: "",
        MAIL_TRANSPORT: "",
        ...overrides,
      },
    });
    try {
      const [{ port }] = await Promise.race([
        once(app, "message"),
        once(app, "exit").then(() => {
          throw new Error("Production fixture exited before listening");
        }),
      ]);
      await run("http://127.0.0.1:" + port);
    } finally {
      if (app.connected) app.disconnect();
    }
  }

  test("production without SMTP offers GitHub only and rejects email requests before creating or consuming a challenge", async () => {
    const address = newAddress(),
      pending = newAddress(),
      ownerAddress = newAddress();
    try {
      const owner = await result(ownerAddress);
      const cookie = session(await verify(owner.id, owner.code));
      expect(
        (
          await request("/api/profile/questionnaire", cookie, "PUT", {
            experience: "middle",
            stack: ["SQL"],
            goals: ["Learn"],
          })
        ).ok,
      ).toBe(true);
      const challenge = await result(pending);
      await withProductionServer({}, async (origin) => {
        const flag = await fetch(origin + "/api/auth/email/status");
        expect(flag.status).toBe(200);
        expect(await flag.json()).toEqual({ available: false });
        const signIn = await (await fetch(origin + "/ru/signin")).text();
        expect(signIn).toContain('href="/auth/github"');
        expect(signIn).not.toContain('type="email"');
        const settings = await (await fetch(origin + "/settings", { headers: { cookie } })).text();
        expect(settings).toContain(ownerAddress);
        expect(settings).toContain("Link GitHub");
        expect(settings).not.toMatch(/>Change email<|>Add email</);
        for (const prefix of ["/api/auth/email", "/api/sign-in/email"]) {
          for (const [action, body] of [
            ["request", { email: address, locale: "ru" }],
            ["verify", { id: challenge.id, code: challenge.code }],
          ] as const) {
            const response = await fetch(origin + prefix + "/" + action, {
              method: "POST",
              headers: { cookie, "content-type": "application/json" },
              body: JSON.stringify(body),
            });
            expect(response.status).toBe(503);
            expect((await response.json()).data.reason).toBe("unavailable");
          }
        }
        const rows = await env().db.$client.query(
          "select id from email_challenges where email=$1",
          [address],
        );
        expect(rows.rowCount).toBe(0);
        const github = await githubSignIn("bob");
        expect(
          (
            await fetch(origin + "/api/sign-in/github", {
              method: "DELETE",
              headers: { cookie: github },
            })
          ).status,
        ).toBe(503);
        expect((await (await request("/api/sign-in", github)).json()).github).toBe("bob");
      });
      expect((await verify(challenge.id, challenge.code)).status).toBe(200);
    } finally {
      await clear([address, pending, ownerAddress]);
    }
  });

  test("the built server sends localized multipart content and either proof opens the same Session", async () => {
    const email = newAddress();
    try {
      const first = await result(email);
      expect(first.mail.subject).toBe("Your Startodel sign-in code: " + first.code);
      const response = await verify(first.id, first.code);
      expect(response.status).toBe(200);
      const a = session(response);
      const me = await (await request("/api/me", a)).json();
      const second = await result(email, "ru");
      expect(second.mail.subject).toBe("Код входа в Startodel: " + second.code);
      const url = new URL(second.mail.text.match(/https:\/\/\S+/)![0]);
      expect(url.origin).toBe(env().publicOrigin);
      expect(url.pathname).toBe("/ru/signin/link");
      expect(second.mail.html).toContain(url.href);
      expect((await request(url.pathname)).status).toBe(200);
      const token = url.hash.split(".")[1];
      const linked = await post("/api/auth/email/verify", { id: second.id, token });
      expect(linked.status).toBe(200);
      expect((await (await request("/api/me", session(linked))).json()).user.id).toBe(me.user.id);
      expect((await verify(second.id, second.code)).status).toBe(400);
      expect(await (await request("/api/sign-in", a)).json()).toEqual({ email, github: null });
      expect(await (await request("/api/tracks", a)).json()).toEqual([]);
      const existing = await issue(email);
      const other = newAddress();
      const fresh = await issue(other);
      expect(existing.status).toBe(fresh.status);
      expect(Object.keys(await existing.json())).toEqual(Object.keys(await fresh.json()));
      await clear([other]);
    } finally {
      await clear([email]);
    }
  });

  test("the fifth wrong code kills both proofs, expired codes fail and the fourth send is limited", async () => {
    const email = newAddress();
    try {
      const c = await result(email);
      const wrong = c.code === "000000" ? "000001" : "000000";
      for (let left = 4; left >= 0; left--) {
        const response = await verify(c.id, wrong);
        expect((await response.json()).data).toMatchObject(
          left ? { reason: "wrong", remaining: left } : { reason: "locked" },
        );
      }
      expect((await (await verify(c.id, c.code)).json()).data.reason).toBe("locked");
      expect(
        (
          await (
            await post("/api/auth/email/verify", {
              id: c.id,
              token: c.mail.text.split("#")[1]!.split(".")[1]!.split("\n")[0],
            })
          ).json()
        ).data.reason,
      ).toBe("locked");
      const next = await result(email);
      await env().db.$client.query("update email_challenges set expires_at=now() where id=$1", [
        next.id,
      ]);
      expect((await (await verify(next.id, next.code)).json()).data.reason).toBe("expired");
      expect((await issue(email)).status).toBe(200);
      expect((await issue(email)).status).toBe(429);
    } finally {
      await clear([email]);
    }
  });

  test("verified GitHub email links both ways and Settings changes require the requesting Session", async () => {
    const { githubEmail } = env();
    const email = githubEmail("email-link");
    const other = newAddress();
    const unverified = githubEmail("alice");
    try {
      const c = await result(email);
      const a = session(await verify(c.id, c.code));
      const github = await githubSignIn("email-link");
      expect((await (await request("/api/me", github)).json()).user.id).toBe(
        (await (await request("/api/me", a)).json()).user.id,
      );
      expect((await (await request("/api/sign-in", a)).json()).github).toBe("email-link");
      const b = await githubSignIn("alice");
      expect((await request("/api/sign-in/github", b, "DELETE")).status).toBe(409);
      const separate = await result(unverified);
      const separateCookie = session(await verify(separate.id, separate.code));
      expect((await (await request("/api/sign-in", separateCookie)).json()).github).toBeNull();
      const c2 = await result(other, "en", a);
      expect(c2.mail.text).not.toContain("://");
      expect((await verify(c2.id, c2.code, b)).status).toBe(400);
      expect((await verify(c2.id, c2.code)).status).toBe(400);
      expect((await verify(c2.id, c2.code, a)).status).toBe(200);
      const conflict = await result(other, "en", b);
      expect((await verify(conflict.id, conflict.code, b)).status).toBe(409);
      expect((await request("/api/sign-in/github", a, "DELETE")).status).toBe(200);
      expect(await (await request("/api/sign-in", a)).json()).toEqual({
        email: other,
        github: null,
      });
      const start = await fetch(env().origin + "/auth/github", {
        method: "POST",
        redirect: "manual",
        headers: { cookie: a, origin: env().publicOrigin },
      });
      const location = new URL(start.headers.get("location")!);
      expect(location.searchParams.get("scope")).toContain("user:email");
      const cookies = start.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const callback = await request(
        "/auth/github?code=email-link&state=" + location.searchParams.get("state"),
        cookies,
      );
      expect(callback.headers.get("location")).toBe("/settings");
      expect(await (await request("/api/sign-in", session(callback))).json()).toEqual({
        email: other,
        github: "email-link",
      });
    } finally {
      await clear([email, other, unverified]);
    }
  });

  test("a GitHub-first User signs in by the verified primary address and keeps their private Tracks", async () => {
    const git = await githubSignIn("bob");
    const email = env().githubEmail("bob");
    const guest = newAddress();
    try {
      const { id, code } = await result(email);
      const cookie = session(await verify(id, code));
      expect((await (await request("/api/me", cookie)).json()).user.id).toBe(
        (await (await request("/api/me", git)).json()).user.id,
      );
      const track = await (
        await request("/api/tracks", cookie, "POST", { title: "Email isolation" })
      ).json();
      const another = await result(guest);
      const foreign = session(await verify(another.id, another.code));
      expect((await request("/api/tracks/" + track.id, foreign)).status).toBe(404);
      expect((await request("/api/tracks/" + track.id, git, "DELETE")).status).toBe(204);
    } finally {
      await clear([email, guest]);
    }
  });

  test.each([
    ["request", 20],
    ["verify", 60],
  ] as const)("IP ceiling on %s includes invalid submissions", async (action, max) => {
    const path = env().origin + "/api/auth/email/" + action;
    const client = action === "request" ? "192.0.2.20" : "192.0.2.60";
    const send = (forwarded = client + ", 192.0.2.1") =>
      fetch(path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": forwarded,
        },
        body: "{}",
      });
    for (let i = 0; i < max; i++) expect((await send()).status).toBe(400);
    expect((await send(client + ", 192.0.2.2")).status).toBe(429);
    expect((await send("192.0.2.99, 192.0.2.1")).status).toBe(400);
  });
  test("a direct deployment can ignore forwarded addresses and limit the socket peer", async () => {
    await withProductionServer(
      { TRUST_PROXY_IP: "false", MAIL_TRANSPORT: "capture", NUXT_APP_SECRET: randomUUID() },
      async (origin) => {
        expect(await (await fetch(origin + "/api/auth/email/status")).json()).toEqual({
          available: true,
        });
        for (let i = 0; i <= 20; i++) {
          const response = await fetch(origin + "/api/auth/email/request", {
            method: "POST",
            headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2." + i },
            body: "{}",
          });
          expect(response.status).toBe(i < 20 ? 400 : 429);
        }
      },
    );
  });
}
