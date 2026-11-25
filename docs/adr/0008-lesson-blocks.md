# 8. Lesson Blocks and content storage

## Status

Accepted

## Context

A Lesson can interleave prose, examples, external resources and practice. Recording an attempt requires a reference that survives reordering.

## Decision

Store full Lesson content as an ordered JSONB array of Theory, Code, Callout, Link, Video, Quiz and Exercise Blocks. Keep documentation and YouTube videos as links. Each Block carries a type and a stable ID unique in the Lesson. Validate writes with the shared Zod discriminated union and LessonBlocks schema in the framework-free core package.

## Consequences

A Lesson can be read or replaced in one operation. Reordering preserves Block identity. A Quiz Attempt records the chosen indices, Answer Source and score computed against the stored Quiz at submission time. Free-text Exercises are assessed by the User's external agent.
