import { jwtVerify, SignJWT, errors } from "jose";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { AccessGrant } from "@startodel/db";

const bytes = new TextEncoder();
async function signingKey(secret: string) {
  if (!secret) throw new Error("NUXT_APP_SECRET is required");
  const material = await crypto.subtle.importKey("raw", bytes.encode(secret), "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: bytes.encode("startodel"),
      info: bytes.encode("mcp:oauth:access:v1"),
    },
    material,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"],
  );
}
export async function signAccess(secret: string, issuer: string, grant: AccessGrant) {
  return new SignJWT({ client_id: grant.clientId, grant_id: grant.grantId, scope: "mcp" })
    .setProtectedHeader({ alg: "HS256", typ: "at+jwt" })
    .setIssuer(issuer)
    .setSubject(grant.userId)
    .setAudience(grant.resource)
    .setIssuedAt()
    .setExpirationTime("1h")
    .setJti(randomBytes(16).toString("base64url"))
    .sign(await signingKey(secret));
}
const claims = z.object({
  sub: z.uuid(),
  grant_id: z.uuid(),
  client_id: z.uuid(),
  scope: z.literal("mcp"),
  jti: z.string().min(1),
  exp: z.number(),
  aud: z.string(),
});
export async function verifyAccess(secret: string, issuer: string, token: string) {
  try {
    const { payload } = await jwtVerify(token, await signingKey(secret), {
      algorithms: ["HS256"],
      typ: "at+jwt",
      issuer,
      audience: issuer + "/mcp",
      requiredClaims: ["exp", "iat", "jti", "sub"],
    });
    const result = claims.safeParse(payload);
    if (result.success)
      return {
        userId: result.data.sub,
        grantId: result.data.grant_id,
        clientId: result.data.client_id,
        resource: result.data.aud,
      };
  } catch (e) {
    if (!(e instanceof errors.JOSEError)) throw e;
  }
}
