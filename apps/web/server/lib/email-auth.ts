import { defineHandler, createError, getRequestIP, readBody, type RequestEvent } from "nuxt/server";
import { allowEmailRequest, issueEmailChallenge, verifyEmailChallenge } from "@startodel/db";
import { z } from "zod";
import { database } from "./pool";
import { mailTransportMode } from "./mail-transport";
import { sendChallenge } from "./mail";
import { requireUser } from "../utils/require-user";

const requestInput = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  locale: z.enum(["en", "ru"]),
});
const codeInput = z.strictObject({ id: z.uuid(), code: z.string().regex(/^\d{6}$/) });
const tokenInput = z.strictObject({ id: z.uuid(), token: z.string().regex(/^[a-zA-Z0-9_-]{43}$/) });

function fail(status: number, reason: string, remaining?: number): never {
  throw createError({ status, message: "Email authentication", data: { reason, remaining } });
}

async function protection(event: RequestEvent, action: "request" | "verify") {
  if (mailTransportMode() === "unavailable") fail(503, "unavailable");
  const secret = useRuntimeConfig().appSecret;
  if (!secret) throw new Error("NUXT_APP_SECRET is required");
  const ip =
    getRequestIP(event, { xForwardedFor: process.env.TRUST_PROXY_IP !== "false" }) || "unknown";
  if (!(await allowEmailRequest(database(), secret, ip, action))) fail(429, "limited");
  // JSON prevents a third-party HTML form from submitting credentials or changing an address.
  if (event.req.headers.get("content-type")?.split(";")[0] !== "application/json")
    fail(415, "invalid");
  return secret;
}

export function requestEmail(change: boolean) {
  return defineHandler(async (event) => {
    const owner = change ? await requireUser(event) : null;
    const secret = await protection(event, "request");
    const input = requestInput.safeParse(await readBody(event));
    if (!input.success) fail(400, "invalid");
    const { email, locale } = input.data;
    const challenge = await issueEmailChallenge(database(), secret, email, owner);
    if (!challenge) fail(429, "limited");
    try {
      // Use the configured public origin for every deliverable email.
      const callback = useRuntimeConfig().oauth.github.redirectURL;
      if (!callback && mailTransportMode() === "smtp") throw new Error("Missing public origin");
      const link =
        challenge.token &&
        new URL(
          (locale === "ru" ? "/ru" : "") + "/signin/link#" + challenge.id + "." + challenge.token,
          callback || event.req.url,
        ).href;
      await sendChallenge(email, challenge.code, locale, link);
    } catch {
      console.error("Email Challenge delivery failed");
      fail(503, "delivery");
    }
    return { id: challenge.id };
  });
}

export function verifyEmail(change: boolean) {
  return defineHandler(async (event) => {
    const owner = change ? await requireUser(event) : null;
    const secret = await protection(event, "verify");
    const input = (change ? codeInput : z.union([codeInput, tokenInput])).safeParse(
      await readBody(event),
    );
    if (!input.success) fail(400, "invalid");
    const result = await verifyEmailChallenge(database(), secret, input.data.id, input.data, owner);
    if (result.status === "wrong") fail(400, "wrong", result.remaining);
    if (result.status !== "ok") fail(result.status === "conflict" ? 409 : 400, result.status);
    if (!owner) await replaceUserSession(event, { user: result.user });
    return { ok: true };
  });
}
