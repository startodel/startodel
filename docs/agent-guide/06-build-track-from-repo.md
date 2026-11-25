---
id: build-track-from-repo
title: Build a Track from a repository
order: 6
skillDescription: Use when a learner wants a Track based on a repository. Ground Lessons on internals and version-specific features in the source, tests and documentation.
---

# Build a Track from a repository

Ask for the repository, the target revision or release and a task the learner wants to perform. Read the README, dependency manifest, relevant source entry points, tests and documentation for that revision. Follow one real call from public API to implementation.

Use `create_track` with an ordinary Track title, a description naming the revision, and Track Sources such as `{"repo":"https://github.com/vuejs/core","docs":["https://vuejs.org/guide/introduction.html"]}`. Read it back with `get_track`. Distinguish public behavior from internals in the Lessons. Tie version-specific features to a tag, release note or source permalink. Ask for access or a public reference when evidence is missing.

Find reusable Topics by slug with `list_topics`, then use `upsert_topics` for the Topics the task requires. Add prerequisite-to-dependent edges with `add_edges`, attach the selected slugs in teaching order with `attach_topics_to_track` and verify the result with `get_track_graph`. Keep repository-specific internals under a stable slug and point each Lesson at the code and tests supporting it.
