import { randomInt, randomUUID } from "node:crypto";
import { expect, test } from "vite-plus/test";
import {
  forUser,
  signInWithGitHub,
  createDatabase,
  issueEmailChallenge,
  verifyEmailChallenge,
} from "@startodel/db";

const url = process.env.DATABASE_URL_TEST;
test.skipIf(!url)("a link and code racing for one challenge create exactly one User", async () => {
  const db = createDatabase(url!);
  const email = randomUUID() + "@example.test";
  const secret = randomUUID();
  try {
    const issued = await issueEmailChallenge(db, secret, " " + email.toUpperCase() + " ", null);
    if (!issued) throw new Error("expected a challenge");
    const row = await db.$client.query("select * from email_challenges where id=$1", [issued.id]);
    expect(row.rows[0].code_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.rows[0].token_hash).not.toBe(issued.token);
    const existing = await db.$client.query("select id from users where email=$1", [email]);
    expect(existing.rowCount).toBe(0);
    const results = await Promise.all([
      verifyEmailChallenge(db, secret, issued.id, { code: issued.code }, null),
      verifyEmailChallenge(db, secret, issued.id, { token: issued.token! }, null),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual(["expired", "ok"]);
    const created = await db.$client.query(
      "select handle, public_profile_enabled from users join profiles on users.id=profiles.user_id where email=$1",
      [email],
    );
    expect(created.rows).toEqual([{ handle: email.split("@")[0], public_profile_enabled: true }]);
  } finally {
    await db.$client.query("delete from users where email=$1", [email]);
    await db.$client.query("delete from email_challenges where email=$1", [email]);
    await db.$client.end();
  }
});

test.skipIf(!url)(
  "address quotas include every purpose and enforce rolling quarter-hour and daily windows",
  async () => {
    const db = createDatabase(url!);
    const email = randomUUID() + "@example.test";
    const secret = randomUUID();
    try {
      const issued = await Promise.all(
        Array.from({ length: 5 }, () => issueEmailChallenge(db, secret, email, null)),
      );
      expect(issued.filter(Boolean)).toHaveLength(3);
      for (let i = 0; i < 7; i++) {
        await db.$client.query(
          "update email_challenges set created_at=now()-interval '1 hour' where email=$1",
          [email],
        );
        expect(await issueEmailChallenge(db, secret, email, null)).toBeTruthy();
      }
      expect(await issueEmailChallenge(db, secret, email, null)).toBeNull();
      await db.$client.query(
        "update email_challenges set created_at=now()-interval '25 hours' where email=$1",
        [email],
      );
      expect(await issueEmailChallenge(db, secret, email, null)).toBeTruthy();
    } finally {
      await db.$client.query("delete from email_challenges where email=$1", [email]);
      await db.$client.end();
    }
  },
);

test.skipIf(!url)(
  "new email Users get a unique sanitized handle, and only verified provider emails attach a GitHub identity",
  async () => {
    const db = createDatabase(url!);
    const secret = randomUUID();
    const local = "test." + randomUUID().slice(0, 8);
    const base = local.replace(".", "-");
    const emails = [local + "@a.example", local + "@b.example"];
    const identity = {
      githubId: BigInt(-randomInt(1, 2 ** 46)),
      login: base,
      name: null,
      avatarUrl: null,
    };
    try {
      const git = await signInWithGitHub(db, identity);
      expect(await forUser(db, git.id).unlinkGitHub()).toBeUndefined();
      const first = await issueEmailChallenge(db, secret, emails[0]!, null);
      const result = await verifyEmailChallenge(db, secret, first!.id, { code: first!.code }, null);
      if (result.status !== "ok") throw new Error(result.status);
      expect(result.user.id).not.toBe(git.id);
      expect(result.user.login).toMatch(new RegExp("^" + base + "[0-9]+$"));
      const linked = await signInWithGitHub(db, {
        ...identity,
        githubId: identity.githubId - 1n,
        verifiedPrimaryEmail: emails[0]!.toUpperCase(),
      });
      expect(linked.id).toBe(result.user.id);
      const withEmail = await signInWithGitHub(db, {
        ...identity,
        verifiedPrimaryEmail: emails[1],
      });
      expect(withEmail.id).toBe(git.id);
      const change = await issueEmailChallenge(db, secret, emails[0]!, git.id);
      expect(change!.token).toBeNull();
      expect(
        (await verifyEmailChallenge(db, secret, change!.id, { code: change!.code }, linked.id))
          .status,
      ).toBe("expired");
      expect(
        (await verifyEmailChallenge(db, secret, change!.id, { code: change!.code }, git.id)).status,
      ).toBe("conflict");
      expect(await forUser(db, git.id).getSignInMethods()).toMatchObject({ email: emails[1] });
      expect(await forUser(db, git.id).unlinkGitHub()).toMatchObject({ id: git.id });
    } finally {
      await db.$client.query(
        "delete from users where email=any($1) or github_id=any($2::bigint[])",
        [emails, [identity.githubId, identity.githubId - 1n]],
      );
      await db.$client.query("delete from email_challenges where email=any($1)", [emails]);
      await db.$client.end();
    }
  },
);

test.skipIf(!url)("expiry and the fifth failed attempt disable both proofs", async () => {
  const db = createDatabase(url!);
  const email = randomUUID() + "@example.test",
    secret = randomUUID();
  try {
    const c = await issueEmailChallenge(db, secret, email, null);
    const wrong = c!.code === "123456" ? "000000" : "123456";
    for (let i = 4; i > 0; i--)
      expect(await verifyEmailChallenge(db, secret, c!.id, { code: wrong }, null)).toEqual({
        status: "wrong",
        remaining: i,
      });
    expect(await verifyEmailChallenge(db, secret, c!.id, { code: wrong }, null)).toEqual({
      status: "locked",
    });
    expect(await verifyEmailChallenge(db, secret, c!.id, { token: c!.token! }, null)).toEqual({
      status: "locked",
    });
    const later = await issueEmailChallenge(db, secret, email, null);
    await db.$client.query("update email_challenges set expires_at=now() where id=$1", [later!.id]);
    expect(await verifyEmailChallenge(db, secret, later!.id, { code: later!.code }, null)).toEqual({
      status: "expired",
    });
  } finally {
    await db.$client.query("delete from email_challenges where email=$1", [email]);
    await db.$client.end();
  }
});
