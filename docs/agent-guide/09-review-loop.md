---
id: review-loop
title: Review due Topics
order: 9
---

# Review due Topics

Call `list_due_reviews`, ask the learner to recall or apply each Topic, then pass the assessed Verdict and a short reason to `record_review_result`. Use `set_mastery` when the evidence supports a change in depth.

A new ReviewItem starts in box 0. Strong advances one box up to 4, partial stays in the current box and weak resets to box 0. From the time of assessment, the resulting boxes 0 through 4 schedule the next review in 1, 3, 7, 16 and 35 elapsed days respectively. A weak Grill answer schedules tomorrow. Record a standalone review once. Judging a weak or partial Grill answer already schedules its linked Topic.

Mastery 0 means “don’t know.” Use 1 after reading, 2 when the learner can apply the idea, 3 when they can explain why it works and 4 when they can trace the internals. Record concrete evidence for the level. Reading and Quiz scores can inform that judgment. The learner’s demonstrated behavior determines the assessment.
