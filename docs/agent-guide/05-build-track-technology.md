---
id: build-track-technology
title: Build a Track around a technology
order: 5
---

# Build a Track around a technology

Agree on a concrete outcome, then use `create_track`, `upsert_topics`, `add_edges` and `attach_topics_to_track` to build a small first Track Graph.

For a goal like diagnosing slow queries, work backward from a query plan to scans, indexes and cardinality estimates. Search `list_topics` by slug prefix for reusable Topics. Batch up to 100 Topics and keep the returned IDs by slug. Add up to 200 directed prerequisite edges per call. Put the selected slugs in teaching order. Attaching puts these Topics first and keeps the remaining members in their previous order. Repeating the same order preserves membership and positions.

Read the graph back with `get_track_graph`. Use `remove_edge` to correct a prerequisite, `detach_topic_from_track` to remove a membership and `update_track` to revise the description or sources. Confirm large changes with the learner. Detaching a Topic preserves its Lessons.
