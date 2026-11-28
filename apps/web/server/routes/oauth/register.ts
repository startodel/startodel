import { OAuthClientInformationFullSchema } from "@modelcontextprotocol/sdk/shared/auth.js";
import { allowAuthRequest, registerOAuthClient } from "@startodel/db";
import { getRequestIP } from "nuxt/server";
import { database } from "../../lib/pool";
import { oauthEndpoint, bodyText } from "../../lib/oauth-http";
import { OAuthError, registration } from "../../lib/oauth-policy";

export default oauthEndpoint("POST", true, async (event) => {
  const ip =
    getRequestIP(event, { xForwardedFor: process.env.TRUST_PROXY_IP !== "false" }) || "unknown";
  const secret = useRuntimeConfig().appSecret;
  if (!secret) throw new Error("NUXT_APP_SECRET is required");
  if (!(await allowAuthRequest(database(), secret, ip, "register")))
    throw new OAuthError("temporarily_unavailable", 429);
  const raw = await bodyText(event, "application/json");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new OAuthError("invalid_client_metadata");
  }
  const meta = registration(json);
  const client = await registerOAuthClient(database(), secret, {
    name: meta.client_name,
    redirectUris: meta.redirect_uris,
    authMethod: meta.token_endpoint_auth_method,
  });
  return Response.json(
    OAuthClientInformationFullSchema.parse({
      ...meta,
      client_id: client.id,
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      ...(client.secret && { client_secret: client.secret, client_secret_expires_at: 0 }),
    }),
    { status: 201 },
  );
});
