---
id: review-loop
title: Review due Topics
order: 9
---

# Review due Topics

Call `list_due_reviews`, ask the learner to recall or apply each Topic, then pass the assessed Verdict and a short reason to `record_review_result`. Use `set_mastery` when the evidence supports a change in depth.

A new ReviewItem starts in box 0. Strong advances one box up to 4, partial stays in the current box and weak resets to box 0. From the time of assessment, the resulting boxes 0 through 4 schedule the next review in 1, 3, 7, 16 and 35 elapsed days respectively. A weak Grill answer schedules tomorrow. Record a standalone review once. Judging a weak or partial Grill answer already schedules its linked Topic.

Mastery 0 means “don’t know.” The platform raises Mastery from 0 to 1 when every Lesson is read, and to 2 when every Quiz has a fully correct latest Quiz Attempt. Each rule requires at least one Lesson or Quiz respectively. Reading and Quiz results never lower Mastery. Use `set_mastery` with concrete evidence for level 3 when the learner explains why something works, or 4 when they can trace the internals. These levels belong to the external agent.

The Reviews page offers a Practice Quiz when the Topic contains Quiz Blocks. Submitting it records the Quiz Attempts and schedules the next ReviewItem automatically. Check the current ReviewItem before arranging another review.
