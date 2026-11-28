import { OAuthTokensSchema } from "@modelcontextprotocol/sdk/shared/auth.js";
import { exchangeOAuthCode, refreshOAuthGrant } from "@startodel/db";
import { database } from "../../lib/pool";
import { oauthEndpoint, publicOrigin, clientAuthentication, form } from "../../lib/oauth-http";
import { OAuthError, scope, resourceIndicator } from "../../lib/oauth-policy";
import { signAccess } from "../../lib/oauth-jwt";

export default oauthEndpoint("POST", true, async (event) => {
  const issuer = publicOrigin(event);
  const input = await form(event);
  const clientId = await clientAuthentication(event, input);
  const resource = resourceIndicator(issuer, input.resource);
  scope(input.scope);
  let grant;
  if (input.grant_type === "authorization_code") {
    const { code, redirect_uri: redirectUri, code_verifier: verifier } = input;
    if (!code || !redirectUri || !verifier || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier))
      throw new OAuthError("invalid_grant");
    grant = await exchangeOAuthCode(database(), {
      clientId,
      resource,
      code,
      redirectUri,
      verifier,
    });
  } else if (input.grant_type === "refresh_token") {
    if (!input.refresh_token) throw new OAuthError("invalid_request");
    grant = await refreshOAuthGrant(database(), clientId, resource, input.refresh_token);
  } else throw new OAuthError("unsupported_grant_type");
  if (!grant) throw new OAuthError("invalid_grant");
  return OAuthTokensSchema.parse({
    access_token: await signAccess(useRuntimeConfig().appSecret, issuer, grant),
    token_type: "Bearer",
    expires_in: 3600,
    scope: "mcp",
    refresh_token: grant.refreshToken,
  });
});
