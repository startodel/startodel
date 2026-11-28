import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import type { Database } from "./index.ts";
import { authRateEvents, emailChallenges, users } from "./schema.ts";
import { accountForEmail, lockIdentity, normalizeEmail, sessionFields } from "./sign-in.ts";

function digest(secret: string, context: string, value: string) {
  const key = createHmac("sha256", secret).update("startodel:email:v1").digest();
  return createHmac("sha256", key)
    .update(context + "\0" + value)
    .digest("hex");
}

const quarterHour = sql`now() - interval '15 minutes'`;
const day = sql`now() - interval '24 hours'`;

export function allowAuthRequest(
  db: Database,
  secret: string,
  ip: string,
  action: "request" | "verify" | "register",
) {
  const key = digest(secret, action, ip);
  return db.transaction(async (tx) => {
    await lockIdentity(tx, key);
    await tx.delete(authRateEvents).where(lt(authRateEvents.createdAt, quarterHour));
    if (
      (await tx.$count(
        authRateEvents,
        and(eq(authRateEvents.key, key), gt(authRateEvents.createdAt, quarterHour)),
      )) >= (action === "verify" ? 60 : 20)
    )
      return false;
    await tx.insert(authRateEvents).values({ key });
    return true;
  });
}

export function issueEmailChallenge(
  db: Database,
  secret: string,
  address: string,
  owner: string | null,
) {
  const email = normalizeEmail(address);
  return db.transaction(async (tx) => {
    await lockIdentity(tx, "email:" + email);
    await tx.delete(emailChallenges).where(lt(emailChallenges.createdAt, day));
    const rows = await tx
      .select({
        recent: sql<number>`count(*) filter (where ${emailChallenges.createdAt} > ${quarterHour})::int`,
        daily: sql<number>`count(*)::int`,
      })
      .from(emailChallenges)
      .where(and(eq(emailChallenges.email, email), gt(emailChallenges.createdAt, day)));
    if (rows[0]!.recent >= 3 || rows[0]!.daily >= 10) return null;
    const id = randomUUID();
    const code = randomInt(1000000).toString().padStart(6, "0");
    const token = owner ? null : randomBytes(32).toString("base64url");
    await tx.insert(emailChallenges).values({
      id,
      email,
      purpose: owner ? "change_email" : "sign_in",
      userId: owner,
      codeHash: digest(secret, id + ":code", code),
      tokenHash: token && digest(secret, id + ":token", token),
    });
    return { id, email, code, token };
  });
}

export type EmailProof = { code: string } | { token: string };

export function verifyEmailChallenge(
  db: Database,
  secret: string,
  id: string,
  proof: EmailProof,
  owner: string | null,
) {
  return db.transaction(async (tx) => {
    const [challenge] = await tx
      .select()
      .from(emailChallenges)
      .where(
        and(
          eq(emailChallenges.id, id),
          owner ? eq(emailChallenges.userId, owner) : isNull(emailChallenges.userId),
        ),
      )
      .for("update");
    if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() <= Date.now())
      return { status: "expired" } as const;
    if (challenge.attempts >= 5) return { status: "locked" } as const;
    const byCode = "code" in proof;
    const stored = byCode ? challenge.codeHash : challenge.tokenHash;
    const given = byCode
      ? digest(secret, id + ":code", proof.code)
      : digest(secret, id + ":token", proof.token);
    if (!stored || !timingSafeEqual(Buffer.from(stored, "hex"), Buffer.from(given, "hex"))) {
      if (!byCode) return { status: "expired" } as const;
      const attempts = challenge.attempts + 1;
      await tx.update(emailChallenges).set({ attempts }).where(eq(emailChallenges.id, id));
      return attempts === 5
        ? ({ status: "locked" } as const)
        : ({ status: "wrong", remaining: 5 - attempts } as const);
    }
    await tx
      .update(emailChallenges)
      .set({ consumedAt: new Date() })
      .where(eq(emailChallenges.id, id));
    await lockIdentity(tx, "email:" + challenge.email);
    if (!owner) return { status: "ok", user: await accountForEmail(tx, challenge.email) } as const;
    const [used] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, challenge.email));
    if (used && used.id !== owner) return { status: "conflict" } as const;
    const [user] = await tx
      .update(users)
      .set({ email: challenge.email, updatedAt: new Date() })
      .where(eq(users.id, owner))
      .returning(sessionFields);
    return { status: "ok", user: user! } as const;
  });
}
