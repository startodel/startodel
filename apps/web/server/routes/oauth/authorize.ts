import { beginAuthorization, oauthClient } from "@startodel/db";
import { sendRedirect } from "nuxt/server";
import { z } from "zod";
import { database } from "../../lib/pool";
import { oauthEndpoint, publicOrigin, localized, consentPath } from "../../lib/oauth-http";
import {
  OAuthError,
  parameters,
  redirectResult,
  scope,
  resourceIndicator,
} from "../../lib/oauth-policy";

export default oauthEndpoint("GET", false, async (event) => {
  const input = parameters(new URL(event.req.url).searchParams);
  const issuer = publicOrigin(event);
  const id = input.client_id;
  const client = id && z.uuid().safeParse(id).success && (await oauthClient(database(), id));
  const redirectUri = input.redirect_uri;
  if (!client || !redirectUri || !client.redirectUris.includes(redirectUri))
    throw new OAuthError("invalid_request");
  const { state, code_challenge: challenge } = input;
  if (state !== undefined && (!/^[\x20-\x7e]+$/.test(state) || state.length > 2048))
    throw new OAuthError("invalid_request");
  try {
    if (input.response_type !== "code") throw new OAuthError("unsupported_response_type");
    if (
      input.code_challenge_method !== "S256" ||
      !challenge ||
      !/^[A-Za-z0-9_-]{43}$/.test(challenge)
    )
      throw new OAuthError("invalid_request");
    scope(input.scope);
    const resource = resourceIndicator(issuer, input.resource);
    const request = await beginAuthorization(database(), {
      clientId: client.id,
      redirectUri,
      challenge,
      state,
      resource,
    });
    const session = await getUserSession(event);
    await setUserSession(event, {
      secure: { oauthPending: { id: request, expires: Date.now() + 900000 } },
    });
    return sendRedirect(event, localized(event, session.user ? consentPath(request) : "/signin"));
  } catch (e) {
    if (!(e instanceof OAuthError)) throw e;
    return sendRedirect(event, redirectResult(redirectUri, issuer, state, { error: e.error }));
  }
});
