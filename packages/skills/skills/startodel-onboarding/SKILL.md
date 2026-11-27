---
name: startodel-onboarding
description: "Connect a learner to Startodel or complete an unfinished Onboarding Questionnaire."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

# Complete the Onboarding Questionnaire

On connection, call `get_guide`, then `get_profile`. Use `update_profile` to save the learner’s confirmed Onboarding Questionnaire answers.

1. **Connect.** If the learner needs access, have them issue an MCP Token in Settings and configure their client for Streamable HTTP at the installation’s `/mcp` URL with the Bearer credential in its secret input. Continue when `get_profile` returns the learner’s Profile.
2. **Fill the gaps.** Compare the saved stack, goals and grade with what you already know about the learner. Ask about a current project when it would clarify the goal. Confirm the language for learning content with the learner. Save a confirmed Russian or English UI preference with `update_profile` (`ru` or `en`), or clear it with `null`. Save partial answers as they arrive. Finish when the learner recognizes the stack, goal and grade in your readback.
3. **Agree on a starting point.** Offer a first Topic and an example from their work in their preferred language. Confirm anything uncertain. Mark onboarding complete after the learner confirms the questionnaire, then read `get_guide` for the new Next Step.

# Rules for external agents

Call `get_guide` on connection and after each learning step. Use the returned Next Step and its reason to pick the workflow.

1. **Personalize first.** Use `get_profile` to combine the Onboarding Questionnaire with what you already know about the learner’s stack, experience, current project and preferred language. For someone new to the subject, teach foundations through a concrete analogy, explain jargon before use and add one step at a time. With an experienced developer, skip known foundations and bridge from a familiar concept to mechanisms and tradeoffs. Choose the starting Topic, depth, examples and language from that picture. If uncertain, confirm the choice with the learner. Start when you can name a first question in their preferred language.
2. **Record evidence.** Use the learner’s own answer. For free text, a strong Verdict means the answer addresses the prompt accurately, partial identifies a sound idea missing a material condition, and weak identifies faulty reasoning or an inability to apply the idea. Set Mastery 3 only with evidence that the learner explains the mechanism, or 4 with a trace of the internals. Save the specific evidence with `set_mastery`.
3. **Protect the Owner.** The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool. Keep credentials out of prompts and learning records. If a token is lost, direct the learner to revoke it in Settings. Before a large rewrite, identify all affected Tracks and get the learner’s agreement. Preserve Topic Slugs and Block IDs across edits.
4. **Publish by request.** Tracks start private. Use `set_track_visibility` only when the learner explicitly requests that visibility change in this conversation. Publishing requires current Terms Acceptance in the app. If missing, direct the learner to the Track to accept the Publishing rules and Terms of Use. A Public Track shares Track Sources, member Topics and Lessons. Its public Lesson preview hides Quiz answers and Exercise solutions. A Fork starts private with working practice. Check the resulting visibility against the request.
