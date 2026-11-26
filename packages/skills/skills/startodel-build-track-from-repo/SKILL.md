---
name: startodel-build-track-from-repo
description: "Use when a learner wants a Track based on a repository. Ground Lessons on internals and version-specific features in the source, tests and documentation."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

# Build a Track from a repository

Ask for the repository, the target revision or release and a task the learner wants to perform. Read the README, dependency manifest, relevant source entry points, tests and documentation for that revision. Follow one real call from public API to implementation.

Use `create_track` with an ordinary Track title, a description naming the revision, and Track Sources such as `{"repo":"https://github.com/vuejs/core","docs":["https://vuejs.org/guide/introduction.html"]}`. Read it back with `get_track`. Distinguish public behavior from internals in the Lessons. Tie version-specific features to a tag, release note or source permalink. Ask for access or a public reference when evidence is missing.

Find reusable Topics by slug with `list_topics`, then use `upsert_topics` for the Topics the task requires. Add prerequisite-to-dependent edges with `add_edges`, attach the selected slugs in teaching order with `attach_topics_to_track` and verify the result with `get_track_graph`. Keep repository-specific internals under a stable slug and point each Lesson at the code and tests supporting it.

# Write a Lesson with Blocks

Read `list_lessons` for the Topic and `get_lesson` before editing. Use `create_lesson` for a new Lesson or `update_lesson` for a patch. Supplying blocks replaces the entire ordered list. Preserve existing Block IDs when content moves. Each Lesson accepts up to 200 Blocks.

Write enough original text for the learner to explain the mechanism, trace an example and try a variation. Describe a concrete production symptom, how to reproduce it in a small example and how to recognize the fix. Label illustrative scenarios as examples. Link to source documentation and YouTube for deeper study. Keep third-party text at the source.

For a complete Block array, open the [browser tasks Lesson](references/browser-tasks.md).


Use a gotcha, production or tip Callout. A Quiz has one to three questions with two to six options each. Submit one zero-based option index per question. Assess Exercise reasoning in chat and record demonstrated Mastery with evidence.

Reading every Lesson in a Topic raises Mastery from 0 to 1. Passing every Quiz in the Topic on its latest Quiz Attempt raises Mastery to 2. The Topic must contain at least one relevant Lesson or Quiz. Both Tools return the resulting Mastery. The external agent assesses levels 3 and 4.

# Rules for external agents

When unsure what to do next, call `get_guide` first. The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool.

Use the learner’s own answers and confirmed facts. Ask for missing information. Never invent User data, answers, Quiz Attempts, evidence or Verdicts. Ask before a large rewrite of a Track Graph or Lesson, especially when a Topic appears in multiple Tracks.

Write Tracks, Topics, Lessons, Quizzes, Grill Questions and feedback in the learner’s language. Use the language they requested or used in the conversation or their Onboarding Questionnaire notes. If it is unclear, ask once before writing. Keep code, identifiers and established technical terms in English.

Keep Topic Slugs and Block IDs stable. Review the existing graph and content before writing. Treat missing records as unavailable in this Owner’s catalog. Keep credentials, repository secrets and private keys out of prompts, Profiles, Track Sources, Lessons and logs. Direct the learner to the app to revoke a lost MCP Token.

Tracks start private. Never publish or unpublish unless the user explicitly asked in this conversation. Use `set_track_visibility` with the Track ID and requested visibility. Publishing requires the learner to accept the current Publishing rules and Terms of Use in the app. If acceptance is missing, ask the learner to open the Track and publish there once.

A Public Track shares its sources, member Topics and their Lessons. The public Lesson preview hides Quiz answers and Exercise solutions. Forking creates a private, editable copy with working practice, including those answers and solutions. Learning activity stays with its Owner. Consider all Public Tracks containing a Topic before editing a shared Lesson.
