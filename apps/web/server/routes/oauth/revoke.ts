import { OAuthTokenRevocationRequestSchema } from "@modelcontextprotocol/sdk/shared/auth.js";
import { revokeOAuthAccess, revokeOAuthRefresh } from "@startodel/db";
import { database } from "../../lib/pool";
import { oauthEndpoint, publicOrigin, clientAuthentication, form } from "../../lib/oauth-http";
import { OAuthError } from "../../lib/oauth-policy";
import { verifyAccess } from "../../lib/oauth-jwt";
export default oauthEndpoint("POST", true, async (event) => {
  const appSecret = useRuntimeConfig().appSecret;
  const input = await form(event);
  const client = await clientAuthentication(event, input, appSecret);
  const parsed = OAuthTokenRevocationRequestSchema.safeParse(input);
  if (!parsed.success || !parsed.data.token) throw new OAuthError("invalid_request");
  const { token } = parsed.data;
  if (token.includes(".")) {
    const access = await verifyAccess(appSecret, publicOrigin(event), token);
    if (access?.clientId === client) await revokeOAuthAccess(database(), access);
  } else await revokeOAuthRefresh(database(), appSecret, client, token);
  return new Response(null, { status: 200 });
});
