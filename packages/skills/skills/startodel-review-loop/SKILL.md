---
name: startodel-review-loop
description: "Review due Topics through a Practice Quiz or agent-led practice."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

# Review due Topics

Use `list_due_reviews` to choose a due ReviewItem and `get_profile` to calibrate practice. For an agent-led Review, record the Verdict with `record_review_result`. Use `set_mastery` for a change in demonstrated depth.

1. **Choose practice.** Read the due Topic and the last reason. For a Topic with Quizzes, offer the in-app Practice Quiz. Submission records Quiz Attempts and reschedules the ReviewItem. That branch ends with the returned result and next due time. For a free-text Review, agree on a task at the learner’s current level.
2. **Retrieve and transfer.** Test recall, application and explanation. Ask for the mental model from memory, then change one condition in a case from their stack and ask what happens and why. Wait for the learner’s own prediction and reasoning.
3. **Assess once.** Quote the part of the answer that determined the Verdict in the recorded reason. Tie the quoted reasoning to the shared strong, partial or weak criteria. Finish with one recorded ReviewItem update and its next due time.
4. **Choose the next challenge.** Use the shared Mastery criteria for evidence of greater depth. If the learner missed a condition, ask for a corrected prediction in a fresh case. End with a specific follow-up they can try before the next Review.

# Rules for external agents

Call `get_guide` on connection and after each learning step. Use the returned Next Step and its reason to pick the workflow.

1. **Personalize first.** Use `get_profile` to combine the Onboarding Questionnaire with what you already know about the learner’s stack, experience, current project and preferred language. For someone new to the subject, teach foundations through a concrete analogy, explain jargon before use and add one step at a time. With an experienced developer, skip known foundations and bridge from a familiar concept to mechanisms and tradeoffs. Choose the starting Topic, depth, examples and language from that picture. If uncertain, confirm the choice with the learner. Start when you can name a first question in their preferred language.
2. **Record evidence.** Use the learner’s own answer. For free text, a strong Verdict means the answer addresses the prompt accurately, partial identifies a sound idea missing a material condition, and weak identifies faulty reasoning or an inability to apply the idea. Set Mastery 3 only with evidence that the learner explains the mechanism, or 4 with a trace of the internals. Save the specific evidence with `set_mastery`.
3. **Protect the Owner.** The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool. Keep credentials out of prompts and learning records. If a token is lost, direct the learner to revoke it in Settings. Before a large rewrite, identify all affected Tracks and get the learner’s agreement. Preserve Topic Slugs and Block IDs across edits.
4. **Publish by request.** Tracks start private. Use `set_track_visibility` only when the learner explicitly requests that visibility change in this conversation. Publishing requires current Terms Acceptance in the app. If missing, direct the learner to the Track to accept the Publishing rules and Terms of Use. A Public Track shares Track Sources, member Topics and Lessons. Its public Lesson preview hides Quiz answers and Exercise solutions. A Fork starts private with working practice. Check the resulting visibility against the request.
