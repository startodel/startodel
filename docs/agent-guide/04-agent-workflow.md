---
id: agent-workflow
title: Choose the next Topic
order: 4
---

# Choose the next Topic

Use `get_progress`, `list_tracks` and `get_track_graph` to choose a Topic with Mastery below 2 whose prerequisites have reached level 2. Inspect `get_topic` and `list_lessons` before creating content.

Use the learner’s goal to select among eligible Topics. Check prerequisites across the Topic Catalog, including those outside the current Track. When a graph has no eligible Topic, check for an unmet external prerequisite, a cycle or a completed Track. Use `get_lesson` to teach existing material. Ask the learner to apply it and keep an example of their work as evidence for `set_mastery`. Call `get_guide` again after each round.
