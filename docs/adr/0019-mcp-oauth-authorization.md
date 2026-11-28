# 19. MCP OAuth authorization

## Status

Accepted. Extends [ADR 0005](0005-mcp-transport-and-token-model.md).

## Context

An MCP client such as ChatGPT can discover Startodel by URL. The learner needs to sign in with an existing Sign-in Method, see who is asking for access and disconnect that app independently from Settings.

## Decision

The Nitro app serves as both authorization server and resource server. It derives the issuer and resource URL from the configured public GitHub callback origin, as email sign-in does. Both RFC 9728 discovery paths identify the same MCP resource. The Bearer challenge links to the path-specific document. RFC 8414 metadata advertises S256, authorization code and refresh grants, dynamic registration, revocation and the single full-access scope `mcp`. Authorization responses carry the issuer (RFC 9207). Metadata, registration, token and revocation endpoints support browser CORS. [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)

Use the shared OAuth schemas from `@modelcontextprotocol/sdk` 1.32.2 with Nitro handlers. The SDK router targets Express. Register public and confidential OAuth Clients in PostgreSQL with exact redirect URIs, a self-declared name and a token endpoint authentication method. Client registrations are permanent so reconnecting after inactivity does not require registering again. Registration shares the IP rate limiter from ADR 0018, with its own bucket of 20 requests per 15 minutes. Confidential clients receive a high-entropy secret once and authenticate via Basic or POST. Store HMAC-SHA256 digests for client secrets, pending request handles, authorization codes and refresh tokens. Derive the storage key by applying HMAC-SHA256 to the label `startodel:oauth:v1` with `NUXT_APP_SECRET` as the key. Prefix each credential with its purpose and a zero byte before computing its digest. PKCE S256 uses SHA-256 of the verifier as specified by RFC 7636. DCR supports clients that register at connection time. Client ID Metadata Documents would require secure outbound fetching and cache management and are outside this implementation.

Validate the client, redirect URI, PKCE challenge, scope and resource before showing consent. A short-lived request lives in PostgreSQL. An unguessable handle in the sealed Session binds the consent form to the browser across email or GitHub sign-in. A new request in the same browser supersedes the previous form. Only a matching handle and a same-origin POST can approve or deny it. Approval consumes the request and creates a Connection for the Session's internal User UUID in one transaction. Each code has a five-minute lifetime. Its digest on the Connection binds it to the client, redirect, S256 challenge, resource and Owner. A second valid exchange revokes the Connection.

Use `jose` 6.2.18 for signing and verifying one-hour HS256 access JWTs. Both endpoints run in one trust domain, so a symmetric key avoids distributing or publishing another key. Web Crypto HKDF-SHA256 derives a dedicated, non-extractable HMAC key from `NUXT_APP_SECRET`. Verify the algorithm, token type, issuer, audience, expiry and claims. Each access supplies its subject, client and Connection ID for one indexed active-Connection update before entering the same Owner-scoped data layer as a personal MCP Token.

Issue 32 random bytes for each opaque refresh token. Store only its unique HMAC-SHA256 digest with a composite Owner/Connection foreign key. Lock the Connection before rotation. One current token exists per Connection. For 60 seconds from a token’s first rotation, a retry can retire the current token and receive a fresh pair. The spent token’s original deadline never moves. Keep spent digests to detect later reuse and revoke the entire Connection. Refresh or MCP access updates last use. At 90 days idle the Connection expires. Settings and RFC 7009 can revoke it immediately. A signed-in User can grant consent before completing the Onboarding Questionnaire and open Settings to manage an active Connection.

## Consequences

A database restart or app restart preserves Connections. Replicas share PostgreSQL and the same app secret. Rotating the app secret invalidates existing Sessions, access JWTs, pending requests, authorization codes and refresh tokens. Public clients can authorize again with their existing registration. Confidential clients need a new registration because their stored secret digests also depend on the previous key. Database storage for spent refresh digests grows with successful refreshes. The authorization server implements OAuth discovery and issues access tokens for the MCP endpoint only. OpenID Connect discovery returns 404.
