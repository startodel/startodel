import {
  OAuthMetadataSchema,
  OAuthProtectedResourceMetadataSchema,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { oauthEndpoint, publicOrigin } from "./oauth-http";
import { grantTypes, methods } from "./oauth-policy";
export default oauthEndpoint("GET", true, (event) => {
  const origin = publicOrigin(event);
  if (new URL(event.req.url).pathname === "/.well-known/oauth-authorization-server")
    return OAuthMetadataSchema.parse({
      issuer: origin,
      authorization_endpoint: origin + "/oauth/authorize",
      token_endpoint: origin + "/oauth/token",
      registration_endpoint: origin + "/oauth/register",
      revocation_endpoint: origin + "/oauth/revoke",
      scopes_supported: ["mcp"],
      response_types_supported: ["code"],
      grant_types_supported: grantTypes,
      token_endpoint_auth_methods_supported: methods,
      revocation_endpoint_auth_methods_supported: methods,
      code_challenge_methods_supported: ["S256"],
      authorization_response_iss_parameter_supported: true,
    });
  return OAuthProtectedResourceMetadataSchema.parse({
    resource: origin + "/mcp",
    authorization_servers: [origin],
    scopes_supported: ["mcp"],
    bearer_methods_supported: ["header"],
  });
});
