# 1. Record architecture decisions

## Status

Accepted

## Context

Startodel will grow through small pull requests. A diff shows what changed, but the reasons for a choice can be hard to recover from a closed discussion.

## Decision

Record each architecturally significant decision in a numbered Markdown file in `docs/adr/`. Use the Nygard sections Status, Context, Decision, and Consequences. When a later decision replaces an accepted one, add a new ADR and link it from the earlier record.

## Consequences

Contributors can find the rationale alongside the code and trace how it changed. Each architectural change requires a short record and an entry in the documentation index.
