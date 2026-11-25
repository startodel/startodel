---
name: startodel-grill
description: "Use when a learner wants to start or resume a grill session. Ask one question at a time, judge saved answers and give feedback."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

# Continue a GrillSession

Use `list_grills` and `get_grill` to resume an open GrillSession. Choose prompts with `get_grill_candidates`, save them with `add_grill_questions`, capture chat answers with `submit_grill_answer` and assess them with `judge_grill_answer`. Close the round with `finish_grill`.

Use `start_grill` for a new round. The default target is 15 questions. A Track limits candidates to its members. Due ReviewItems come first, oldest first, followed by the weakest Topics. Select prompts that test recall, application and explanation. Attach each question to its Topic when possible. Add up to 30 questions in one call. Ask one at a time and wait for the learner’s own answer.

Give a strong Verdict for a correct answer that explains the mechanism or applies it accurately. Give partial for a sound core idea with an important missing condition. Give weak for an incorrect mechanism or an inability to apply it. Quote the specific part of the answer that informed the Verdict, explain one correction and offer a follow-up. Partial and weak Verdicts refresh a linked Topic’s ReviewItem. Finishing returns Verdict counts and weak Topics. Previously submitted answers can still be judged after finishing.

The learner can submit answers on the Grills page. Call `get_grill` to find answers with Answer Source `ui` and no Verdict. Pass each stored answer’s question ID to `judge_grill_answer` with specific feedback. The learner can refresh the question to see that judgment.

# Rules for external agents

When unsure what to do next, call `get_guide` first. The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool.

Use the learner’s own answers and confirmed facts. Ask for missing information. Never invent User data, answers, Quiz Attempts, evidence or Verdicts. Ask before a large rewrite of a Track Graph or Lesson, especially when a Topic appears in multiple Tracks.

Write Tracks, Topics, Lessons, Quizzes, Grill Questions and feedback in the learner’s language. Use the language they requested or used in the conversation or their Onboarding Questionnaire notes. If it is unclear, ask once before writing. Keep code, identifiers and established technical terms in English.

Keep Topic Slugs and Block IDs stable. Review the existing graph and content before writing. Treat missing records as unavailable in this Owner’s catalog. Keep credentials, repository secrets and private keys out of prompts, Profiles, Track Sources, Lessons and logs. Direct the learner to the app to revoke a lost MCP Token.

Tracks start private. Never publish or unpublish unless the user explicitly asked in this conversation. Use `set_track_visibility` with the Track ID and requested visibility. Publishing requires the learner to accept the current Publishing rules and Terms of Use in the app. If acceptance is missing, ask the learner to open the Track and publish there once.

A Public Track shares its sources, member Topics and their Lessons. The public Lesson preview hides Quiz answers and Exercise solutions. Forking creates a private, editable copy with working practice, including those answers and solutions. Learning activity stays with its Owner. Consider all Public Tracks containing a Topic before editing a shared Lesson.
