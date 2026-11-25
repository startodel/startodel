# 2. Database module placement

## Status

Accepted

## Context

The web app needs a database connection for its health endpoint. Contributors also need to generate and apply migrations independently of Nuxt. The schema could live under `apps/web/server/db` or in a workspace package. Keeping it with the HTTP handlers would simplify imports for the first caller but tie migration tooling and future consumers to the web app's directory and dependencies.

## Decision

Place the Drizzle schema, client factory, configuration, and generated migrations together in `packages/db` (`@startodel/db`). Expose the factory to server-side callers and run the package's migration commands through root scripts.

## Consequences

The web app imports a workspace dependency. Other server-side callers can use the same factory without loading Nuxt. Domain types in `@startodel/core` stay independent of persistence. Changes to the schema and its migration can be reviewed together.
