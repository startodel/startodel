# 11. Database-enforced ownership with composite foreign keys

## Status

Accepted

## Context

A foreign key on an ID verifies that the parent exists. A row carrying an Owner could still reference another Owner's parent by ID alone. Lessons now belong to a Topic that may appear in multiple Tracks.

## Decision

Give each learning row a non-null Owner referencing the User with cascading deletion. On each referenced user-owned parent, declare a unique key on `(user_id, id)`. Child relationships reference that key with `(user_id, parent_id)`, including nullable parent IDs. Keep the Owner predicate on every scoped operation in `forUser`. Treat missing and foreign parent IDs alike.

## Consequences

PostgreSQL rejects cross-Owner references from any writer. The data layer can scope a Lesson directly by Owner. Parent uniqueness constraints must exist before a migration adds child foreign keys. New learning tables and relationships need two-User isolation tests.
