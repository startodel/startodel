---
id: agent-workflow
title: Choose the next Topic
order: 4
---

# Choose the next Topic

Use `get_profile`, `get_progress`, `list_tracks` and `get_track_graph` to find a Topic that advances the learner’s goal. Inspect `get_topic` and `list_lessons` before deciding what to teach.

1. **Check readiness.** Choose a Topic whose prerequisites have all reached Mastery 2, including prerequisites outside this Track. A Topic is eligible while its Mastery is below 2 or any Lesson is unread. When the study Next Step includes a `lessonId`, open that unread Lesson with `get_lesson`. When none qualifies, identify the blocking prerequisite, a cycle or a completed Track before proposing a next move.
2. **Match the learner.** Use their current project or domain to choose an example in the Track’s technology. Adjust depth, pace and prerequisite review to the learner’s experience with this Topic. Keep any foundations they asked to learn. Read an existing Lesson with `get_lesson`, or use the Lesson workflow to write one. Continue when the learner has a specific question they will be able to answer.
3. **Try a variation.** Change one input or constraint and ask the learner to predict the effect. Assess their explanation against the evidence rules, then call `get_guide` once the result is recorded.
