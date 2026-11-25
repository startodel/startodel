# 6. Container image and startup migrations

## Status

Accepted

## Context

A self-hosted installation needs to upgrade the Nuxt server and its schema together while keeping PostgreSQL on a separate service. Dokploy can build a Dockerfile from the repository. Several replicas can start against the same database during an upgrade.

## Decision

Build one non-root Node.js image containing the Nitro node-server output, the committed migration SQL and its Drizzle journal. Before serving HTTP, run the Drizzle programmatic migrator through node-postgres. Hold a PostgreSQL session-level advisory lock on the connection that applies the migrations. Close that connection before starting the server.

Enable migrations by default. Operators can run the image's migration command separately and set `RUN_MIGRATIONS=false` or `0` on application replicas.

## Consequences

The application and migration command share a release and its runtime dependencies. Concurrent starters serialize their journal checks and SQL changes. A migration failure prevents the new replica from serving traffic. Enabling startup migrations requires database privileges for schema changes. Rolling back the application image leaves the database at its migrated version and may require restoring a backup. [Deployment guide](../deploy.md)
