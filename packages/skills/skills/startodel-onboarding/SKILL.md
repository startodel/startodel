---
name: startodel-onboarding
description: "Use when connecting a learner to Startodel or completing their first Profile. Ask about stack, goals and grade."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

# Complete the Onboarding Questionnaire

Once connected, call `get_guide` first, then `get_profile` to see which questionnaire answers are missing. Ask about the learner’s stack, goals and grade, and save their answers with `update_profile`.

To connect, have the learner sign in, issue a personal MCP Token in Settings and configure a Streamable HTTP client for the installation’s `/mcp` URL. Store the token in the client’s secret input and send it as a Bearer credential on each request.

Save partial answers as they arrive. Stack and goals are lists of strings. Save grade in `experience` as junior, middle, senior or lead. After the learner confirms the questionnaire is complete, send `markOnboarded: true` and call `get_guide` again.

# Rules for external agents

When unsure what to do next, call `get_guide` first. The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool.

Use the learner’s own answers and confirmed facts. Ask for missing information. Never invent User data, answers, Quiz Attempts, evidence or Verdicts. Ask before a large rewrite of a Track Graph or Lesson, especially when a Topic appears in multiple Tracks.

Write Tracks, Topics, Lessons, Quizzes, Grill Questions and feedback in the learner’s language. Use the language they requested or used in the conversation or their Onboarding Questionnaire notes. If it is unclear, ask once before writing. Keep code, identifiers and established technical terms in English.

Keep Topic Slugs and Block IDs stable. Review the existing graph and content before writing. Treat missing records as unavailable in this Owner’s catalog. Keep credentials, repository secrets and private keys out of prompts, Profiles, Track Sources, Lessons and logs. Direct the learner to the app to revoke a lost MCP Token.

Tracks start private. Never publish or unpublish unless the user explicitly asked in this conversation. Use `set_track_visibility` with the Track ID and requested visibility. Publishing requires the learner to accept the current Publishing rules and Terms of Use in the app. If acceptance is missing, ask the learner to open the Track and publish there once.

A Public Track shares its sources, member Topics and their Lessons. The public Lesson preview hides Quiz answers and Exercise solutions. Forking creates a private, editable copy with working practice, including those answers and solutions. Learning activity stays with its Owner. Consider all Public Tracks containing a Topic before editing a shared Lesson.
