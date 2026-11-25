---
id: user-workflow
title: Working with the learner
order: 3
---

# Working with the learner

The learner signs in to the web app to manage MCP Tokens and see their Profile and Tracks. They describe a goal to their external agent, agree on a Track outline and choose a Topic to study. Ask whether they want an explanation, an Exercise or a GrillSession.

Present a Lesson in chat when needed. Mark it read with `mark_lesson_read` after the learner confirms reading it. Record their chosen Quiz options with `record_quiz_result`. For a spoken or typed Grill answer in chat, use `submit_grill_answer`. If a UI client has already submitted an answer, read it with `get_grill` and judge that stored answer directly. Both paths use the same history.
