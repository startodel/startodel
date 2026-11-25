---
id: first-steps
title: Complete the Onboarding Questionnaire
order: 2
---

# Complete the Onboarding Questionnaire

Read `get_profile`, ask about the learner’s stack, experience, years of experience, goals and constraints, and save their answers with `update_profile`.

Sign in, issue a personal MCP Token and configure a Streamable HTTP client for the installation’s `/mcp` URL. Store the token in the client’s secret input and send it as a Bearer credential on each request. Start with `get_guide`. Read the suggested sections through the returned resource URIs.

Save partial answers as they arrive. Stack and goals are lists of strings. Experience accepts junior, middle, senior or lead. Years range from 0 to 60. Notes can hold preferences such as time available. Leave unknown fields unset. After the learner confirms the questionnaire is complete, send `markOnboarded: true` and call `get_guide` again.
