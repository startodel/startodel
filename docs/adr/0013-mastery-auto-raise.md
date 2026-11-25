# 13. Mastery auto-raise

## Status

Accepted

## Context

Lesson Progress and scored Quiz Attempts provide evidence for the first two Mastery levels. A learner can produce that evidence in a Session or through an MCP Tool, across multiple Tracks sharing a Topic.

## Decision

In the same transaction as marking a Lesson read or recording a Quiz Attempt, serialize evidence updates for the Owner's Topic. Raise Mastery to 1 once all its Lessons are read, and to 2 once every Quiz in its current Lessons has a fully correct latest Quiz Attempt. Each rule requires at least one corresponding Lesson or Quiz. Identify a Quiz by Lesson and stable Block ID. Either action evaluates both rules and returns the resulting level.

## Consequences

Successful Quiz Attempts can raise Mastery before all Lessons are read. A later wrong answer blocks a new raise based on that Quiz until a fully correct attempt replaces it. Automatic updates never lower Mastery. Only the external agent assesses levels 3 and 4 through `set_mastery`. Track completion reflects these updates wherever the Topic appears.
