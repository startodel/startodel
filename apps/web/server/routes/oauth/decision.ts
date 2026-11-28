import { sendRedirect } from "nuxt/server";
import { oauthEndpoint, publicOrigin, pendingRequest, form } from "../../lib/oauth-http";
import { OAuthError, redirectResult } from "../../lib/oauth-policy";
import { userData } from "../../lib/database";
export default oauthEndpoint("POST", false, async (event) => {
  const issuer = publicOrigin(event);
  if (event.req.headers.get("origin") !== issuer) throw new OAuthError("invalid_request", 403);
  const data = await userData(event);
  const pending = pendingRequest(await getUserSession(event));
  const { allow, deny } = await form(event);
  if (!pending || (allow === undefined) === (deny === undefined) || (allow ?? deny) !== pending.id)
    throw new OAuthError("invalid_request", 403);
  const decision = await data.connections.decide(pending.id, allow !== undefined);
  if (!decision) throw new OAuthError("invalid_request");
  return sendRedirect(
    event,
    redirectResult(
      decision.redirectUri,
      issuer,
      decision.state,
      decision.code ? { code: decision.code } : { error: "access_denied" },
    ),
    303,
  );
});
