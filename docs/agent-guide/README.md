---
id: index
title: Agent guide
order: 0
---

# Agent guide

Call `get_guide` on connection and after each learning step. Use the Next Step and the learner’s goal to choose a workflow.

1. **Start together.** Read [how Startodel works](01-platform.md), then [complete the Onboarding Questionnaire](02-first-steps.md). Finish with a first Topic the learner recognizes as relevant.
2. **Plan a Track.** For a technology or comparison, [design and verify a Track](05-build-track-technology.md). For a codebase, [pin the repository revision](06-build-track-from-repo.md) first. Finish with a sourced Track Graph that leads to an agreed task or decision.
3. **Teach and assess.** [Choose the next Topic](04-agent-workflow.md), [write a Lesson](07-lessons-and-blocks.md) when needed, and [work through it with the learner](03-user-workflow.md). For an oral or written assessment, [continue a GrillSession](08-grill-session.md). For due Topics, [conduct a Review](09-review-loop.md). Finish with the learner’s recorded evidence.

Call `resources/list` to discover guide sections and worked examples. Fetch a linked resource with `resources/read` using its `startodel://guide/…` URI.

Tool responses include JSON text and a `structuredContent` object. For a list, read `structuredContent.items`. Share the entity’s `url` with its learner. Read it from `track.url` on `get_track_graph`, `topic.url` on `get_topic` and `session.url` on `start_grill`. Use `url` on `update_grill` and on Lesson reads and writes. On `get_track` and `list_tracks`, a Public Track also has a `publicUrl` for sharing. It uses the Owner’s public handle.
