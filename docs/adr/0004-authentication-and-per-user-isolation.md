# 4. Authentication and per-user isolation

## Status

Accepted

## Context

Anyone with a GitHub account can sign in to a public installation. A Track ID can come from a URL, so knowledge of an ID cannot grant access to the Track. GitHub logins and display names can change while a learner's records must keep the same Owner.

## Decision

Use GitHub OAuth through `nuxt-auth-utils`. The callback upserts the User by GitHub's numeric ID, refreshes display fields, and inserts an empty Profile if needed, all in one transaction. The Session's User contains the internal UUID, login, name, and avatar URL. The provider access token is used only during the OAuth exchange.

The module seals an HTTP-only cookie using a key derived from Nuxt's private `appSecret`. Nitro resolves `NUXT_SESSION_PASSWORD` into that setting at runtime. The module's session endpoint reads the Session and expires the cookie on logout.

API middleware requires a Session by default. The public exceptions are the exact health and module session paths and the authentication routes. Each learning-data handler also obtains its data access through `userData(event)`, which calls `requireUser(event)` and supplies the authenticated UUID to `forUser(db, userId)`.

Put all access to user-owned learning data in that scoped layer. Assign the Owner on insert. Include the Owner in the SQL predicate for every read, update, and delete, including mutations by ID. Scope a child such as a Lesson through its owning Track with a join or subquery. Return HTTP 404 for a missing or foreign row. Future MCP access tokens will each map to exactly one User and enter this same layer.

## Consequences

A handler cannot select an Owner from request input. Conditional writes perform the ownership check in the same statement as the mutation. A Session is stateless, so rotating its sealing secret invalidates existing cookies.

PostgreSQL tests exercise concurrent first sign-ins and every scoped operation with two Users. HTTP tests build the app and substitute a loopback provider for GitHub's token and identity endpoints. Both Users complete the real callback and send its sealed cookies to the real routes. Tests check anonymous requests, public health, Profile isolation, Track lists, identical 404 status for missing and foreign Tracks, and the Owner's unchanged database row after rejected writes. A source-import test checks the web server for raw schema imports.

[ADR 0011](0011-composite-ownership.md) updates child-row scoping for the per-User Topic Catalog and shared Lessons.
