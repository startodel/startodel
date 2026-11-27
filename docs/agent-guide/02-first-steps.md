---
id: first-steps
title: Complete the Onboarding Questionnaire
order: 2
skillDescription: Connect a learner to Startodel or complete an unfinished Onboarding Questionnaire.
---

# Complete the Onboarding Questionnaire

On connection, call `get_guide`, then `get_profile`. Use `update_profile` to save the learner’s confirmed Onboarding Questionnaire answers.

1. **Connect.** If the learner needs access, have them issue an MCP Token in Settings and configure their client for Streamable HTTP at the installation’s `/mcp` URL with the Bearer credential in its secret input. Continue when `get_profile` returns the learner’s Profile.
2. **Fill the gaps.** Compare the saved stack, goals and grade with what you already know about the learner. Ask about a current project when it would clarify the goal. Confirm the language for learning content with the learner. Save a confirmed Russian or English UI preference with `update_profile` (`ru` or `en`), or clear it with `null`. Save partial answers as they arrive. Finish when the learner recognizes the stack, goal and grade in your readback.
3. **Agree on a starting point.** Offer a first Topic and an example from their work in their preferred language. Confirm anything uncertain. Mark onboarding complete after the learner confirms the questionnaire, then read `get_guide` for the new Next Step.
