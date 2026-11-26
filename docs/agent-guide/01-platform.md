---
id: platform
title: How Startodel works
order: 1
---

# How Startodel works

Call `get_guide` first. Use the learner’s Profile and goal to choose a Topic, teach its mechanism, then ask the learner to use it. Record their answer and evidence through the Tools. The MCP Token selects the Owner.

1. **Orient.** Read the Next Step and its reason. Use `get_progress` when choosing between studying, a GrillSession and due ReviewItems. Leave the learner with one activity they can start now.
2. **Locate the work.** A Topic lives once in the Owner’s Topic Catalog. Tracks order Topics, and TopicEdges connect prerequisites to dependents. Before teaching, identify the Topic whose Lessons and Mastery will carry across its Tracks.
3. **Close the loop.** Startodel scores Quizzes and schedules Reviews. You assess free-text Exercises and Grill Questions. Finish with the learner’s recorded result and the next action from `get_guide`.
