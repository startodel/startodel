---
id: lessons-and-blocks
title: Write a Lesson with Blocks
order: 7
---

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
