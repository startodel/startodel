# 7. Topic Graph and per-User Topic Catalog

## Status

Accepted

## Context

A learner may study the same Topic in several Tracks. Copying each Topic into each Track would give its Lessons and Mastery separate histories.

## Decision

Identify a Topic by its Owner and Topic Slug. A Track has positioned memberships in the Owner's Topic Catalog. A TopicEdge connects two distinct Topics in that catalog, directed from prerequisite to dependent. The Track Graph includes edges with both endpoints in the Track. Store Lessons in order within their Topic. A Track built from a GitHub repository uses the same model and records the repository and supporting documentation in Track Sources.

## Consequences

Reusing a Topic brings its Lessons and Mastery into another Track. Detaching it removes only the membership. The database rejects self-loops and duplicate edges. The external agent chooses prerequisites and handles cycles.
