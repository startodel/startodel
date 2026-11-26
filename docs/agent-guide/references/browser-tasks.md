# Browser tasks and timers

Use this worked Lesson to check how the Blocks fit together. Run the snippet in a browser console and predict the order before reading the explanation.

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
