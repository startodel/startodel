# 14. Practice Quiz scoring and UI Grill answers

## Status

Accepted

## Context

A learner can revisit a scheduled Topic and answer Grill Questions in a Session. The external agent already authors Lessons and assesses free-text answers.

## Decision

A Practice Quiz includes every Quiz question in the ReviewItem's Topic. Shuffle questions while preserving option order. Count each question once across Lessons and Blocks. All correct gives a strong Verdict, at least half correct gives partial, and fewer than half correct gives weak. A Topic needs at least one Quiz to use this workflow. For other Topics the learner asks their external agent to conduct the review.

Score against the stored Quizzes and record the UI Quiz Attempts, resulting Mastery and one ReviewItem update in one transaction. Apply the existing Mastery and Review Box rules. A revision identifies the presented Lessons and review. An edit or a completed review invalidates the revision and requires a fresh submission.

The UI accepts the first answer to an unanswered Grill Question in an open GrillSession. A saved answer is read-only in the UI. A repeat submission, a judged question or a finished session returns 409. Both interfaces preserve judged answers. Only the external agent adds questions and assesses free text. It can judge an existing answer after the session finishes.

## Consequences

The Lesson and Practice Quiz responses expose prompts and options before submission. Submitting a Lesson Quiz returns its feedback. An Exercise solution is fetched when the learner opens it. Quiz-based reviews and agent-led reviews use the same Review Box schedule. [ADR 0009](0009-mastery-and-leitner-reviews.md) · [ADR 0010](0010-grill-sessions.md) · [ADR 0013](0013-mastery-auto-raise.md)
