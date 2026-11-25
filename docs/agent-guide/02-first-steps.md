---
id: first-steps
title: Complete the Onboarding Questionnaire
order: 2
skillDescription: Use when connecting a learner to Startodel or completing their first Profile. Ask about stack, goals and grade.
---

# Complete the Onboarding Questionnaire

Once connected, call `get_guide` first, then `get_profile` to see which questionnaire answers are missing. Ask about the learner’s stack, goals and grade, and save their answers with `update_profile`.

To connect, have the learner sign in, issue a personal MCP Token in Settings and configure a Streamable HTTP client for the installation’s `/mcp` URL. Store the token in the client’s secret input and send it as a Bearer credential on each request.

Save partial answers as they arrive. Stack and goals are lists of strings. Save grade in `experience` as junior, middle, senior or lead. After the learner confirms the questionnaire is complete, send `markOnboarded: true` and call `get_guide` again.
