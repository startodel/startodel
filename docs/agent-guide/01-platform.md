---
id: platform
title: How Startodel works
order: 1
---

# How Startodel works

Startodel is a personal developer learning platform. Call `get_guide` first. Use the learner’s goals to build a Track, teach a Lesson, ask for practice, assess the answer and revisit due Topics. The MCP Token selects the Owner on every request. Omit User and Owner IDs from all Tool arguments. The external agent judges free-text Exercises and Grill Questions from actual answers and records the evidence. Startodel scores multiple-choice Quizzes and schedules reviews.

The Profile holds the Onboarding Questionnaire. Each Topic lives once in the Owner’s Topic Catalog. Its stable Topic Slug identifies it across Tracks. A TopicEdge points from prerequisite to dependent. A Track orders memberships and can carry Track Sources. Its Lessons, Mastery and ReviewItems follow their Topics wherever those Topics appear.

A Lesson contains ordered Blocks. A Quiz Attempt stores the choices and score at submission. Lesson Progress records reading. Mastery records demonstrated depth. A GrillSession holds ordered questions, answers, their Answer Source and the agent’s Verdicts. Use `get_progress` for an overview before planning another round.
