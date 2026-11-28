import assert from "node:assert/strict";

const argument = process.argv[2];
if (!argument) throw new Error("Usage: node scripts/oauth-smoke.mjs <origin>");
const url = new URL(argument);
assert.ok(
  url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password,
  "Pass only the public origin",
);
const origin = url.origin;
const resource = origin + "/mcp";
const metadata = origin + "/.well-known/oauth-protected-resource/mcp";
const options = { redirect: "error", signal: AbortSignal.timeout(20000) };
const challenge = await fetch(resource, options);
assert.equal(challenge.status, 401);
assert.equal(challenge.headers.get("www-authenticate"), `Bearer resource_metadata="${metadata}"`);
for (const path of [metadata, origin + "/.well-known/oauth-protected-resource"]) {
  const response = await fetch(path, options);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.resource, resource);
  assert.deepEqual(body.authorization_servers, [origin]);
}
const response = await fetch(origin + "/.well-known/oauth-authorization-server", options);
assert.equal(response.status, 200);
const server = await response.json();
assert.equal(server.issuer, origin);
assert.deepEqual(server.code_challenge_methods_supported, ["S256"]);
assert.equal(new URL(server.registration_endpoint).origin, origin);
const client = await fetch(server.registration_endpoint, {
  ...options,
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    client_name: "Startodel smoke check",
    redirect_uris: ["http://127.0.0.1/callback"],
    token_endpoint_auth_method: "none",
  }),
});
assert.equal(client.status, 201);
const registration = await client.json();
assert.ok(registration.client_id);
assert.equal(registration.token_endpoint_auth_method, "none");
console.log("PASS discovery, Bearer challenge and public client registration at " + origin);
