import { test, expect, vi } from "vite-plus/test";
import { registration, scope, resourceIndicator } from "../server/lib/oauth-policy";

test("DCR accepts secure redirects and native loopback, rejects other origins and fragments", () => {
  for (const url of [
    "https://chatgpt.com/connector_platform_oauth_redirect",
    "http://localhost:8080/cb",
    "http://127.0.0.1/cb",
  ])
    expect(registration({ redirect_uris: [url] }).redirect_uris).toEqual([url]);
  for (const url of [
    "http://example.org/cb",
    "https://example.org/cb#frag",
    "https://name@example.org/cb",
    "http://localhost.example/cb",
    "file:///example",
  ])
    expect(() => registration({ redirect_uris: [url] })).toThrow();
  expect(() => registration({ redirect_uris: [] })).toThrow();
});
test("scope defaults to mcp and the resource indicator identifies the exact MCP endpoint", () => {
  for (const value of [undefined, "", "  ", "mcp"]) expect(scope(value)).toBe("mcp");
  expect(() => scope("mcp other")).toThrow();
  expect(() => resourceIndicator("https://example.org", "https://other.test/mcp")).toThrow();
});

test("access JWT verification pins the issuer, audience, signature, scope and expiration", async () => {
  const { signAccess, verifyAccess } = await import("../server/lib/oauth-jwt");
  const issuer = "https://startodel.example";
  const grant = {
    userId: crypto.randomUUID(),
    grantId: crypto.randomUUID(),
    clientId: crypto.randomUUID(),
    resource: issuer + "/mcp",
  };
  const secret = crypto.randomUUID();
  const token = await signAccess(secret, issuer, grant);
  expect(await verifyAccess(secret, issuer, token)).toEqual(grant);
  expect(await verifyAccess(crypto.randomUUID(), issuer, token)).toBeUndefined();
  for (const jwt of [
    await signAccess(secret, "https://foreign.example", grant),
    await signAccess(secret, issuer, { ...grant, resource: issuer + "/other" }),
  ])
    expect(await verifyAccess(secret, issuer, jwt)).toBeUndefined();
  const claims = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
  expect(claims.exp - claims.iat).toBe(3600);
  expect(claims.scope).toBe("mcp");
  vi.useFakeTimers();
  try {
    vi.setSystemTime(claims.exp * 1000);
    expect(await verifyAccess(secret, issuer, token)).toBeUndefined();
  } finally {
    vi.useRealTimers();
  }
});
