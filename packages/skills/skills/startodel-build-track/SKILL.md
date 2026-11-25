---
name: startodel-build-track
description: "Use when a learner wants a Track for a technology. Build its prerequisite graph and write Lessons for the selected Topics."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

# Build a Track around a technology

Agree on a concrete outcome, then use `create_track`, `upsert_topics`, `add_edges` and `attach_topics_to_track` to build a small first Track Graph.

For a goal like diagnosing slow queries, work backward from a query plan to scans, indexes and cardinality estimates. Search `list_topics` by slug prefix for reusable Topics. Batch up to 100 Topics and keep the returned IDs by slug. Add up to 200 directed prerequisite edges per call. Put the selected slugs in teaching order. Attaching puts these Topics first and keeps the remaining members in their previous order. Repeating the same order preserves membership and positions.

Read the graph back with `get_track_graph`. Use `remove_edge` to correct a prerequisite, `detach_topic_from_track` to remove a membership and `update_track` to revise the description or sources. Confirm large changes with the learner. Detaching a Topic preserves its Lessons.

# Write a Lesson with Blocks

Read `list_lessons` for the Topic and `get_lesson` before editing. Use `create_lesson` for a new Lesson or `update_lesson` for a patch. Supplying blocks replaces the entire ordered list. Preserve existing Block IDs when content moves. Each Lesson accepts up to 200 Blocks.

Write enough original text for the learner to explain the mechanism, trace an example and try a variation. Describe a concrete production symptom, how to reproduce it in a small example and how to recognize the fix. Label illustrative scenarios as examples. Link to source documentation and YouTube for deeper study. Keep third-party text at the source.

For example, a Lesson on browser tasks can use this Block array.

```json
[
  {
    "type": "theory",
    "id": "tasks",
    "markdown": "A browser runs a task to completion. A timer callback must wait until the current task returns, even if its delay has already elapsed."
  },
  {
    "type": "code",
    "id": "order",
    "language": "js",
    "code": "setTimeout(() => console.log('timer'), 0);\nconsole.log('sync');",
    "explanation": "The synchronous log runs before the queued timer."
  },
  {
    "type": "callout",
    "id": "latency",
    "variant": "production",
    "markdown": "Example: a large synchronous import parser delays clicks and timers. Measure the long task, then split the work or move parsing to a worker."
  },
  {
    "type": "link",
    "id": "docs",
    "title": "JavaScript execution model",
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model"
  },
  {
    "type": "video",
    "id": "talk",
    "title": "What the heck is the event loop anyway?",
    "url": "https://www.youtube.com/watch?v=8aGhZQkoFbQ"
  },
  {
    "type": "quiz",
    "id": "timers",
    "questions": [
      {
        "prompt": "Which message appears first?",
        "options": ["timer", "sync"],
        "correctIndex": 1,
        "explanation": "The current task finishes before the callback runs."
      }
    ]
  },
  {
    "type": "exercise",
    "id": "trace",
    "prompt": "Add a resolved Promise callback. Predict and explain all three logs.",
    "solution": "sync, then the Promise microtask, then the timer task.",
    "hints": ["When does the microtask queue drain?"]
  }
]
```

Use a gotcha, production or tip Callout. A Quiz has one to three questions with two to six options each. Submit one zero-based option index per question. Assess Exercise reasoning in chat and record demonstrated Mastery with evidence.

Reading every Lesson in a Topic raises Mastery from 0 to 1. Passing every Quiz in the Topic on its latest Quiz Attempt raises Mastery to 2. The Topic must contain at least one relevant Lesson or Quiz. Both Tools return the resulting Mastery. The external agent assesses levels 3 and 4.

# Rules for external agents

When unsure what to do next, call `get_guide` first. The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool.

Use the learner’s own answers and confirmed facts. Ask for missing information. Never invent User data, answers, Quiz Attempts, evidence or Verdicts. Ask before a large rewrite of a Track Graph or Lesson, especially when a Topic appears in multiple Tracks.

Write Tracks, Topics, Lessons, Quizzes, Grill Questions and feedback in the learner’s language. Use the language they requested or used in the conversation or their Onboarding Questionnaire notes. If it is unclear, ask once before writing. Keep code, identifiers and established technical terms in English.

Keep Topic Slugs and Block IDs stable. Review the existing graph and content before writing. Treat missing records as unavailable in this Owner’s catalog. Keep credentials, repository secrets and private keys out of prompts, Profiles, Track Sources, Lessons and logs. Direct the learner to the app to revoke a lost MCP Token.

Tracks start private. Never publish or unpublish unless the user explicitly asked in this conversation. Use `set_track_visibility` with the Track ID and requested visibility. Publishing requires the learner to accept the current Publishing rules and Terms of Use in the app. If acceptance is missing, ask the learner to open the Track and publish there once.

A Public Track shares its sources, member Topics and their Lessons. The public Lesson preview hides Quiz answers and Exercise solutions. Forking creates a private, editable copy with working practice, including those answers and solutions. Learning activity stays with its Owner. Consider all Public Tracks containing a Topic before editing a shared Lesson.
