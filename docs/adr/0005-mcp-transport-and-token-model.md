# 5. MCP transport and token model

## Status

Accepted. [ADR 0019](0019-mcp-oauth-authorization.md) adds OAuth Connections.

## Context

An external agent needs to read and update one User's Profile and Tracks on a shared installation. A browser Session lets that User manage access. Each agent needs a credential the User can revoke independently.

## Decision

Serve stateless Streamable HTTP at `/mcp` using the official TypeScript SDK (`@modelcontextprotocol/sdk` 1.32.2) in a Nitro route. The Nuxt toolkit 0.24.4 supports Streamable HTTP, but its handler redirects requests accepting HTML before running its authentication middleware. Owning the route lets us challenge every unauthenticated request with HTTP 401 and `WWW-Authenticate: Bearer` before dispatch. Each authenticated POST gets its own server and transport. Tool results travel as JSON text. [SDK server guide](https://ts.sdk.modelcontextprotocol.io/server.html) · [Streamable HTTP specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)

A signed-in User creates a named MCP Token through the Session API. Generate 32 random bytes, encode them as base64url and prepend `sto_`. Return the plaintext once. Store its unique SHA-256 digest, a 12-character display prefix and lifecycle metadata. Resolve the Bearer credential with one SQL update that matches its digest, requires an unrevoked row, records the last use and returns its Owner's UUID. Revocation timestamps the row so the next request fails authentication.

Each MCP Token belongs to one User. Pass the resulting `forUser(db, userId)` into that request's Tools. The caller cannot supply an Owner argument because the credential determines whose data the caller may access. Each Tool has a strict input schema. Foreign and missing Tracks produce the same Tool error. Token management remains under the Session guard described in [ADR 0004](0004-authentication-and-per-user-isolation.md).

## Consequences

The server cannot recover a lost MCP Token. Its Owner can revoke it and create a replacement. Every authenticated MCP request writes a last-use timestamp to PostgreSQL. A copied Bearer credential grants access to the Owner's Tools until revocation.

HTTP tests use two signed-in Users, the built Nitro app, PostgreSQL and an SDK client. They exercise the six Tools, compare foreign and missing Track errors, and check the other Owner's stored Track after rejected writes. They also check hash-only storage, metadata visibility, revocation, last use, and which credentials each endpoint accepts. An import check covers the route and Tool implementations.
